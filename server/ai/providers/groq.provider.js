const { ChatGroq } = require("@langchain/groq");

const getGroqProvider = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    modelName: 'llama-3.1-8b-instant',
    temperature: 0,
  });
};

module.exports = { getGroqProvider };
