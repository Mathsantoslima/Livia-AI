const axios = require("axios");
const logger = require("../utils/logger");

// Claude é opcional - não lançar erro se não configurado
let claude = null;

if (process.env.CLAUDE_API_KEY) {
  // Cria cliente do Claude
  claude = axios.create({
    baseURL: "https://api.anthropic.com/v1",
    headers: {
      "x-api-key": process.env.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
  });

  // Testa conexão (usando modelo válido) - não bloqueia se falhar
  claude
    .post("/messages", {
      model: process.env.CLAUDE_MODEL || "claude-3-sonnet-20240229",
      max_tokens: 1,
      messages: [{ role: "user", content: "test" }],
    })
    .then(() => {
      logger.info("Conexão com Claude estabelecida com sucesso");
    })
    .catch((error) => {
      // Não encerrar o processo se Claude falhar - é opcional
      logger.warn(
        "Claude não disponível ou modelo inválido:",
        error.response?.data?.error?.message || error.message
      );
      logger.info(
        "Sistema continuará sem Claude (outros providers disponíveis)"
      );
    });
} else {
  logger.info(
    "Claude não configurado (CLAUDE_API_KEY não definida) - sistema continuará sem Claude"
  );
}

module.exports = { claude };
