const { retrieveSimilarDocuments } = require("./retriever");
const { ragPrompt } = require("./rag.prompt");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { generateWithFallback } = require("../providers/llm.provider");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");

// A reasonable L2 distance threshold. Lower is more similar.
// If the distance is greater than this, we consider it irrelevant to MediSync context.
const RELEVANCE_THRESHOLD = 1.3;

const generateAnswer = async (question, chatHistory = [], role = "patient") => {
  // 1. Search vector database for similar documents (returns [Document, score][])
  const results = await retrieveSimilarDocuments(question);
  
  // Filter by relevance threshold
  const relevantDocs = results
    .filter(([doc, score]) => score <= RELEVANCE_THRESHOLD)
    .map(([doc, score]) => doc);

  // 2. Build context
  const context = relevantDocs.length > 0 
    ? relevantDocs.map(doc => doc.pageContent).join("\n\n") 
    : ""; // Pass empty context if nothing is relevant, relying on LLM to gracefully handle it

  const sources = [...new Set(relevantDocs.map(doc => doc.metadata.source))];

  // 3. Format chat history for LangChain
  const formattedHistory = chatHistory.map(msg => 
    msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );

  // 4. Define the chain callback
  const chainCallback = (model) => ragPrompt.pipe(model).pipe(new StringOutputParser());

  // 5. Generate answer using fallback provider
  const answer = await generateWithFallback(chainCallback, {
    context,
    question,
    role,
    chat_history: formattedHistory
  });

  return { answer, sources };
};

module.exports = { generateAnswer };
