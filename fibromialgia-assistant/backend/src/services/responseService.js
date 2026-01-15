const { openai } = require("../config/openai");
const logger = require("../utils/logger");
const userService = require("./userService");
const intentService = require("./intentService");
const liviaService = require("./liviaService");

/**
 * Gera resposta personalizada da Livia baseada na intenção e contexto
 */
async function generateResponse(intent, user) {
  try {
    // Verifica se é usuário novo
    if (
      intent.intent === "new_user_greeting" ||
      (user.is_new_user && !intent.is_name_response)
    ) {
      return liviaService.getWelcomeMessage();
    }

    // Verifica se está fornecendo o nome
    if (intent.is_name_response || intent.intent === "provide_name") {
      return await handleNameResponse(intent, user);
    }

    // Verifica se é check-in diário
    if (intent.intent === "daily_checkin") {
      return await handleDailyCheckIn(intent, user);
    }

    // Verifica se precisa solicitar check-in
    if (shouldRequestCheckIn(user)) {
      return liviaService.getDailyCheckInMessage(user.name);
    }

    // Gera resposta baseada na intenção específica
    return await generateIntentBasedResponse(intent, user);
  } catch (error) {
    logger.error("Erro ao gerar resposta da Livia:", error.message);
    return getErrorResponse(user);
  }
}

/**
 * Manipula resposta com nome do usuário
 */
async function handleNameResponse(intent, user) {
  try {
    let extractedName = intent.extracted_name;

    // Se não conseguiu extrair o nome da análise, tenta extrair novamente
    if (!extractedName) {
      const nameExtraction = await intentService.extractName(
        intent.message || ""
      );
      if (nameExtraction.is_valid_name && nameExtraction.confidence > 0.6) {
        extractedName = nameExtraction.name;
      }
    }

    if (extractedName) {
      // Atualiza o nome no banco
      await userService.updateUserName(user.id, extractedName);
      return liviaService.getNameConfirmationMessage(extractedName);
    } else {
      return [
        "Desculpe, não consegui entender seu nome.",
        "Pode repetir, por favor? Apenas seu primeiro nome.",
      ];
    }
  } catch (error) {
    logger.error("Erro ao processar nome:", error);
    return [
      "Ops, tive um probleminha para salvar seu nome.",
      "Pode tentar novamente?",
    ];
  }
}

/**
 * Manipula check-in diário
 */
async function handleDailyCheckIn(intent, user) {
  try {
    // Analisa a resposta do check-in
    const checkInAnalysis = await intentService.analyzeCheckInResponse(
      intent.message || ""
    );

    // Registra o check-in no banco
    await userService.recordDailyCheckIn(user.id, checkInAnalysis);

    // Gera resposta empática baseada nos sintomas
    const response = [];

    if (
      checkInAnalysis.severity_level === "severe" ||
      (checkInAnalysis.pain_level && checkInAnalysis.pain_level >= 8)
    ) {
      response.push(
        `${user.name}, percebo que você está com bastante dor hoje.`
      );
      response.push("É importante ser gentil consigo mesma em dias como este.");

      if (checkInAnalysis.pain_level >= 9) {
        response.push(
          "Se a dor estiver muito intensa, considere entrar em contato com seu médico."
        );
      }
    } else if (
      checkInAnalysis.mood === "good" &&
      checkInAnalysis.pain_level <= 4
    ) {
      response.push(
        `Que bom saber que você está se sentindo melhor hoje, ${user.name}! 😊`
      );
    } else {
      response.push(`Obrigada por compartilhar como você está, ${user.name}.`);
    }

    response.push(
      "Vou anotar essas informações para identificarmos padrões juntas."
    );

    // Adiciona sugestões baseadas no estado atual
    if (checkInAnalysis.symptoms && checkInAnalysis.symptoms.length > 0) {
      response.push(
        "Com base no que você me contou, algumas sugestões para hoje:"
      );

      const suggestions = await generateImmediateSuggestions(checkInAnalysis);
      suggestions.forEach((suggestion) => response.push(`• ${suggestion}`));
    }

    return response;
  } catch (error) {
    logger.error("Erro ao processar check-in:", error);
    return [
      `Obrigada por compartilhar, ${user.name}.`,
      "Vou anotar essas informações.",
      "Como posso te ajudar hoje?",
    ];
  }
}

