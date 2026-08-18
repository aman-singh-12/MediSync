const { ChatOpenAI } = require("@langchain/openai");
const { retrieveSimilarDocuments } = require("./retriever");
const { ragPrompt } = require("./rag.prompt");
const { StringOutputParser } = require("@langchain/core/output_parsers");

const generateAnswer = async (question) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  // 1. Search vector database for similar documents
  const documents = await retrieveSimilarDocuments(question);
  
  if (!documents || documents.length === 0) {
    return {
      answer: "I don't have any relevant information regarding that question in my knowledge base.",
      sources: []
    };
  }

  // 2. Build context
  const context = documents.map(doc => doc.pageContent).join("\n\n");
  const sources = [...new Set(documents.map(doc => doc.metadata.source))];

  // 3. Initialize LLM
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
  });

  // 4. Create and run the chain
  const chain = ragPrompt.pipe(model).pipe(new StringOutputParser());
  const answer = await chain.invoke({
    context,
    question
  });

  return { answer, sources };
};

module.exports = { generateAnswer };
