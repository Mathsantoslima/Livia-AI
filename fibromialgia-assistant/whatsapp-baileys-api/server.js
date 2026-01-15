const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const { Boom } = require("@hapi/boom");
const http = require("http");
const pino = require("pino");

// Carregar variáveis de ambiente
// Primeiro tenta carregar do diretório atual (whatsapp-baileys-api)
require("dotenv").config();
// Depois tenta carregar do diretório backend (sobrescreve se necessário)
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

// Importar infraestrutura de IA
const { getAIInfrastructure } = require("../backend/src/ai-infra");
const WhatsAppChannel = require("../backend/src/channels/WhatsAppChannel");

// Configurações
const PORT = process.env.PORT || 8080;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ENABLE_WEBHOOK = process.env.ENABLE_WEBHOOK === "true";

// Criar diretório de sessão
const SESSION_DIR = path.join(__dirname, "sessions");
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Inicializar Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Logger silencioso
const logger = pino({ level: "silent" });

// Autenticação API
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== WHATSAPP_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Estado do cliente WhatsApp
let sock;
let qrCodeText = "";
let connectionStatus = "disconnected";

// Controle de reconexão com backoff exponencial
let reconnectAttempts = 0;
let reconnectDelay = 30000; // 30 segundos inicial
const MAX_RECONNECT_DELAY = 300000; // 5 minutos máximo
const INITIAL_RECONNECT_DELAY = 30000; // 30 segundos inicial

// Infraestrutura de IA
let aiInfra = null;
let whatsappChannel = null;

// Inicializar cliente WhatsApp
async function connectToWhatsApp() {
  // Carregar estado de autenticação
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  // Criar socket do WhatsApp
  sock = makeWASocket({
    auth: state,
    logger,
  });

  // Manipulador de conexão
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Debug: mostrar status da conexão
    if (update.connection) {
      console.log(`📡 Status da conexão: ${update.connection}`);
    }

    if (qr) {
      // Gerar QR Code manualmente (printQRInTerminal está deprecated)
      qrCodeText = qr;
      console.log("\n╔════════════════════════════════════════╗");
      console.log("║   QR CODE GERADO - ESCANEIE AGORA    ║");
      console.log("╚════════════════════════════════════════╝\n");
      qrcode.generate(qr, { small: true });
      console.log("\n📱 Abra o WhatsApp no seu celular");
      console.log("📷 Vá em Configurações > Aparelhos conectados");
      console.log("➕ Toque em 'Conectar um aparelho'\n");
      connectionStatus = "qr_code";
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

      console.log("Conexão fechada devido a ", lastDisconnect.error);
      connectionStatus = "disconnected";

      // Reconectar se não for logout
      if (shouldReconnect) {
        reconnectAttempts++;
        // Backoff exponencial: 30s, 60s, 120s, 240s, max 300s (5min)
        reconnectDelay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1),
          MAX_RECONNECT_DELAY
        );
        console.log(`Reconectando em ${reconnectDelay / 1000} segundos... (tentativa ${reconnectAttempts})`);
        setTimeout(connectToWhatsApp, reconnectDelay);
      } else {
        console.log("Desconectado permanentemente.");
        // Limpar arquivos de sessão
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        if (!fs.existsSync(SESSION_DIR)) {
          fs.mkdirSync(SESSION_DIR, { recursive: true });
        }
        // Reset contador de reconexão para logout
        reconnectAttempts = 0;
        reconnectDelay = INITIAL_RECONNECT_DELAY;
        setTimeout(connectToWhatsApp, reconnectDelay);
      }
    } else if (connection === "open") {
      console.log("✅ Conexão aberta!");
      connectionStatus = "connected";
      
      // Reset contador de reconexão quando conectar com sucesso
      reconnectAttempts = 0;
      reconnectDelay = INITIAL_RECONNECT_DELAY;
      
      // Inicializar infraestrutura de IA após conexão
      if (!aiInfra) {
        try {
          console.log("🤖 Inicializando infraestrutura de IA...");
          aiInfra = getAIInfrastructure();
          const liviaAgent = aiInfra.getAgent("Livia");
          whatsappChannel = new WhatsAppChannel(liviaAgent, sock);
          aiInfra.registerChannel("whatsapp", whatsappChannel);
          console.log("✅ Infraestrutura de IA inicializada com sucesso!");
        } catch (error) {
          console.error("❌ Erro ao inicializar infraestrutura de IA:", error);
        }
      }
    }
  });

  // Salvar credenciais quando atualizado
  sock.ev.on("creds.update", saveCreds);

  // Manipulador de mensagens
  sock.ev.on("messages.upsert", async (m) => {
    if (m.type === "notify") {
      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message) {
          // Extrair conteúdo da mensagem para logs
          const messageContent =
            msg.message.conversation ||
            (msg.message.extendedTextMessage &&
              msg.message.extendedTextMessage.text) ||
            (msg.message.imageMessage && msg.message.imageMessage.caption) ||
            "";

          console.log(
            `📱 Nova mensagem de ${msg.key.remoteJid}: ${messageContent}`
          );

          // Processar via canal WhatsApp (infraestrutura de agentes)
          if (whatsappChannel) {
            try {
              await whatsappChannel.handleIncomingMessage(msg);
            } catch (error) {
              console.error("❌ Erro ao processar mensagem via agente:", error);
              
              // Fallback: enviar webhook se estiver habilitado
              if (ENABLE_WEBHOOK && WEBHOOK_URL) {
                try {
                  const webhookData = {
                    event: "message",
                    data: {
                      from: msg.key.remoteJid,
                      to: sock.user.id,
                      body: messageContent,
                      id: msg.key.id,
                      timestamp: msg.messageTimestamp,
                      type: Object.keys(msg.message)[0],
                    },
                  };

                  const options = {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-API-Key": WHATSAPP_API_KEY,
                    },
                  };

                  const req = http.request(WEBHOOK_URL, options, (res) => {
                    console.log(`🔄 Webhook fallback enviado - Status: ${res.statusCode}`);
                  });

                  req.on("error", (error) => {
                    console.error("❌ Erro no webhook fallback:", error);
                  });

                  req.write(JSON.stringify(webhookData));
                  req.end();
                } catch (webhookError) {
                  console.error("💥 Erro ao enviar webhook fallback:", webhookError);
                }
              }
            }
          } else {
            // Se o canal não estiver disponível, usar webhook como fallback
            console.log("⚠️ Canal WhatsApp não inicializado, usando webhook...");
            
            if (ENABLE_WEBHOOK && WEBHOOK_URL) {
              try {
                const webhookData = {
                  event: "message",
                  data: {
                    from: msg.key.remoteJid,
                    to: sock.user.id,
                    body: messageContent,
                    id: msg.key.id,
                    timestamp: msg.messageTimestamp,
                    type: Object.keys(msg.message)[0],
                  },
                };

                const options = {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": WHATSAPP_API_KEY,
                  },
                };

                const req = http.request(WEBHOOK_URL, options, (res) => {
                  console.log(`🔄 Webhook enviado - Status: ${res.statusCode}`);
                });

                req.on("error", (error) => {
                  console.error("❌ Erro no webhook:", error);
                });

                req.write(JSON.stringify(webhookData));
                req.end();
              } catch (error) {
                console.error("💥 Erro ao enviar webhook:", error);
              }
            } else {
              console.log("⚠️ Webhook desabilitado ou URL não configurada");
            }
          }
        }
      }
    }
  });

  return sock;
}

