const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * Limpa o número de telefone removendo caracteres especiais e @s.whatsapp.net
 * @param {string} phone - Número de telefone completo do WhatsApp
 * @returns {string} Número limpo
 */
function cleanPhoneNumber(phone) {
  // Remove @s.whatsapp.net e outros caracteres especiais, mantém apenas números
  return phone.replace(/@s\.whatsapp\.net$/, "").replace(/\D/g, "");
}

/**
 * Verifica se a mensagem é de um grupo
 * @param {string} phone - Número/ID do remetente
 * @returns {boolean} True se for de um grupo
 */
function isGroupMessage(phone) {
  // Mensagens de grupo têm formato diferente (geralmente contém "-" ou "@g.us")
  return phone.includes("-") || phone.includes("@g.us");
}

/**
 * Busca ou cria um usuário no banco de dados
 * @param {string} phone - Número de telefone limpo
 * @returns {Promise<Object>} Dados do usuário
 */
async function findOrCreateUser(phone) {
  try {
    const cleanPhone = cleanPhoneNumber(phone);
    logger.info(`Buscando usuário para o telefone: ${cleanPhone}`);

    // Buscar usuário existente
    const { data: existingUser, error: findError } = await supabase
      .from("users_livia")
      .select("*")
      .eq("phone", cleanPhone)
      .single();

    if (findError && findError.code !== "PGRST116") {
      logger.error("Erro ao buscar usuário:", findError);
      throw findError;
    }

    if (existingUser) {
      logger.info(`Usuário encontrado: ${existingUser.id}`, {
        hasName: !!existingUser.name,
      });
      return existingUser;
    }

    // Criar novo usuário
    logger.info(`Criando novo usuário para: ${cleanPhone}`);
    const { data: newUser, error: createError } = await supabase
      .from("users_livia")
      .insert([
        {
          phone: cleanPhone,
          subscription_status: "TRIAL",
          onboarding_completed: false,
          name: null,
        },
      ])
      .select()
      .single();

    if (createError) {
      logger.error("Erro ao criar usuário:", createError);
      throw createError;
    }

    logger.info(`Usuário criado: ${newUser.id}`);
    return newUser;
  } catch (error) {
    logger.error("Erro ao buscar/criar usuário:", error);
    throw error;
  }
}

/**
 * Atualiza o nome do usuário
 * @param {string} userId - ID do usuário
 * @param {string} name - Nome do usuário
 * @returns {Promise<Object>} Usuário atualizado
 */
