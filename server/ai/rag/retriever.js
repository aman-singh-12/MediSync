const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { getEmbeddings } = require("./embeddings");

const getVectorStore = async () => {
  return await Chroma.fromExistingCollection(
    getEmbeddings(),
    {
      collectionName: "medisync-knowledge",
      url: process.env.CHROMA_URL || "http://localhost:8000"
    }
  );
};

const retrieveSimilarDocuments = async (query, topK = 3) => {
  const vectorStore = await getVectorStore();
  // Using similaritySearchWithScore to evaluate relevance
  const results = await vectorStore.similaritySearchWithScore(query, topK);
  return results;
};

module.exports = { getVectorStore, retrieveSimilarDocuments };
