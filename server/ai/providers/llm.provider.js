const { getOpenAIProvider } = require("./openai.provider");
const { getGroqProvider } = require("./groq.provider");

const generateWithFallback = async (chainCallback, inputs, options = {}) => {
  let primaryError = null;
  
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiModel = getOpenAIProvider();
      const chain = chainCallback(openaiModel);
      console.log("LLM provider: OpenAI");
      return await chain.invoke(inputs, options);
    } catch (error) {
      primaryError = error;
      console.warn(`[LLM Provider] OpenAI failed: ${error.message || error}. Falling back to Groq.`);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const groqModel = getGroqProvider();
      const chain = chainCallback(groqModel);
      console.log("LLM provider: Groq");
      return await chain.invoke(inputs, options);
    } catch (groqError) {
      console.error(`[LLM Provider] Groq fallback also failed: ${groqError.message || groqError}`);
      throw groqError;
    }
  }

  throw primaryError || new Error("No LLM API keys configured (OPENAI_API_KEY or GROQ_API_KEY required).");
};

const streamWithFallback = async (chainCallback, inputs, options = {}) => {
  let primaryError = null;
  
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiModel = getOpenAIProvider();
      const chain = chainCallback(openaiModel);
      console.log("LLM provider (Stream): OpenAI");
      return await chain.stream(inputs, options);
    } catch (error) {
      primaryError = error;
      console.warn(`[LLM Provider] OpenAI streaming failed: ${error.message || error}. Falling back to Groq.`);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const groqModel = getGroqProvider();
      const chain = chainCallback(groqModel);
      console.log("LLM provider (Stream): Groq");
      return await chain.stream(inputs, options);
    } catch (groqError) {
      console.error(`[LLM Provider] Groq streaming fallback failed: ${groqError.message || groqError}`);
      throw groqError;
    }
  }

  throw primaryError || new Error("No LLM API keys configured (OPENAI_API_KEY or GROQ_API_KEY required).");
};

module.exports = { generateWithFallback, streamWithFallback };
