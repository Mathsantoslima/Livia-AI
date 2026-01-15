/**
 * =========================================
 * INTEGRAÇÃO COM SERVIDOR EXISTENTE
 * =========================================
 * 
 * Exemplo de como integrar a nova infraestrutura de IA
 * com o servidor WhatsApp Baileys existente
 */

const express = require("express");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const path = require("path");
const fs = require("fs");

// Importar nova infraestrutura de IA
const { initializeAIInfrastructure } = require("./integration-example");
const logger = require("../utils/logger");

const app = express();
app.use(express.json());

// Configurações
const PORT = process.env.PORT || 8080;
const SESSION_DIR = path.join(__dirname, "../../../sessions");

// Estado do WhatsApp
let sock = null;
let aiInfra = null;

/**
 * Inicializa cliente WhatsApp
 */
async function initializeWhatsApp() {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const customLogger = pino({ level: "silent" });

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: customLogger,
    });

    // Eventos de conexão
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📱 QR Code gerado. Escaneie com WhatsApp.");
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error instanceof Boom &&
          lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          console.log("🔄 Reconectando...");
          setTimeout(initializeWhatsApp, 5000);
        }
      } else if (connection === "open") {
        console.log("✅ WhatsApp conectado!");
        
        // Inicializar infraestrutura de IA após conexão
        if (!aiInfra) {
          aiInfra = initializeAIInfrastructure(sock);
          console.log("🤖 Infraestrutura de IA inicializada");
        }
      }
    });

    // Salvar credenciais
    sock.ev.on("creds.update", saveCreds);

    // Processar mensagens recebidas
    sock.ev.on("messages.upsert", async (m) => {
      if (m.type === "notify" && aiInfra) {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            try {
              // Processar através do canal WhatsApp
              const channel = aiInfra.getChannel("whatsapp");
              if (channel) {
                await channel.handleIncomingMessage(msg);
              } else {
                console.error("Canal WhatsApp não encontrado");
              }
            } catch (error) {
              logger.error("Erro ao processar mensagem:", error);
            }
          }
        }
      }
    });

    return sock;
  } catch (error) {
    logger.error("Erro ao inicializar WhatsApp:", error);
    setTimeout(initializeWhatsApp, 5000);
  }
}

/**
 * Endpoints da API
 */

// Health check
app.get("/health", async (req, res) => {
  try {
    const health = aiInfra ? await aiInfra.healthCheck() : { status: "initializing" };
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Processar mensagem diretamente (para testes)
app.post("/api/process-message", async (req, res) => {
  try {
    if (!aiInfra) {
      return res.status(503).json({ error: "Infraestrutura de IA não inicializada" });
    }

    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "userId e message são obrigatórios" });
    }

    const response = await aiInfra.processMessage(userId, message);

    res.json({
      success: true,
      response: response.text,
      chunks: response.chunks,
      metadata: response.metadata,
    });
  } catch (error) {
    logger.error("Erro ao processar mensagem:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook Evolution API (compatibilidade)
app.post("/webhook/evolution", async (req, res) => {
  try {
    if (!aiInfra) {
      return res.status(503).json({ error: "Infraestrutura de IA não inicializada" });
    }

    const { event, data } = req.body;

    if (event === "messages.upsert" && data?.messages) {
      const channel = aiInfra.getChannel("whatsapp");
      
      for (const message of data.messages) {
        await channel.handleIncomingMessage(message);
      }
    }

    res.json({ success: true, message: "Webhook processado" });
  } catch (error) {
    logger.error("Erro ao processar webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

// Status do WhatsApp
app.get("/status", (req, res) => {
  res.json({
    whatsapp: sock ? "connected" : "disconnected",
    ai: aiInfra ? "initialized" : "not_initialized",
  });
});

/**
 * Iniciar servidor
 */
app.listen(PORT, () => {
  console.log(`
🚀 SERVIDOR COM INFRAESTRUTURA DE IA
====================================

📡 Servidor: http://localhost:${PORT}
💚 Health: http://localhost:${PORT}/health
📊 Status: http://localhost:${PORT}/status
🔗 Webhook: http://localhost:${PORT}/webhook/evolution
🧠 Processar: POST http://localhost:${PORT}/api/process-message

🔄 Iniciando WhatsApp...
  `);

  // Inicializar WhatsApp
  initializeWhatsApp();
});

module.exports = app;
