const { ChatGroq } = require("@langchain/groq");

const getGroqProvider = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    temperature: 0,
    maxTokens: 1024,
  });
};

module.exports = { getGroqProvider };
