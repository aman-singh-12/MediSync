const { ChatOpenAI } = require("@langchain/openai");

const getOpenAIProvider = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
  });
};

module.exports = { getOpenAIProvider };
