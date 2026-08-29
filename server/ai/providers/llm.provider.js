const { getOpenAIProvider } = require("./openai.provider");
const { getGroqProvider } = require("./groq.provider");

const generateWithFallback = async (chainCallback, inputs) => {
  try {
    const openaiModel = getOpenAIProvider();
    const chain = chainCallback(openaiModel);
    console.log("LLM provider: OpenAI");
    return await chain.invoke(inputs);
  } catch (error) {
    // Only fallback for typical API errors like rate limits, quota, timeouts
    const isApiError = error.status === 429 || error.status >= 500 || error.message.includes('quota') || error.message.includes('timeout') || error.message.includes('rate limit');
    
    if (isApiError) {
      console.warn(`OpenAI failed: ${error.message}`);
      console.warn("Falling back to Groq");
      
      try {
        const groqModel = getGroqProvider();
        const chain = chainCallback(groqModel);
        console.log("LLM provider: Groq");
        return await chain.invoke(inputs);
      } catch (groqError) {
        console.error(`Groq fallback also failed: ${groqError.message}`);
        throw groqError;
      }
    }
    
    // If it's a programming error or another type of error, throw it immediately
    throw error;
  }
};

const streamWithFallback = async (chainCallback, inputs) => {
  try {
    const openaiModel = getOpenAIProvider();
    const chain = chainCallback(openaiModel);
    console.log("LLM provider (Stream): OpenAI");
    return await chain.stream(inputs);
  } catch (error) {
    const isApiError = error.status === 429 || error.status >= 500 || error.message.includes('quota') || error.message.includes('timeout') || error.message.includes('rate limit');
    
    if (isApiError) {
      console.warn(`OpenAI streaming failed: ${error.message}. Falling back to Groq.`);
      try {
        const groqModel = getGroqProvider();
        const chain = chainCallback(groqModel);
        console.log("LLM provider (Stream): Groq");
        return await chain.stream(inputs);
      } catch (groqError) {
        throw groqError;
      }
    }
    throw error;
  }
};

module.exports = { generateWithFallback, streamWithFallback };
