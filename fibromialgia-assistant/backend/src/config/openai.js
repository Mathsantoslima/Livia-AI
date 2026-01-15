const { OpenAI } = require("openai");
const logger = require("../utils/logger");

// Verifica variável de ambiente
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY não definida");
}

// Cria cliente do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Testa conexão
openai.models
  .list()
  .then(() => {
    logger.info("Conexão com OpenAI estabelecida com sucesso");
  })
  .catch((error) => {
    logger.error("Erro ao conectar com OpenAI:", error);
    process.exit(1);
  });

module.exports = { openai };
