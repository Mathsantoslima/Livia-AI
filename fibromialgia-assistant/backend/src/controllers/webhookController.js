const whatsappService = require("../services/whatsappService");
const userService = require("../services/userService");
const intentService = require("../services/intentService");
const responseService = require("../services/responseService");
const liviaService = require("../services/liviaService");
const logger = require("../utils/logger");
const axios = require("axios");
const intelligenceService = require("../services/intelligenceService");

/**
 * Manipula webhooks recebidos do WhatsApp com todas as funcionalidades da Livia
 */
async function handleWhatsAppWebhook(req, res) {
  try {
    const webhookData = req.body;
    logger.info("Webhook recebido:", webhookData);

    // Verificar se é uma mensagem válida da API Baileys
    if (
      !webhookData.event ||
      webhookData.event !== "message" ||
      !webhookData.data ||
      !webhookData.data.from ||
      !webhookData.data.body
    ) {
      logger.info("Webhook ignorado - não é uma mensagem válida");
      return res.status(200).json({ status: "ignored" });
    }

    const messageData = webhookData.data;

    // Verificar se é mensagem do próprio bot (fromMe = true)
    if (messageData.fromMe) {
      logger.info("Mensagem do próprio bot ignorada");
      return res.status(200).json({ status: "ignored - own message" });
    }

    // Verificar se é mensagem de grupo (ignora grupos)
    if (userService.isGroupMessage(messageData.from)) {
      logger.info("Mensagem de grupo ignorada");
      return res.status(200).json({ status: "ignored - group message" });
    }

    const phoneNumber = messageData.from;
    const messageText = messageData.body.trim();

    logger.info(`Processando mensagem de ${phoneNumber}: "${messageText}"`);

    // 1. Buscar ou criar usuário
    const user = await userService.findOrCreateUser(phoneNumber);
    logger.info(`Usuário processado: ${user.id}`, {
      hasName: !!user.name,
      onboardingComplete: user.onboarding_completed,
    });

    // 2. Processar mensagem com toda a inteligência da Livia
    const response = await liviaService.processUserMessage(
      user.id,
      messageText,
      user
    );

    // 3. Quebrar resposta em mensagens menores e enviar
    await sendResponseInChunks(phoneNumber, response);

    // 4. Verificar se é hora de check-in automático (se ainda não fez hoje)
    if (
      userService.isCheckInTime(user) &&
      (await userService.needsDailyCheckIn(user))
    ) {
      setTimeout(async () => {
        await sendCheckInReminder(phoneNumber, user);
      }, 5000); // Espera 5 segundos para não sobrecarregar
    }

    // 5. Analisar padrões em background (se tem dados suficientes)
    if (user.onboarding_completed) {
      setTimeout(async () => {
        await intelligenceService.analyzePersonalPatterns(user.id);
      }, 10000); // Análise em background após 10 segundos
    }

    return res.status(200).json({
      status: "success",
      userId: user.id,
      responseType: response.type,
    });
  } catch (error) {
    logger.error("Erro ao processar webhook:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

/**
 * Envia resposta quebrada em chunks para não sobrecarregar o usuário
 * @param {string} phoneNumber - Número do WhatsApp
 * @param {Object} response - Resposta da Livia
 */
async function sendResponseInChunks(phoneNumber, response) {
  try {
    // Quebra a mensagem em partes menores
    const chunks = liviaService.breakMessageIntoChunks(response.text, 120);

    logger.info(`Enviando resposta em ${chunks.length} parte(s)`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Envia cada parte com uma pequena pausa entre elas
      await whatsappService.sendMessage(phoneNumber, chunk);

      // Pausa entre mensagens (exceto na última)
      if (i < chunks.length - 1) {
        await sleep(1500); // 1.5 segundos entre mensagens
      }
    }

    logger.info(`Resposta enviada com sucesso em ${chunks.length} parte(s)`);
  } catch (error) {
    logger.error("Erro ao enviar resposta:", error);

    // Fallback: tenta enviar mensagem simples
    try {
      await whatsappService.sendMessage(
        phoneNumber,
        "Ops, tive um probleminha técnico. Pode repetir sua mensagem?"
      );
    } catch (fallbackError) {
      logger.error("Erro no fallback:", fallbackError);
    }
  }
}

/**
 * Envia lembrete de check-in se necessário
 * @param {string} phoneNumber - Número do WhatsApp
 * @param {Object} user - Dados do usuário
 */
async function sendCheckInReminder(phoneNumber, user) {
  try {
    if (!user.name) {
      return; // Não envia lembrete se ainda não tem nome
    }

    const reminderMessage = liviaService.getDailyCheckInMessage(user.name);

    await whatsappService.sendMessage(phoneNumber, `💜 ${reminderMessage}`);

    logger.info(`Lembrete de check-in enviado para ${user.name}`);
  } catch (error) {
    logger.error("Erro ao enviar lembrete de check-in:", error);
  }
}

/**
 * Envia sugestões matinais baseadas no check-in do dia anterior
 * @param {string} phoneNumber - Número do WhatsApp
 * @param {Object} user - Dados do usuário
 */
async function sendMorningSuggestions(phoneNumber, user) {
  try {
    const suggestions = await userService.getTodaySuggestions(user.id);

    if (suggestions.length === 0) {
      return; // Não tem sugestões para hoje
    }

    const userName = user.name || "querida";
    let message = `Bom dia, ${userName}! 🌅\n\nBaseada no que você me contou ontem, tenho algumas sugestões para hoje:\n\n`;

    suggestions.slice(0, 2).forEach((suggestion, index) => {
      message += `${index + 1}. ✨ ${suggestion.suggestion_text}\n\n`;
    });

    message += "Que tal experimentar uma delas hoje? 😊";

    // Envia em chunks
    await sendResponseInChunks(phoneNumber, {
      text: message,
      type: "morning_suggestions",
    });

    logger.info(`Sugestões matinais enviadas para ${user.name}`);
  } catch (error) {
    logger.error("Erro ao enviar sugestões matinais:", error);
  }
}

/**
 * Função de apoio para pausas
 * @param {number} ms - Milissegundos para esperar
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Endpoint para trigger manual de análise de inteligência coletiva
 * (Para desenvolvimento e testes)
 */
async function triggerCollectiveIntelligence(req, res) {
  try {
    logger.info("Iniciando análise de inteligência coletiva manual...");

    const insights = await intelligenceService.generateCollectiveInsights();

    return res.status(200).json({
      status: "success",
      message: `${insights.length} insights coletivos gerados`,
      insights: insights,
    });
  } catch (error) {
    logger.error("Erro ao gerar inteligência coletiva:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

/**
 * Endpoint para enviar sugestões matinais para todos os usuários
 * (Para ser chamado por cron job)
 */
async function sendMorningBroadcast(req, res) {
  try {
    logger.info("Iniciando broadcast matinal...");

    // Busca usuários que têm sugestões para hoje
    const { data: usersWithSuggestions, error } =
      await require("../config/supabase")
        .supabase.from("users_livia")
        .select(
          `
        id,
        name,
        phone,
        daily_suggestions!inner(id)
      `
        )
        .eq(
          "daily_suggestions.suggestion_date",
          new Date().toISOString().split("T")[0]
        )
        .not("name", "is", null);

    if (error) {
      throw error;
    }

    let sentCount = 0;

    for (const user of usersWithSuggestions) {
      try {
        const phoneNumber = `${user.phone}@s.whatsapp.net`;
        await sendMorningSuggestions(phoneNumber, user);
        sentCount++;

        // Pausa entre usuários para não sobrecarregar
        await sleep(2000);
      } catch (userError) {
        logger.error(`Erro ao enviar para usuário ${user.id}:`, userError);
      }
    }

    return res.status(200).json({
      status: "success",
      message: `Broadcast enviado para ${sentCount} usuários`,
      totalUsers: usersWithSuggestions.length,
    });
  } catch (error) {
    logger.error("Erro no broadcast matinal:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

/**
 * Endpoint para estatísticas da Livia
 */
async function getLiviaStats(req, res) {
  try {
    const { supabase } = require("../config/supabase");

    // Estatísticas básicas
    const { count: totalUsers } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true });

    const { count: activeUsers } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true })
      .not("name", "is", null);

    const { count: dailyCheckIns } = await supabase
      .from("daily_check_ins")
      .select("*", { count: "exact", head: true })
      .eq("check_in_date", new Date().toISOString().split("T")[0]);

    const { count: totalPatterns } = await supabase
      .from("user_patterns")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: totalInsights } = await supabase
      .from("collective_insights")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    return res.status(200).json({
      status: "success",
      stats: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        todayCheckIns: dailyCheckIns || 0,
        activePattterns: totalPatterns || 0,
        collectiveInsights: totalInsights || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Erro ao buscar estatísticas:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

module.exports = {
  handleWhatsAppWebhook,
  triggerCollectiveIntelligence,
  sendMorningBroadcast,
  getLiviaStats,
};
