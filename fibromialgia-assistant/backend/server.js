/**
 * Servidor principal para o assistente de fibromialgia
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { config } = require("./src/config");
const logger = require("./src/utils/logger");
const { ErrorHandler } = require("./src/utils/errorHandler");

// Inicializar aplicação Express
const app = express();
const port = config.port || 3000;

// Configurações de middleware
app.use(helmet()); // Segurança
app.use(cors()); // CORS
app.use(express.json({ limit: "10mb" })); // Limite para JSON
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging de requisições HTTP
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Rotas
try {
  // Importar e usar rotas
  const apiRoutes = require("./src/routes/index");
  const webhookRoutes = require("./src/routes/webhookRoutes");

  // Configurar rotas
  app.use("/api", apiRoutes);
  app.use("/webhook", webhookRoutes);
  app.use("/", apiRoutes);

  // Rota de saúde/healthcheck
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "online",
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || "1.0.0",
    });
  });
} catch (error) {
  logger.error("Erro ao configurar rotas:", error);
}

// Handler para rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      code: 404,
      message: "Recurso não encontrado",
      path: req.path,
    },
  });
});

// Middleware de tratamento de erros
app.use(ErrorHandler.expressErrorHandler);

// Exportar app para Vercel (serverless)
module.exports = app;

// Iniciar servidor apenas se não estiver no Vercel
if (require.main === module) {
  const server = app.listen(port, () => {
    logger.info(`Servidor iniciado em http://localhost:${port}`);
    logger.info(`Ambiente: ${config.nodeEnv}`);
  });
}

// Gerenciamento de erros não capturados
process.on("uncaughtException", (error) => {
  logger.error("Erro não capturado:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promessa rejeitada não tratada:", { reason, promise });
});

// Graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  logger.info("Recebido sinal de encerramento. Fechando servidor...");
  server.close(() => {
    logger.info("Servidor encerrado com sucesso.");
    process.exit(0);
  });

  // Forçar encerramento após 10 segundos se não fechar normalmente
  setTimeout(() => {
    logger.error(
      "Não foi possível encerrar o servidor graciosamente. Forçando encerramento."
    );
    process.exit(1);
  }, 10000);
}

module.exports = server;
