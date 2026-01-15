const logger = require("../utils/logger");

// Validar variáveis de ambiente obrigatórias
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "GOOGLE_AI_API_KEY", // Nova infraestrutura de IA
  "JWT_SECRET",
];

// Variáveis opcionais (usadas em código legado)
const optionalEnvVars = [
  "OPENAI_API_KEY",
  "CLAUDE_API_KEY",
  "EVOLUTION_API_URL",
  "EVOLUTION_API_KEY",
  "GEMINI_MODEL",
];

function validateEnvironment() {
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    logger.error(
      `Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(
        ", "
      )}`
    );
    process.exit(1);
  }

  logger.info("Validação do ambiente concluída com sucesso");
}

// Configurações do sistema
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  defaultLanguage: process.env.DEFAULT_LANGUAGE || "pt-BR",
  timezone: process.env.TIMEZONE || "America/Sao_Paulo",
  jwtExpiration: process.env.JWT_EXPIRATION || "24h",

  // Configurações de rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por janela
  },

  // Configurações de cache
  cache: {
    ttl: 60 * 60, // 1 hora
    checkPeriod: 60 * 10, // 10 minutos
  },

  // Configurações de logging
  logging: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    maxSize: "20m",
    maxFiles: "14d",
  },
};

module.exports = {
  config,
  validateEnvironment,
};