async function updateUserName(userId, name) {
  try {
    const { data, error } = await supabase
      .from("users_livia")
      .update({
        name: name,
        onboarding_completed: true,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      logger.error("Erro ao atualizar nome do usuário:", error);
      throw error;
    }

    logger.info(`Nome do usuário atualizado: ${userId} -> ${name}`);
    return data;
  } catch (error) {
    logger.error("Erro ao atualizar nome do usuário:", error);
    throw error;
  }
}

/**
 * Atualiza o último check-in do usuário (funcionalidade simplificada)
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Usuário atualizado
 */
async function updateLastCheckIn(userId) {
  try {
    // Por enquanto, apenas simula a atualização
    logger.info(`Check-in atualizado para usuário ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error("Erro ao atualizar check-in:", error);
    throw error;
  }
}

// ==============================================
// FUNCIONALIDADES AVANÇADAS - CHECK-INS DIÁRIOS
// ==============================================

/**
 * Verifica se precisa fazer check-in diário
 * @param {Object} user - Dados do usuário
 * @returns {Promise<boolean>} True se precisa fazer check-in
 */
async function needsDailyCheckIn(user) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: todayCheckIn, error } = await supabase
      .from("daily_check_ins")
      .select("id")
      .eq("user_id", user.id)
      .eq("check_in_date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Erro ao verificar check-in:", error);
      return true; // Em caso de erro, assume que precisa
    }

    // Se não encontrou check-in hoje, precisa fazer
    return !todayCheckIn;
  } catch (error) {
    logger.error("Erro ao verificar necessidade de check-in:", error);
    return true;
  }
}

/**
 * Verifica se é hora do check-in (baseado na preferência do usuário)
 * @param {Object} user - Dados do usuário
 * @returns {boolean} True se é hora do check-in
 */
function isCheckInTime(user) {
  const now = new Date();
  const currentHour = now.getHours();

  // Se o usuário tem preferência de horário, usa ela
  if (user.preferred_check_in_time) {
    const preferredHour = parseInt(user.preferred_check_in_time.split(":")[0]);
    return currentHour >= preferredHour;
  }

  // Padrão: após 18h
  return currentHour >= 18;
}

/**
 * Inicia um check-in diário interativo
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Objeto com próxima pergunta
 */
async function startDailyCheckIn(userId) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Verifica se já começou check-in hoje
    const { data: existingCheckIn } = await supabase
      .from("daily_check_ins")
      .select("*")
      .eq("user_id", userId)
      .eq("check_in_date", today)
      .single();

    if (existingCheckIn) {
      return {
        completed: true,
        message: "Você já fez seu check-in de hoje! 😊 Obrigada por se cuidar.",
      };
    }

    // Cria novo check-in
    const { data: newCheckIn, error } = await supabase
      .from("daily_check_ins")
      .insert([
        {
          user_id: userId,
          check_in_date: today,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error("Erro ao criar check-in:", error);
      throw error;
    }

    return {
      checkInId: newCheckIn.id,
      nextStep: "pain_level",
      question:
        "Como está seu nível de dor hoje? (0 = nenhuma dor, 10 = dor insuportável)",
      type: "scale_0_10",
    };
  } catch (error) {
    logger.error("Erro ao iniciar check-in:", error);
    throw error;
  }
}

/**
 * Processa uma resposta do check-in
 * @param {string} checkInId - ID do check-in
 * @param {string} step - Passo atual
 * @param {string} answer - Resposta do usuário
 * @returns {Promise<Object>} Próximo passo ou conclusão
 */
async function processCheckInAnswer(checkInId, step, answer) {
  try {
    const updates = {};
    let nextStep = null;
    let nextQuestion = null;
    let questionType = "scale_0_10";

    // Processa a resposta baseada no passo atual
    switch (step) {
      case "pain_level":
        updates.pain_level = parseInt(answer);
        nextStep = "fatigue_level";
        nextQuestion =
          "E como está seu nível de fadiga/cansaço? (0 = muito energizado, 10 = exausto)";
        break;

      case "fatigue_level":
        updates.fatigue_level = parseInt(answer);
        nextStep = "mood_level";
        nextQuestion =
          "Como está seu humor hoje? (0 = muito triste, 10 = muito feliz)";
        break;

      case "mood_level":
        updates.mood_level = parseInt(answer);
        nextStep = "sleep_quality";
        nextQuestion =
          "Como foi a qualidade do seu sono ontem? (0 = péssima, 10 = excelente)";
        break;

      case "sleep_quality":
        updates.sleep_quality = parseInt(answer);
        nextStep = "physical_activity";
        nextQuestion = "Você fez alguma atividade física hoje? (sim/não)";
        questionType = "yes_no";
        break;

      case "physical_activity":
        updates.physical_activity = answer.toLowerCase().includes("sim");
        if (updates.physical_activity) {
          nextStep = "activity_type";
          nextQuestion = "Que tipo de atividade você fez?";
          questionType = "text";
        } else {
          nextStep = "notes";
          nextQuestion =
            "Quer me contar algo especial sobre seu dia ou algum sintoma que notou?";
          questionType = "text";
        }
        break;

      case "activity_type":
        updates.activity_type = answer;
        nextStep = "notes";
        nextQuestion =
          "Quer me contar algo especial sobre seu dia ou algum sintoma que notou?";
        questionType = "text";
        break;

      case "notes":
        updates.notes = answer;
        nextStep = "complete";
        break;
    }

    // Atualiza o check-in
    const { error: updateError } = await supabase
      .from("daily_check_ins")
      .update(updates)
      .eq("id", checkInId);

    if (updateError) {
      logger.error("Erro ao atualizar check-in:", updateError);
      throw updateError;
    }

    if (nextStep === "complete") {
      // Check-in completo, gera sugestões para amanhã
      await generateDailySuggestions(checkInId);

      return {
        completed: true,
        message:
          "Obrigada por compartilhar como foi seu dia! 💜\n\nAmanhã vou ter algumas sugestões personalizadas para você baseadas no que me contou.",
      };
    }

    return {
      checkInId,
      nextStep,
      question: nextQuestion,
      type: questionType,
    };
  } catch (error) {
    logger.error("Erro ao processar resposta do check-in:", error);
    throw error;
  }
}

// ==============================================
// SISTEMA DE SUGESTÕES PERSONALIZADAS
// ==============================================

/**
 * Gera sugestões personalizadas baseadas no check-in
 * @param {string} checkInId - ID do check-in
 * @returns {Promise<Array>} Array de sugestões geradas
 */
async function generateDailySuggestions(checkInId) {
  try {
    // Busca dados do check-in
    const { data: checkIn, error: checkInError } = await supabase
      .from("daily_check_ins")
      .select(
        `
        *,
        users (id, name, personal_triggers, preferred_activities)
      `
      )
      .eq("id", checkInId)
      .single();

    if (checkInError) {
      logger.error("Erro ao buscar check-in:", checkInError);
      throw checkInError;
    }

    // Busca histórico recente do usuário (últimos 7 dias)
    const { data: recentHistory } = await supabase
      .from("daily_check_ins")
      .select("*")
      .eq("user_id", checkIn.user_id)
      .gte(
        "check_in_date",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .order("check_in_date", { ascending: false });

    const suggestions = [];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Sugestão baseada na dor
    if (checkIn.pain_level >= 6) {
      suggestions.push({
        user_id: checkIn.user_id,
        suggestion_date: tomorrow,
        category: "pain_management",
        suggestion_text:
          "Que tal tentar um banho morno com sal de epsom por 15-20 minutos? Pode ajudar a relaxar os músculos.",
        evidence_level: "high",
        based_on_symptoms: ["high_pain"],
        sent_at: new Date(),
      });
    }

    // Sugestão baseada na fadiga
    if (checkIn.fatigue_level >= 7) {
      suggestions.push({
        user_id: checkIn.user_id,
        suggestion_date: tomorrow,
        category: "energy_management",
        suggestion_text:
          "Hoje parece que você está bem cansada. Que tal fazer uma pausa de 10 minutos para respirar fundo?",
        evidence_level: "high",
        based_on_symptoms: ["high_fatigue"],
        sent_at: new Date(),
      });
    }

    // Sugestão baseada no sono
    if (checkIn.sleep_quality <= 4) {
      suggestions.push({
        user_id: checkIn.user_id,
        suggestion_date: tomorrow,
        category: "sleep",
        suggestion_text:
          "Que tal tentar uma rotina relaxante antes de dormir? Chá de camomila e 5 minutos de respiração profunda podem ajudar.",
        evidence_level: "high",
        based_on_symptoms: ["poor_sleep"],
        sent_at: new Date(),
      });
    }

    // Sugestão de atividade física (se não fez hoje)
    if (!checkIn.physical_activity) {
      suggestions.push({
        user_id: checkIn.user_id,
        suggestion_date: tomorrow,
        category: "exercise",
        suggestion_text:
          "Uma caminhada leve de 10 minutos pode fazer maravilhas! Que tal experimentar?",
        evidence_level: "high",
        based_on_symptoms: ["no_activity"],
        sent_at: new Date(),
      });
    }

    // Salva as sugestões no banco
    if (suggestions.length > 0) {
      const { error: suggestionsError } = await supabase
        .from("daily_suggestions")
        .insert(suggestions);

      if (suggestionsError) {
        logger.error("Erro ao salvar sugestões:", suggestionsError);
      } else {
        logger.info(
          `${suggestions.length} sugestões geradas para usuário ${checkIn.user_id}`
        );
      }
    }

    return suggestions;
  } catch (error) {
    logger.error("Erro ao gerar sugestões:", error);
    throw error;
  }
}

/**
 * Busca sugestões pendentes para hoje
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Sugestões para hoje
 */
async function getTodaySuggestions(userId) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: suggestions, error } = await supabase
      .from("daily_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("suggestion_date", today)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Erro ao buscar sugestões:", error);
      return [];
    }

    return suggestions || [];
  } catch (error) {
    logger.error("Erro ao buscar sugestões do dia:", error);
    return [];
  }
}

// ==============================================
// HISTÓRICO E CONTEXTO DE CONVERSA
// ==============================================

/**
 * Salva uma mensagem no histórico da conversa
 * @param {string} userId - ID do usuário
 * @param {string} messageText - Texto da mensagem
 * @param {boolean} isFromUser - Se a mensagem é do usuário
 * @param {Object} context - Contexto adicional
 * @returns {Promise<Object>} Mensagem salva
 */
async function saveConversationMessage(
  userId,
  messageText,
  isFromUser,
  context = {}
) {
  try {
    const { data, error } = await supabase
      .from("conversations_livia")
      .insert([
        {
          user_id: userId,
          message_text: messageText,
          is_from_user: isFromUser,
          conversation_context: context,
          intent_identified: context.intent,
          sentiment: context.sentiment,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error("Erro ao salvar mensagem:", error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Erro ao salvar conversa:", error);
    throw error;
  }
}

/**
 * Busca contexto recente da conversa
 * @param {string} userId - ID do usuário
 * @param {number} limit - Limite de mensagens
 * @returns {Promise<Array>} Histórico recente
 */
async function getRecentConversationContext(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from("conversations_livia")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Erro ao buscar contexto:", error);
      return [];
    }

    return data?.reverse() || [];
  } catch (error) {
    logger.error("Erro ao buscar contexto da conversa:", error);
    return [];
  }
}

module.exports = {
  findOrCreateUser,
  updateUserName,
  cleanPhoneNumber,
  isGroupMessage,
  needsDailyCheckIn,
  isCheckInTime,
  startDailyCheckIn,
  processCheckInAnswer,
  generateDailySuggestions,
  getTodaySuggestions,
  saveConversationMessage,
  getRecentConversationContext,
  updateLastCheckIn,
};
