/**
 * =========================================
 * EXEMPLO DE INTEGRAÇÃO COMPLETA
 * =========================================
 * 
 * Este arquivo demonstra como integrar a nova infraestrutura de IA
 * com o sistema existente (WhatsApp, Supabase, etc)
 */

const { getAIInfrastructure } = require("./index");
const WhatsAppChannel = require("../channels/WhatsAppChannel");
const logger = require("../utils/logger");

/**
 * Inicializa a infraestrutura de IA completa
 * @param {Object} whatsappClient - Cliente WhatsApp (Baileys ou Evolution)
 * @returns {Object} Infraestrutura configurada
 */
function initializeAIInfrastructure(whatsappClient = null) {
  try {
    // 1. Criar infraestrutura de IA
    const aiInfra = getAIInfrastructure({
      agent: {
        modelName: process.env.GEMINI_MODEL || "gemini-1.5-pro",
        apiKey: process.env.GOOGLE_AI_API_KEY,
      },
    });

    // 2. Configurar canal WhatsApp se cliente disponível
    if (whatsappClient) {
      const whatsappChannel = new WhatsAppChannel(
        aiInfra.getAgent("Livia"),
        whatsappClient
      );
      aiInfra.registerChannel("whatsapp", whatsappChannel);
      logger.info("Canal WhatsApp configurado");
    }

    return aiInfra;
  } catch (error) {
    logger.error("Erro ao inicializar infraestrutura de IA:", error);
    throw error;
  }
}

/**
 * Handler para mensagens do WhatsApp (Baileys)
 * @param {Object} message - Mensagem do Baileys
 * @param {Object} aiInfra - Infraestrutura de IA
 */
async function handleBaileysMessage(message, aiInfra) {
  try {
    // Verificar se é mensagem válida
    if (!message.key || !message.message) {
      return;
    }

    const isFromUser = !message.key.fromMe;
    const telefone = message.key.remoteJid?.replace("@s.whatsapp.net", "");

    // Ignorar grupos e mensagens próprias
    if (
      telefone?.includes("@g.us") ||
      telefone?.includes("@broadcast") ||
      !isFromUser
    ) {
      return;
    }

    // Extrair texto da mensagem
    const messageText =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      message.message.imageMessage?.caption ||
      "";

    if (!messageText) {
      return;
    }

    logger.info(`[Baileys] Processando mensagem de ${telefone}: ${messageText.substring(0, 50)}...`);

    // Processar através do canal WhatsApp
    const channel = aiInfra.getChannel("whatsapp");
    await channel.handleIncomingMessage(message);
  } catch (error) {
    logger.error("Erro ao processar mensagem Baileys:", error);
  }
}

/**
 * Handler para webhook Evolution API
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Object} aiInfra - Infraestrutura de IA
 */
async function handleEvolutionWebhook(req, res, aiInfra) {
  try {
    const { event, data } = req.body;

    if (event === "messages.upsert" && data?.messages) {
      for (const message of data.messages) {
        // Processar através do canal WhatsApp
        const channel = aiInfra.getChannel("whatsapp");
        await channel.handleIncomingMessage(message);
      }
    }

    res.json({ success: true, message: "Webhook processado" });
  } catch (error) {
    logger.error("Erro ao processar webhook Evolution:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar webhook",
      error: error.message,
    });
  }
}

/**
 * Endpoint para processar mensagem diretamente (para testes)
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Object} aiInfra - Infraestrutura de IA
 */
async function handleDirectMessage(req, res, aiInfra) {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: "userId e message são obrigatórios",
      });
    }

    // Processar mensagem
    const response = await aiInfra.processMessage(userId, message);

    res.json({
      success: true,
      response: response.text,
      chunks: response.chunks,
      metadata: response.metadata,
    });
  } catch (error) {
    logger.error("Erro ao processar mensagem direta:", error);
    res.status(500).json({
      error: "Erro ao processar mensagem",
      message: error.message,
    });
  }
}

/**
 * Endpoint de health check
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Object} aiInfra - Infraestrutura de IA
 */
async function handleHealthCheck(req, res, aiInfra) {
  try {
    const health = await aiInfra.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
}

module.exports = {
  initializeAIInfrastructure,
  handleBaileysMessage,
  handleEvolutionWebhook,
  handleDirectMessage,
  handleHealthCheck,
};