/**
 * Gera sugestões imediatas baseadas no check-in
 */
async function generateImmediateSuggestions(checkInAnalysis) {
  const suggestions = [];

  if (checkInAnalysis.pain_level >= 7) {
    suggestions.push("Descanse quando possível");
    suggestions.push("Use compressas mornas ou frias");
    suggestions.push("Pratique respiração profunda");
  } else if (checkInAnalysis.pain_level >= 4) {
    suggestions.push("Mantenha-se hidratada");
    suggestions.push("Faça alongamentos suaves");
    suggestions.push("Evite atividades muito intensas");
  } else {
    suggestions.push("Aproveite para fazer atividades que gosta");
    suggestions.push("Mantenha suas rotinas de autocuidado");
  }

  if (
    checkInAnalysis.mood === "anxious" ||
    checkInAnalysis.mood === "depressed"
  ) {
    suggestions.push("Conecte-se com pessoas queridas");
    suggestions.push("Pratique mindfulness ou meditação");
  }

  if (checkInAnalysis.sleep_quality === "poor") {
    suggestions.push("Estabeleça uma rotina relaxante para esta noite");
    suggestions.push("Evite telas antes de dormir");
  }

  return suggestions.slice(0, 3); // Máximo 3 sugestões
}

/**
 * Verifica se deve solicitar check-in
 */
function shouldRequestCheckIn(user) {
  if (!user.name || user.is_new_user) return false;

  // Verifica se é final do dia e ainda não fez check-in
  return userService.isCheckInTime() && userService.needsDailyCheckIn(user);
}

/**
 * Gera resposta baseada na intenção específica
 */
async function generateIntentBasedResponse(intent, user) {
  const userName = user.name || "querida";

  switch (intent.intent) {
    case "symptom_report":
      return liviaService.getSymptomResponse(userName, intent.symptoms || []);

    case "pattern_question":
      return await handlePatternQuestion(user);

    case "lifestyle_advice":
      return await handleLifestyleAdvice(user);

    case "emotional_support":
      return handleEmotionalSupport(userName);

    case "treatment_question":
      return handleTreatmentQuestion(userName);

    case "medication_question":
      return handleMedicationQuestion(userName);

    case "exercise_question":
      return handleExerciseQuestion(userName);

    case "sleep_question":
      return handleSleepQuestion(userName);

    case "general_greeting":
      return handleGeneralGreeting(userName);

    default:
      return await generateContextualResponse(intent, user);
  }
}

/**
 * Gera resposta contextual usando IA
 */
async function generateContextualResponse(intent, user) {
  try {
    const checkInHistory = await userService.getCheckInHistory(user.id, 3);
    const userName = user.name || "querida";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é Livia, uma copiloto especializada em fibromialgia. Suas características:
          
          PERSONALIDADE:
          - Empática, acolhedora e profissional
          - Fala de forma natural e próxima
          - Sempre usa o nome da pessoa
          - Focada em ser uma copiloto do dia a dia
          - Baseada em evidências científicas
          
          LIMITAÇÕES IMPORTANTES:
          - NUNCA diagnostica doenças
          - NUNCA prescreve medicamentos
          - Sempre sugere consultar profissionais quando necessário
          - Foca em qualidade de vida e autocuidado
          
          ESTILO DE RESPOSTA:
          - Mensagens curtas e diretas
          - Máximo 2-3 frases por mensagem
          - Use emojis moderadamente
          - Seja prática e orientada a ações
          
          Responda em português brasileiro como uma lista de strings, onde cada string é uma mensagem separada.`,
        },
        {
          role: "user",
          content: `Nome do usuário: ${userName}
          Intenção: ${intent.intent}
          Mensagem: ${intent.message || ""}
          Sentimento: ${intent.sentiment || "neutral"}
          
          Histórico recente: ${JSON.stringify(checkInHistory.slice(0, 2))}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content;

    // Tenta parsear como JSON, se não conseguir, quebra em sentenças
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return liviaService.breakMessageIntoChunks(response, 180);
    }

    return liviaService.breakMessageIntoChunks(response, 180);
  } catch (error) {
    logger.error("Erro ao gerar resposta contextual:", error);
    return [
      `${user.name || "Querida"}, como posso te ajudar hoje?`,
      "Estou aqui para te apoiar no que precisar.",
    ];
  }
}

