require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { getEmbeddings } = require("./embeddings");

const ingestData = async () => {
  console.log("Starting data ingestion process...");
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set.");
    process.exit(1);
  }

  const knowledgeDir = path.join(__dirname, '..', '..', 'knowledge');
  if (!fs.existsSync(knowledgeDir)) {
    console.error("Knowledge directory not found.");
    process.exit(1);
  }

  const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.txt'));

  let allDocs = [];

  for (const file of files) {
    const text = fs.readFileSync(path.join(knowledgeDir, file), 'utf-8');
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    
    const docs = await splitter.createDocuments([text], [{ source: file }]);
    allDocs.push(...docs);
  }

  console.log(`Split into ${allDocs.length} chunks. Storing in ChromaDB...`);

  await Chroma.fromDocuments(
    allDocs,
    getEmbeddings(),
    {
      collectionName: "medisync-knowledge",
      url: process.env.CHROMA_URL || "http://localhost:8000"
    }
  );

  console.log("Ingestion complete!");
};

ingestData().catch(console.error);
