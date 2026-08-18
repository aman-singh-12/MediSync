require('dotenv').config();
const { generateAnswer } = require('./ai/rag/rag.service');

async function test() {
  console.log("Testing RAG Generation with query: What should I know before a fasting blood test?");
  try {
    const result = await generateAnswer("What should I know before a fasting blood test?");
    console.log("\nANSWER:");
    console.log(result.answer);
    console.log("\nSOURCES:", result.sources);
  } catch (err) {
    console.error("\nTest failed:", err);
  }
}

test();
