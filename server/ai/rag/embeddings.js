const { Embeddings } = require("@langchain/core/embeddings");
const { pipeline } = require("@xenova/transformers");

class LocalEmbeddings extends Embeddings {
  constructor(options = {}) {
    super(options);
    this.modelName = options.modelName || 'Xenova/all-MiniLM-L6-v2';
    // Initialize the pipeline promise once
    this.pipelinePromise = pipeline('feature-extraction', this.modelName);
  }
  
  async embedDocuments(texts) {
    const pipe = await this.pipelinePromise;
    const embeddings = [];
    for (const text of texts) {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(output.data));
    }
    return embeddings;
  }
  
  async embedQuery(text) {
    const pipe = await this.pipelinePromise;
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

let embeddingsInstance = null;

const getEmbeddings = () => {
  if (!embeddingsInstance) {
    embeddingsInstance = new LocalEmbeddings();
  }
  return embeddingsInstance;
};

module.exports = { getEmbeddings, LocalEmbeddings };
