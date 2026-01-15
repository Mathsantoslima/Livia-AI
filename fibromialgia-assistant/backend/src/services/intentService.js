const { openai } = require("../config/openai");
const logger = require("../utils/logger");

/**
 * Analisa a intenção da mensagem do usuário considerando o contexto da Livia
 */
async function analyzeIntent(message, user) {
  try {
    const userContext = {
      isNewUser: !user.name || !user.onboarding_completed,
      hasName: !!user.name,
      needsCheckIn: !user.last_check_in || needsDailyCheckIn(user),
      userName: user.name || null,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é Livia, assistente especializada em fibromialgia e copiloto do dia a dia.
          
          Analise a mensagem considerando o contexto do usuário e retorne um JSON com:
          
          INTENÇÕES PRINCIPAIS:
          - "new_user_greeting": usuário novo, precisa apresentar-se e pedir nome
          - "provide_name": usuário está fornecendo seu nome
          - "daily_checkin": usuário está relatando como se sente no dia
          - "symptom_report": relato específico de sintomas
          - "pattern_question": pergunta sobre padrões/gatilhos
          - "lifestyle_advice": pedido de dicas de estilo de vida
          - "emotional_support": necessita de apoio emocional
          - "treatment_question": pergunta sobre tratamentos
          - "medication_question": pergunta sobre medicamentos
          - "exercise_question": pergunta sobre exercícios
          - "sleep_question": pergunta sobre sono
          - "general_greeting": cumprimento geral
          - "general_question": pergunta geral
          
          CAMPOS DO JSON:
          - intent: intenção principal
          - confidence: nível de confiança (0-1)
          - is_name_response: boolean se está fornecendo nome
          - extracted_name: nome extraído se presente
          - pain_level: nível de dor mencionado (1-10) se presente
          - energy_level: nível de energia (1-10) se presente
          - mood: humor mencionado se presente
          - symptoms: sintomas mencionados
          - needs_urgent_response: boolean se precisa resposta urgente
          - sentiment: sentimento (positive, negative, neutral)
          - priority: prioridade (high, medium, low)`,
        },
        {
          role: "user",
          content: `Contexto do usuário: ${JSON.stringify(userContext)}
          
          Mensagem: "${message}"`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    // Lógica adicional para novos usuários
    if (userContext.isNewUser && !analysis.is_name_response) {
      analysis.intent = "new_user_greeting";
      analysis.priority = "high";
    }

    logger.info("Intenção analisada (Livia):", {
      message: message.substring(0, 50) + "...",
      intent: analysis.intent,
      confidence: analysis.confidence,
      isNewUser: userContext.isNewUser,
    });

    return analysis;
  } catch (error) {
    logger.error("Erro ao analisar intenção:", error.message);

    // Retorno padrão baseado no contexto do usuário
    if (!user.name || !user.onboarding_completed) {
      return {
        intent: "new_user_greeting",
        confidence: 0.8,
        is_name_response: false,
        needs_urgent_response: true,
        sentiment: "neutral",
        priority: "high",
      };
    }

    return {
      intent: "general",
      confidence: 0.5,
      is_name_response: false,
      needs_urgent_response: false,
      sentiment: "neutral",
      priority: "medium",
    };
  }
}

/**
 * Verifica se precisa de check-in diário
 */
function needsDailyCheckIn(user) {
  if (!user.last_check_in) return true;

  const lastCheckIn = new Date(user.last_check_in);
  const today = new Date();

  return lastCheckIn.toDateString() !== today.toDateString();
}

/**
 * Analisa resposta de check-in diário
 */
async function analyzeCheckInResponse(message) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analise uma resposta de check-in diário sobre fibromialgia.
          
          Extraia e retorne um JSON com:
          - pain_level: nível de dor de 1-10 (null se não mencionado)
          - energy_level: nível de energia de 1-10 (null se não mencionado)
          - mood: humor (good, neutral, bad, anxious, depressed, etc)
          - sleep_quality: qualidade do sono (good, fair, poor, null)
          - symptoms: array de sintomas mencionados
          - activities: array de atividades realizadas
          - triggers: possíveis gatilhos identificados
          - notes: observações relevantes extraídas
          - severity_level: severidade geral (mild, moderate, severe)`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    logger.info("Check-in analisado:", {
      message: message.substring(0, 50) + "...",
      painLevel: analysis.pain_level,
      mood: analysis.mood,
    });

    return analysis;
  } catch (error) {
    logger.error("Erro ao analisar check-in:", error.message);
    return {
      pain_level: null,
      energy_level: null,
      mood: "neutral",
      sleep_quality: null,
      symptoms: [],
      activities: [],
      triggers: [],
      notes: message,
      severity_level: "moderate",
    };
  }
}

/**
 * Extrai nome da mensagem
 */
async function extractName(message) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Extraia o nome da pessoa da mensagem.
          
          Retorne um JSON com:
          - name: nome extraído (apenas o primeiro nome, limpo)
          - confidence: confiança na extração (0-1)
          - is_valid_name: boolean se parece ser um nome válido`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    logger.info("Nome extraído:", {
      message: message.substring(0, 30) + "...",
      extractedName: result.name,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    logger.error("Erro ao extrair nome:", error.message);
    return {
      name: null,
      confidence: 0,
      is_valid_name: false,
    };
  }
}

/**
 * Classifica a severidade dos sintomas
 */
async function classifySymptomSeverity(symptoms) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analise a severidade dos sintomas de fibromialgia relatados.
          
          Retorne um JSON com:
          - severity: nível de severidade (mild, moderate, severe)
          - score: pontuação de 0-10
          - recommendations: recomendações específicas baseadas em evidências
          - needs_medical_attention: se requer atenção médica imediata (boolean)
          - suggested_actions: ações que a pessoa pode tomar hoje`,
        },
        {
          role: "user",
          content: JSON.stringify(symptoms),
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    logger.info("Severidade analisada:", {
      symptoms,
      severity: analysis.severity,
      score: analysis.score,
    });

    return analysis;
  } catch (error) {
    logger.error("Erro ao classificar severidade:", error.message);
    return {
      severity: "moderate",
      score: 5,
      recommendations: ["Mantenha suas rotinas de autocuidado"],
      needs_medical_attention: false,
      suggested_actions: [
        "Descanse quando possível",
        "Pratique técnicas de relaxamento",
      ],
    };
  }
}

module.exports = {
  analyzeIntent,
  analyzeCheckInResponse,
  extractName,
  classifySymptomSeverity,
  needsDailyCheckIn,
};
