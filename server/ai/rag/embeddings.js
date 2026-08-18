const { OpenAIEmbeddings } = require("@langchain/openai");

const getEmbeddings = () => {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });
};

module.exports = { getEmbeddings };
