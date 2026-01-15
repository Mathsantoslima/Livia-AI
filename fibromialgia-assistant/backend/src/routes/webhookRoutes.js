const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");
const logger = require("../utils/logger");
const { getAIInfrastructure } = require("../ai-infra");
const WhatsAppChannel = require("../channels/WhatsAppChannel");

/**
 * Rotas do sistema avançado da Livia
 */

// ==============================================
// WEBHOOK PRINCIPAL DO WHATSAPP
// ==============================================

/**
 * POST /webhook/whatsapp
 * Recebe mensagens do WhatsApp e processa com toda a inteligência da Livia
 */
router.post("/whatsapp", webhookController.handleWhatsAppWebhook);

/**
 * GET /webhook/w-api
 * Verifica se o endpoint está funcionando (para teste)
 */
router.get("/w-api", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Webhook W-API endpoint está funcionando",
    method: "Use POST para enviar mensagens",
    endpoint: "/webhook/w-api",
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /webhook/w-api
 * Recebe webhooks da W-API
 */
router.post("/w-api", async (req, res) => {
  try {
    const { event, data, instanceId } = req.body;

    // Log completo para debug
    logger.info("[W-API Webhook] Evento recebido:", {
      event: event || "undefined",
      instanceId,
      hasData: !!data,
      bodyKeys: Object.keys(req.body),
      bodyPreview: JSON.stringify(req.body).substring(0, 500),
    });

    // Processar mensagem recebida
    // W-API envia eventos como "webhookReceived" com os dados da mensagem no body
    // Também pode vir sem o campo "event" mas com os dados diretamente
    const isMessageEvent =
      event === "webhookReceived" ||
      event === "message" ||
      (data && data.type === "message") ||
      req.body.sender || // Se tem sender, é uma mensagem
      req.body.text || // Se tem text, é uma mensagem
      req.body.msgContent; // Se tem msgContent, é uma mensagem

    if (isMessageEvent) {
      const messageData =
        event === "webhookReceived" ? req.body : data || req.body;

      // Extrair dados da mensagem (formato W-API)
      // Formato W-API: { event: "webhookReceived", sender: { id: "..." }, text: "...", msgContent: {...} }
      const from =
        messageData.sender?.id ||
        messageData.chat?.id ||
        messageData.from ||
        messageData.phone ||
        messageData.key?.remoteJid?.replace("@s.whatsapp.net", "");

      // Extrair texto da mensagem (pode estar em diferentes lugares dependendo do tipo)
      let body = "";
      if (messageData.text) {
        body = messageData.text;
      } else if (messageData.msgContent?.extendedTextMessage?.text) {
        body = messageData.msgContent.extendedTextMessage.text;
      } else if (messageData.msgContent?.conversation) {
        body = messageData.msgContent.conversation;
      } else if (messageData.msgContent?.imageMessage?.caption) {
        body = messageData.msgContent.imageMessage.caption;
      } else if (messageData.msgContent?.audioMessage?.caption) {
        body = messageData.msgContent.audioMessage.caption;
      } else if (messageData.body) {
        body = messageData.body;
      } else if (messageData.message?.conversation) {
        body = messageData.message.conversation;
      } else if (messageData.message?.text) {
        body = messageData.message.text;
      }

      // Log detalhado para áudio
      if (
        messageData.msgContent?.audioMessage ||
        messageData.type === "audio"
      ) {
        logger.info("[W-API Webhook] ÁUDIO DETECTADO:", {
          hasAudioMessage: !!messageData.msgContent?.audioMessage,
          audioUrl:
            messageData.msgContent?.audioMessage?.url ||
            messageData.audioUrl ||
            messageData.mediaUrl,
          directPath: messageData.msgContent?.audioMessage?.directPath,
          type: messageData.type,
          fullAudioMessage: JSON.stringify(
            messageData.msgContent?.audioMessage || {}
          ).substring(0, 500),
        });
      }

      const messageId =
        messageData.messageId || messageData.id || messageData.key?.id;
      const timestamp = messageData.timestamp || Date.now();

      // Ignorar mensagens enviadas por nós mesmos
      if (messageData.fromMe === true) {
        logger.info(
          "[W-API Webhook] Mensagem ignorada (enviada por nós):",
          messageId
        );
        return res.status(200).json({
          success: true,
          message: "Mensagem ignorada (enviada por nós)",
        });
      }

      if (!from || !body) {
        logger.warn("[W-API Webhook] Mensagem inválida recebida:", {
          from,
          hasBody: !!body,
          event,
          messageData: JSON.stringify(messageData).substring(0, 200),
        });
        return res.status(200).json({
          success: true,
          message: "Evento recebido (sem dados de mensagem)",
        });
      }

      logger.info(
        `[W-API Webhook] Mensagem recebida de ${from}: ${body.substring(
          0,
          50
        )}...`
      );

      // Processar via infraestrutura de IA
      try {
        const aiInfra = getAIInfrastructure();
        const liviaAgent = aiInfra.getAgent("Livia");

        // Obter ou criar canal WhatsApp
        let whatsappChannel;
        try {
          whatsappChannel = aiInfra.getChannel("whatsapp");
        } catch (error) {
          // Canal não existe, criar novo
          whatsappChannel = null;
        }

        if (!whatsappChannel) {
          whatsappChannel = new WhatsAppChannel(liviaAgent, null, {
            useWApi: true,
            instanceId: instanceId || process.env.W_API_INSTANCE_ID,
          });
          aiInfra.registerChannel("whatsapp", whatsappChannel);
          logger.info("[W-API Webhook] Canal WhatsApp criado e registrado");
        }

        // Processar mensagem
        // Passar os dados completos para o canal processar
        await whatsappChannel.handleIncomingMessage(messageData);

        res.status(200).json({ success: true, message: "Mensagem processada" });
      } catch (aiError) {
        logger.error(
          "[W-API Webhook] Erro ao processar mensagem com IA:",
          aiError
        );
        res.status(500).json({
          error: "Erro ao processar mensagem",
          message: aiError.message,
        });
      }
    } else {
      // Outros eventos (status, connection, etc.)
      logger.info("[W-API Webhook] Evento não processado:", event);
      res.status(200).json({ success: true, message: "Evento recebido" });
    }
  } catch (error) {
    logger.error("[W-API Webhook] Erro no webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// ENDPOINTS DE INTELIGÊNCIA ARTIFICIAL
// ==============================================

/**
 * POST /webhook/intelligence/analyze
 * Trigger manual para análise de inteligência coletiva
 * Útil para desenvolvimento e manutenção
 */
router.post(
  "/intelligence/analyze",
  webhookController.triggerCollectiveIntelligence
);

// ==============================================
// ENDPOINTS DE BROADCAST E AUTOMAÇÃO
// ==============================================

/**
 * POST /webhook/broadcast/morning
 * Envia sugestões matinais para todos os usuários que têm sugestões
 * Deve ser chamado por cron job entre 7h e 9h
 */
router.post("/broadcast/morning", webhookController.sendMorningBroadcast);

// ==============================================
// ENDPOINTS DE MONITORAMENTO
// ==============================================

/**
 * GET /webhook/stats
 * Retorna estatísticas do sistema Livia
 */
router.get("/stats", webhookController.getLiviaStats);

/**
 * GET /webhook/health
 * Health check do sistema
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    system: "Livia Fibromialgia Assistant",
    version: "2.0.0",
  });
});

// ==============================================
// ENDPOINTS PARA ADMIN PANEL - WHATSAPP QR CODE
// ==============================================

// Estado de conexão WhatsApp (em produção, isso seria gerenciado pelo Evolution API ou Baileys)
let whatsappConnectionState = {
  connected: false,
  phone: null,
  qrCode: null,
  lastConnection: null,
  sessionId: null,
};

/**
 * GET /qrcode
 * Gera QR code para conexão do WhatsApp
 * Usa W-API se configurado, senão usa método antigo
 */
router.get("/qrcode", async (req, res) => {
  try {
    const wApiService = require("../services/wApiService");
    const { config: appConfig } = require("../config");

    // Tentar usar W-API se configurado
    if (appConfig.wApi && appConfig.wApi.useWApi && appConfig.wApi.token) {
      try {
        const qrCodeData = await wApiService.getQrCode(
          appConfig.wApi.instanceId,
          {
            image: "enable",
            syncContacts: "disable",
          }
        );

        return res.json({
          status: "success",
          qrcode: qrCodeData.qrcode || qrCodeData,
          instanceId: appConfig.wApi.instanceId,
          message: "QR Code gerado com sucesso. Escaneie com seu WhatsApp.",
          timestamp: new Date().toISOString(),
        });
      } catch (wApiError) {
        logger.error(
          "Erro ao obter QR Code da W-API, usando fallback:",
          wApiError.message
        );
        // Continuar com método antigo
      }
    }

    // Método antigo (simulação ou Baileys)
    // Se já está conectado, retorna erro
    if (whatsappConnectionState.connected) {
      return res.status(400).json({
        status: "error",
        message:
          "WhatsApp já está conectado. Desconecte primeiro para gerar novo QR code.",
        timestamp: new Date().toISOString(),
      });
    }

    // Gerar um QR code único baseado no timestamp
    const sessionId = `livia_session_${Date.now()}`;
    const qrCodeData = `https://wa.me/qr/${sessionId}`;

    // Atualizar estado
    whatsappConnectionState.qrCode = qrCodeData;
    whatsappConnectionState.sessionId = sessionId;
    whatsappConnectionState.connected = false;

    res.json({
      status: "success",
      qrcode: qrCodeData,
      message: "QR Code gerado com sucesso. Escaneie com seu WhatsApp.",
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
    });

    logger.info("QR Code gerado via admin panel", { sessionId });
  } catch (error) {
    logger.error("Erro ao gerar QR code:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao gerar QR code",
      error: error.message,
    });
  }
});

/**
 * GET /status
 * Verifica status da conexão WhatsApp
 * Usa W-API se configurado, senão usa método antigo
 */
router.get("/status", async (req, res) => {
  try {
    const wApiService = require("../services/wApiService");
    const configModule = require("../config");
    const appConfig = configModule.config || configModule;

    // Tentar usar W-API se configurado
    let wApiConfig = null;
    let useWApi = false;

    try {
      wApiConfig = appConfig?.wApi;
      useWApi = wApiConfig && wApiConfig.useWApi && wApiConfig.token;
    } catch (configError) {
      logger.warn("Erro ao acessar configuração W-API:", configError.message);
    }

    if (useWApi && wApiConfig?.instanceId) {
      try {
        const status = await wApiService.checkInstanceStatus(
          wApiConfig.instanceId
        );

        // Verificar se está conectado (W-API pode retornar connected: true ou status/state)
        const isConnected =
          status.connected === true ||
          status.status === "connected" ||
          status.state === "open" ||
          status.state === "connected";

        return res.json({
          status: "success",
          data: {
            connection: isConnected ? "connected" : "disconnected",
            phone:
              status.connectedPhone ||
              status.phone ||
              status.number ||
              status.wid?.user ||
              null,
            state:
              status.status ||
              status.state ||
              (isConnected ? "connected" : "unknown"),
            instanceId: wApiConfig.instanceId,
            platform: status.platform,
            name: status.name,
            isBusiness: status.isBusiness,
            // Debug: incluir campos adicionais para diagnóstico
            ...(process.env.NODE_ENV === "development" && {
              debug: {
                hasConnectedPhone: !!status.connectedPhone,
                hasPhone: !!status.phone,
                hasNumber: !!status.number,
                hasWid: !!status.wid,
                allKeys: Object.keys(status),
              },
            }),
          },
          timestamp: new Date().toISOString(),
        });
      } catch (wApiError) {
        logger.error(
          "Erro ao verificar status da W-API, usando fallback:",
          wApiError.message
        );
        // Continuar com método antigo
      }
    }

    // Método antigo (simulação ou Baileys)
    res.json({
      status: "success",
      data: {
        connection: whatsappConnectionState.connected
          ? "connected"
          : "disconnected",
        phone: whatsappConnectionState.phone,
        state: whatsappConnectionState.connected ? "CONNECTED" : "DISCONNECTED",
        lastConnection: whatsappConnectionState.lastConnection,
        sessionId: whatsappConnectionState.sessionId,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info("Status WhatsApp consultado via admin panel", {
      connected: whatsappConnectionState.connected,
      phone: whatsappConnectionState.phone,
    });
  } catch (error) {
    logger.error("Erro ao verificar status WhatsApp:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao verificar status",
      error: error.message,
    });
  }
});

/**
 * POST /logout
 * Desconecta o WhatsApp
 */
router.post("/logout", async (req, res) => {
  try {
    // Resetar estado de conexão
    const previousPhone = whatsappConnectionState.phone;

    whatsappConnectionState = {
      connected: false,
      phone: null,
      qrCode: null,
      lastConnection: null,
      sessionId: null,
    };

    res.json({
      status: "success",
      message: "WhatsApp desconectado com sucesso",
      previousPhone: previousPhone,
      timestamp: new Date().toISOString(),
    });

    logger.info("WhatsApp desconectado via admin panel", {
      previousPhone,
    });
  } catch (error) {
    logger.error("Erro ao desconectar WhatsApp:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao desconectar",
      error: error.message,
    });
  }
});

// ==============================================
// MIDDLEWARE DE ERRO
// ==============================================

router.use((error, req, res, next) => {
  logger.error("Erro nas rotas do webhook:", error);

  res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