/**
 * Respostas específicas para diferentes tipos de perguntas
 */
async function handlePatternQuestion(user) {
  const checkInHistory = await userService.getCheckInHistory(user.id, 14);
  const userName = user.name || "querida";

  if (checkInHistory.length < 3) {
    return [
      `${userName}, ainda estamos coletando dados para identificar padrões.`,
      "Continue registrando como você se sente diariamente.",
      "Em alguns dias teremos informações mais precisas sobre seus padrões.",
    ];
  }

  // Análise básica de padrões
  const avgPain =
    checkInHistory
      .filter((c) => c.pain_level)
      .reduce((sum, c) => sum + c.pain_level, 0) /
    checkInHistory.filter((c) => c.pain_level).length;

  return [
    `${userName}, analisando seus últimos registros:`,
    `Sua dor média tem sido ${avgPain.toFixed(1)}/10.`,
    "Vou continuar observando padrões para te dar insights mais detalhados.",
  ];
}

function handleLifestyleAdvice(user) {
  const userName = user.name || "querida";
  return [
    `${userName}, para fibromialgia, foque em:`,
    "• Sono regular (7-9h por noite)",
    "• Exercícios leves e regulares",
    "• Alimentação anti-inflamatória",
    "• Gerenciamento do estresse",
    "Qual área você gostaria que eu detalhe mais?",
  ];
}

function handleEmotionalSupport(userName) {
  return [
    `${userName}, entendo que viver com fibromialgia pode ser desafiador.`,
    "Você não está sozinha nessa jornada.",
    "É normal ter dias difíceis - seja gentil consigo mesma.",
    "Quer conversar sobre o que está sentindo?",
  ];
}

function handleTreatmentQuestion(userName) {
  return [
    `${userName}, existem várias abordagens para fibromialgia:`,
    "• Exercícios regulares e fisioterapia",
    "• Técnicas de relaxamento",
    "• Terapias complementares",
    "• Acompanhamento médico multidisciplinar",
    "Sempre converse com seu médico sobre as melhores opções para você.",
  ];
}

function handleMedicationQuestion(userName) {
  return [
    `${userName}, sobre medicamentos, apenas seu médico pode orientar.`,
    "Cada pessoa responde diferente aos tratamentos.",
    "É importante manter diálogo aberto com sua equipe médica.",
    "Posso te ajudar com estratégias não-medicamentosas de bem-estar.",
  ];
}

function handleExerciseQuestion(userName) {
  return [
    `${userName}, exercícios para fibromialgia:`,
    "• Caminhadas leves (10-15 min)",
    "• Alongamentos suaves",
    "• Yoga ou tai chi",
    "• Exercícios na água",
    "Comece devagar e escute seu corpo!",
  ];
}

function handleSleepQuestion(userName) {
  return [
    `${userName}, para melhorar o sono:`,
    "• Horários regulares para dormir/acordar",
    "• Ambiente escuro e fresco",
    "• Relaxamento antes de dormir",
    "• Evite cafeína à tarde",
    "• Telas longe 1h antes de dormir",
  ];
}

function handleGeneralGreeting(userName) {
  const greetings = [
    `Oi ${userName}! Como você está hoje?`,
    `Olá ${userName}! Como tem sido seu dia?`,
    `Oi ${userName}! Que bom te ver por aqui!`,
  ];

  const randomGreeting =
    greetings[Math.floor(Math.random() * greetings.length)];
  return [randomGreeting, "Em que posso te ajudar?"];
}

function getErrorResponse(user) {
  const userName = user.name || "querida";
  return [
    `${userName}, tive um probleminha técnico.`,
    "Pode tentar novamente?",
    "Estou aqui para te ajudar! 😊",
  ];
}

module.exports = {
  generateResponse,
};