// Endpoint para obter QR Code
app.get("/qrcode", apiKeyMiddleware, (req, res) => {
  if (connectionStatus === "connected") {
    return res.status(200).json({
      status: "success",
      message: "Já conectado ao WhatsApp",
    });
  }

  if (qrCodeText) {
    return res.status(200).json({
      status: "success",
      qrcode: qrCodeText,
    });
  }

  return res.status(404).json({
    status: "error",
    message: "QR Code ainda não gerado",
  });
});

// Endpoint para verificar status
app.get("/status", apiKeyMiddleware, (req, res) => {
  let phoneNumber = "";

  if (sock && sock.user) {
    phoneNumber = sock.user.id.split(":")[0];
  }

  res.status(200).json({
    status: "success",
    data: {
      connection: connectionStatus,
      phone: phoneNumber,
      timestamp: new Date().toISOString(),
    },
  });
});

// Endpoint para enviar mensagem
app.post("/send", apiKeyMiddleware, async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      status: "error",
      message: 'Parâmetros "to" e "message" são obrigatórios',
    });
  }

  if (connectionStatus !== "connected") {
    return res.status(400).json({
      status: "error",
      message: "Cliente WhatsApp não está conectado",
    });
  }

  try {
    // Formatar número se necessário
    let phoneNumber = to;
    if (!phoneNumber.includes("@s.whatsapp.net")) {
      phoneNumber = phoneNumber.replace(/[^\d]/g, "");
      phoneNumber = `${phoneNumber}@s.whatsapp.net`;
    }

    // Enviar mensagem
    const result = await sock.sendMessage(phoneNumber, { text: message });

    res.status(200).json({
      status: "success",
      data: {
        id: result.key.id,
        to: phoneNumber,
        message: message,
      },
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao enviar mensagem",
      error: error.message,
    });
  }
});

// Endpoint para desconectar
app.post("/logout", apiKeyMiddleware, async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
      // Limpar arquivos de sessão
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }

      connectionStatus = "disconnected";
      qrCodeText = "";

      res.status(200).json({
        status: "success",
        message: "Desconectado com sucesso",
      });

      // Reconectar em 5 segundos
      setTimeout(connectToWhatsApp, 5000);
    } else {
      res.status(400).json({
        status: "error",
        message: "Cliente não inicializado",
      });
    }
  } catch (error) {
    console.error("Erro ao desconectar:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao desconectar",
      error: error.message,
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor WhatsApp API rodando na porta ${PORT}`);
  console.log(`API Key: ${WHATSAPP_API_KEY}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);

  // Iniciar cliente WhatsApp
  connectToWhatsApp();
});
