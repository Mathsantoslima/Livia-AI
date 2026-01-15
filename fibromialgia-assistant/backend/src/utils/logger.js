const winston = require("winston");
const path = require("path");
const fs = require("fs");
const { config } = require("../config");

// Detectar se está rodando no Vercel (serverless)
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Garantir que o diretório de logs existe (apenas se não estiver no Vercel)
let logDir;
if (!isVercel) {
  logDir = path.join(__dirname, "../../logs");
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (error) {
      // Se falhar, usar /tmp como fallback
      logDir = "/tmp";
    }
  }
} else {
  // No Vercel, usar /tmp se precisar de logs em arquivo
  logDir = "/tmp";
}

// Configurar formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...rest }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Adicionar dados extras se houver, com proteção contra JSON circular
    if (Object.keys(rest).length > 0) {
      try {
        // Função para substituir referências circulares
        const getCircularReplacer = () => {
          const seen = new WeakSet();
          return (key, value) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) {
                return "[Circular]";
              }
              seen.add(value);
            }
            return value;
          };
        };

        log += ` ${JSON.stringify(rest, getCircularReplacer())}`;
      } catch (error) {
        log += ` [Erro ao serializar dados extras: ${error.message}]`;
      }
    }

    // Adicionar stack trace se disponível
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Criar transportes de logs
const transports = [
  // Console logger (sempre ativo)
  new winston.transports.Console({
    level: config.nodeEnv === "production" ? "info" : "debug",
    format: winston.format.combine(winston.format.colorize(), logFormat),
  }),
];

// Adicionar transportes de arquivo apenas se não estiver no Vercel
if (!isVercel) {
  try {
    // Arquivo de log para informações e erros
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, "app.log"),
        level: "info",
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      })
    );

    // Arquivo separado apenas para erros
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, "error.log"),
        level: "error",
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      })
    );
  } catch (error) {
    // Se falhar ao criar arquivos, usar apenas console
    console.warn("⚠️ Não foi possível criar arquivos de log, usando apenas console:", error.message);
  }
}

// Criar logger
const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format: logFormat,
  transports,
});

// Adicionar handler para erros não capturados
process.on("uncaughtException", (error) => {
  logger.error("Exceção não capturada:", error);

  // Em produção, podemos querer encerrar o processo após um erro não tratado
  if (config.nodeEnv === "production") {
    // Log final antes de encerrar o processo
    logger.error("Encerrando o processo após exceção não capturada");

    // Esperar que os logs sejam escritos antes de encerrar o processo
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Rejeição não tratada:", { reason, promise });
});

// Adicionar método para registrar eventos de IA
logger.ai = (message, details) => {
  logger.info(`[AI] ${message}`, details);
};

// Adicionar método para registrar eventos de mensagem
logger.message = (userId, message, direction = "in") => {
  const truncatedMessage =
    message.length > 100 ? `${message.substring(0, 100)}...` : message;

  logger.info(
    `[${direction.toUpperCase()}] Usuário ${userId}: ${truncatedMessage}`
  );
};

// Adicionar método para registrar eventos de API
logger.api = (method, endpoint, statusCode, responseTime) => {
  logger.info(
    `[API] ${method.toUpperCase()} ${endpoint} ${statusCode} ${responseTime}ms`
  );
};

// Adicionar método para registrar eventos de WhatsApp
logger.whatsapp = (event, details) => {
  logger.info(`[WhatsApp] ${event}`, details);
};

// Adicionar método para registrar eventos de banco de dados
logger.db = (operation, table, details) => {
  logger.debug(`[DB] ${operation} ${table}`, details);
};

module.exports = logger;
