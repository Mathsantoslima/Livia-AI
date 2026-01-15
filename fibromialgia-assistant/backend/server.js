/**
 * Servidor principal para o assistente de fibromialgia
 */

// Carregar variáveis de ambiente primeiro
require("dotenv").config();

// Tratamento de erro global para capturar erros de inicialização
process.on("uncaughtException", (error) => {
  console.error("❌ Erro não capturado durante inicialização:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promessa rejeitada não tratada:", reason);
});

let app;
try {
  const express = require("express");
  const cors = require("cors");
  const morgan = require("morgan");
  const helmet = require("helmet");
  const { config } = require("./src/config");
  const logger = require("./src/utils/logger");
  const { ErrorHandler } = require("./src/utils/errorHandler");

  // Inicializar aplicação Express
  app = express();
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

    // Rota de saúde/healthcheck (deve vir antes do handler 404)
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "online",
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: process.env.npm_package_version || "1.0.0",
      });
    });

    // Rota para favicon.ico (evita erro 500)
    app.get("/favicon.ico", (req, res) => {
      res.status(204).end();
    });
  } catch (error) {
    console.error("❌ Erro ao configurar rotas:", error);
    // Criar rota de erro para não quebrar completamente
    app.get("/health", (req, res) => {
      res.status(500).json({
        status: "error",
        message: "Erro ao inicializar rotas",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    });
  }

  // Handler para rotas não encontradas (deve vir antes do error handler)
  app.use((req, res, next) => {
    // Ignorar favicon.ico silenciosamente
    if (req.path === "/favicon.ico") {
      return res.status(204).end();
    }
    
    res.status(404).json({
      error: {
        code: 404,
        message: "Recurso não encontrado",
        path: req.path,
      },
    });
  });

  // Middleware de tratamento de erros
  try {
    app.use(ErrorHandler.expressErrorHandler);
  } catch (error) {
    console.error("❌ Erro ao configurar ErrorHandler:", error);
    // Fallback para error handler básico
    app.use((err, req, res, next) => {
      console.error("Erro na aplicação:", err);
      res.status(500).json({
        error: {
          code: 500,
          message: "Erro interno do servidor",
          ...(process.env.NODE_ENV === "development" && {
            details: err.message,
          }),
        },
      });
    });
  }
} catch (error) {
  console.error("❌ Erro fatal ao inicializar servidor:", error);
  // Criar app mínimo para não quebrar completamente
  const express = require("express");
  app = express();
  app.use(express.json());
  app.use((req, res) => {
    res.status(500).json({
      error: {
        code: 500,
        message: "Erro ao inicializar servidor",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      },
    });
  });
}

// Exportar app para Vercel (serverless)
module.exports = app;

// Iniciar servidor apenas se executado diretamente (não no Vercel)
if (require.main === module && app) {
  try {
    const { config } = require("./src/config");
    const logger = require("./src/utils/logger");
    const port = config.port || 3000;

    const server = app.listen(port, () => {
      logger.info(`Servidor iniciado em http://localhost:${port}`);
      logger.info(`Ambiente: ${config.nodeEnv}`);
    });

    // Gerenciamento de erros não capturados (apenas em modo local)
    process.on("uncaughtException", (error) => {
      logger.error("Erro não capturado:", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Promessa rejeitada não tratada:", { reason, promise });
    });

    // Graceful shutdown (apenas em modo local)
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
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor local:", error);
  }
}
