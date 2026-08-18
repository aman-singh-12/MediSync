const { retrieveSimilarDocuments } = require("./retriever");
const { ragPrompt } = require("./rag.prompt");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { generateWithFallback } = require("../providers/llm.provider");

const generateAnswer = async (question) => {
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

  // 3. Define the chain callback
  const chainCallback = (model) => ragPrompt.pipe(model).pipe(new StringOutputParser());

  // 4. Generate answer using fallback provider
  const answer = await generateWithFallback(chainCallback, {
    context,
    question
  });

  return { answer, sources };
};

module.exports = { generateAnswer };
