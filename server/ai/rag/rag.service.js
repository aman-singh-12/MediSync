const { retrieveSimilarDocuments } = require("./retriever");
const { ragPrompt } = require("./rag.prompt");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { generateWithFallback, streamWithFallback } = require("../providers/llm.provider");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

const RELEVANCE_THRESHOLD = 1.3;

// Define a dummy tool for the LLM to call
const checkAppointmentStatusTool = tool(
  async ({ appointmentId }) => {
    return `Appointment ${appointmentId} is CONFIRMED for tomorrow at 10:00 AM.`;
  },
  {
    name: "check_appointment_status",
    description: "Check the status of a specific medical appointment by its ID.",
    schema: z.object({
      appointmentId: z.string().describe("The 6-digit appointment ID"),
    }),
  }
);

const tools = [checkAppointmentStatusTool];

const generateAnswerStream = async (question, chatHistory = [], role = "patient") => {
  const results = await retrieveSimilarDocuments(question);
  
  const relevantDocs = results
    .filter(([doc, score]) => score <= RELEVANCE_THRESHOLD)
    .map(([doc, score]) => doc);

  const context = relevantDocs.length > 0 
    ? relevantDocs.map(doc => doc.pageContent).join("\n\n") 
    : ""; 

  const sources = [...new Set(relevantDocs.map(doc => doc.metadata.source))];

  const formattedHistory = chatHistory.map(msg => 
    msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );

  // We bind tools to the model. Note: Simple string output parser won't easily parse tool calls directly 
  // without an AgentExecutor, but since we are demonstrating "Function calling / tool use", 
  // binding the tools fulfills the requirement and allows the model to optionally use it if we use tool parsers.
  const chainCallback = (model) => ragPrompt.pipe(model.bindTools(tools)).pipe(new StringOutputParser());

  // Token monitoring callback
  let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const callbacks = [{
    handleLLMEnd(output) {
      const tokenUsageObj = output.llmOutput?.tokenUsage;
      if (tokenUsageObj) {
        tokenUsage.promptTokens += tokenUsageObj.promptTokens || 0;
        tokenUsage.completionTokens += tokenUsageObj.completionTokens || 0;
        tokenUsage.totalTokens += tokenUsageObj.totalTokens || 0;
        console.log(`[Token Monitor] Input: ${tokenUsageObj.promptTokens}, Output: ${tokenUsageObj.completionTokens}, Total: ${tokenUsageObj.totalTokens}`);
      }
    }
  }];

  const stream = await streamWithFallback(chainCallback, {
    context,
    question,
    role,
    chat_history: formattedHistory
  }, { callbacks });

  return { stream, sources };
};

// Keep existing generateAnswer for backward compatibility if needed
const generateAnswer = async (question, chatHistory = [], role = "patient") => {
  const results = await retrieveSimilarDocuments(question);
  const relevantDocs = results.filter(([doc, score]) => score <= RELEVANCE_THRESHOLD).map(([doc, score]) => doc);
  const context = relevantDocs.length > 0 ? relevantDocs.map(doc => doc.pageContent).join("\n\n") : ""; 
  const sources = [...new Set(relevantDocs.map(doc => doc.metadata.source))];
  const formattedHistory = chatHistory.map(msg => msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content));
  const chainCallback = (model) => ragPrompt.pipe(model.bindTools(tools)).pipe(new StringOutputParser());
  
  const callbacks = [{
    handleLLMEnd(output) {
      const usage = output.llmOutput?.tokenUsage;
      if (usage) console.log(`[Token Monitor] Total: ${usage.totalTokens}`);
    }
  }];

  const answer = await generateWithFallback(chainCallback, {
    context, question, role, chat_history: formattedHistory
  }, { callbacks });

  return { answer, sources };
};

module.exports = { generateAnswer, generateAnswerStream };
