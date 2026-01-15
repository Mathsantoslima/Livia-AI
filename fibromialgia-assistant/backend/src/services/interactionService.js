const { supabase } = require("../config/supabase");
const { claude } = require("../config/claude");
const { openai } = require("../config/openai");
const whatsappService = require("./whatsappService");
const logger = require("../utils/logger");

/**
 * Processa uma nova mensagem recebida
 * @param {Object} message - Objeto da mensagem recebida
 * @returns {Promise<void>}
 */
async function processMessage(message) {
  try {
    const { from, body, type } = message;

    // Registrar mensagem recebida
    await supabase.from("interactions").insert([
      {
        phone: from,
        message_type: type,
        content: body,
        direction: "incoming",
      },
    ]);

    // Obter contexto do usuário
    const userContext = await getUserContext(from);

    // Gerar resposta
    const response = await generateResponse(from, body, userContext);

    // Enviar resposta
    await whatsappService.sendTextMessage(from, response);

    // Registrar resposta enviada
    await supabase.from("interactions").insert([
      {
        phone: from,
        message_type: "text",
        content: response,
        direction: "outgoing",
      },
    ]);

    logger.info(`Mensagem processada para ${from}`);
  } catch (error) {
    logger.error(`Erro ao processar mensagem de ${message.from}:`, error);
    throw error;
  }
}

/**
 * Obtém o contexto do usuário
 * @param {string} phone - Número de telefone do usuário
 * @returns {Promise<Object>} Contexto do usuário
 */
async function getUserContext(phone) {
  try {
    // Buscar informações do usuário
    const { data: user, error: userError } = await supabase
      .from("users_livia")
      .select("*")
      .eq("phone", phone)
      .single();

    if (userError) throw userError;

    // Buscar últimas interações
    const { data: interactions, error: interactionsError } = await supabase
      .from("interactions")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(5);

    if (interactionsError) throw interactionsError;

    // Buscar sintomas recentes
    const { data: symptoms, error: symptomsError } = await supabase
      .from("symptoms")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(5);

    if (symptomsError) throw symptomsError;

    return {
      user,
      recentInteractions: interactions,
      recentSymptoms: symptoms,
    };
  } catch (error) {
    logger.error(`Erro ao obter contexto do usuário ${phone}:`, error);
    throw error;
  }
}

/**
 * Gera uma resposta personalizada
 * @param {string} phone - Número de telefone do usuário
 * @param {string} message - Mensagem recebida
 * @param {Object} context - Contexto do usuário
 * @returns {Promise<string>} Resposta gerada
 */
async function generateResponse(phone, message, context) {
  try {
    // Preparar prompt para o Claude
    const prompt = preparePrompt(message, context);

    // Tentar gerar resposta com Claude
    try {
      const response = await claude.complete({
        prompt,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.completion;
    } catch (claudeError) {
      logger.warn(
        `Erro ao gerar resposta com Claude para ${phone}, tentando OpenAI:`,
        claudeError
      );

      // Fallback para OpenAI
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.data.choices[0].text.trim();
    }
  } catch (error) {
    logger.error(`Erro ao gerar resposta para ${phone}:`, error);
    return "Desculpe, não consegui processar sua mensagem no momento. Por favor, tente novamente mais tarde.";
  }
}

/**
 * Prepara o prompt para geração de resposta
 * @param {string} message - Mensagem recebida
 * @param {Object} context - Contexto do usuário
 * @returns {string} Prompt formatado
 */
function preparePrompt(message, context) {
  const { user, recentInteractions, recentSymptoms } = context;

  return `
Você é um assistente virtual especializado em fibromialgia, chamado Fibro.IA.
Seu objetivo é ajudar pessoas com fibromialgia a gerenciar seus sintomas e melhorar sua qualidade de vida.

Informações do usuário:
- Nome: ${user.name}
- Idade: ${user.age}
- Tempo de diagnóstico: ${user.diagnosis_time} anos
- Sintomas principais: ${user.main_symptoms.join(", ")}

Sintomas recentes:
${recentSymptoms
  .map((s) => `- ${s.symptom}: ${s.intensity}/10 (${s.date})`)
  .join("\n")}

Interações recentes:
${recentInteractions.map((i) => `- ${i.content}`).join("\n")}

Mensagem atual do usuário:
${message}

Por favor, gere uma resposta empática e útil, considerando:
1. O contexto do usuário e suas experiências recentes
2. A natureza da fibromialgia e seus sintomas
3. O histórico de interações
4. A necessidade de ser claro e direto
5. A importância de manter um tom acolhedor e profissional

Resposta:`;
}

/**
 * Registra um novo sintoma reportado
 * @param {string} phone - Número de telefone do usuário
 * @param {Object} symptom - Dados do sintoma
 * @returns {Promise<void>}
 */
async function recordSymptom(phone, symptom) {
  try {
    await supabase.from("symptoms").insert([
      {
        phone,
        symptom: symptom.name,
        intensity: symptom.intensity,
        date: new Date().toISOString(),
        notes: symptom.notes,
      },
    ]);

    logger.info(`Sintoma registrado para ${phone}: ${symptom.name}`);
  } catch (error) {
    logger.error(`Erro ao registrar sintoma para ${phone}:`, error);
    throw error;
  }
}

/**
 * Registra feedback do usuário
 * @param {string} phone - Número de telefone do usuário
 * @param {Object} feedback - Dados do feedback
 * @returns {Promise<void>}
 */
async function recordFeedback(phone, feedback) {
  try {
    await supabase.from("feedback").insert([
      {
        phone,
        rating: feedback.rating,
        comment: feedback.comment,
        type: feedback.type,
      },
    ]);

    logger.info(`Feedback registrado para ${phone}`);
  } catch (error) {
    logger.error(`Erro ao registrar feedback para ${phone}:`, error);
    throw error;
  }
}

module.exports = {
  processMessage,
  getUserContext,
  generateResponse,
  recordSymptom,
  recordFeedback,
};
