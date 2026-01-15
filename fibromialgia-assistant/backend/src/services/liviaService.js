const { openai } = require("../config/openai");
const logger = require("../utils/logger");
const userService = require("./userService");
const intelligenceService = require("./intelligenceService");

/**
 * Serviço especializado nas funcionalidades da Livia
 * Com personalidade humana, empática e natural
 */

// ==============================================
// PERSONALIDADE E MENSAGENS DA LIVIA
// ==============================================

/**
 * Gera mensagem de boas-vindas personalizada e natural
 * @param {string} userName - Nome do usuário (opcional)
 * @returns {string} Mensagem de boas-vindas
 */
function getWelcomeMessage(userName = null) {
  if (userName) {
    const welcomeVariations = [
      `Oi ${userName}! Que bom te ver de novo 🌷\n\nComo você está se sentindo hoje?`,
      `Olá ${userName}! 😊 Espero que você esteja bem.\n\nMe conta como foi seu dia hoje?`,
      `Oi querida ${userName}! 💜\n\nComo você tá? Quero saber como você está se sentindo.`,
    ];
    return welcomeVariations[
      Math.floor(Math.random() * welcomeVariations.length)
    ];
  }

  return "Oi! Eu sou a Livia 🌷\n\nSou assistente no dia a dia com a fibromialgia.\n\nAntes da gente começar, posso saber seu nome?";
}

/**
 * Gera mensagem de check-in diário mais natural
 * @param {string} userName - Nome do usuário
 * @returns {string} Mensagem de check-in
 */
function getDailyCheckInMessage(userName) {
  const messages = [
    `${userName}, como você tá se sentindo hoje?\n\nTeve alguma dor, cansaço ou outro sintoma?`,
    `Oi ${userName}! 😊\n\nQue tal me contar como foi seu dia? Como está se sentindo?`,
    `Olá querida ${userName}!\n\nVamos conversar sobre como você está hoje? Me conta tudo 💜`,
    `${userName}, antes de encerrar o dia:\n\nComo foi hoje no geral? Teve algo que te ajudou ou piorou os sintomas?`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Variações de expressões para conversas naturais
 */
const CONVERSATION_EXPRESSIONS = {
  understanding: [
    "Entendi...",
    "Isso faz sentido sim.",
    "Poxa, entendo como isso pode incomodar 😕",
    "Imagino como deve ser difícil.",
    "Compreendo perfeitamente.",
  ],
  encouraging: [
    "Você quer me contar mais sobre isso?",
    "Tem algo que você acha que ajudou?",
    "Como você se sentiu em relação a isso?",
    "Que bom que você está compartilhando isso comigo.",
  ],
  supportive: [
    "Tudo bem se você não quiser falar sobre isso agora, tá? Tô aqui quando quiser conversar. 💛",
    "Pode contar comigo sempre 💜",
    "Vamos juntas encontrar o que funciona melhor pra você.",
    "Você não está sozinha nessa jornada.",
  ],
  contextual: [
    "Lembrei que você comentou sobre",
    "Como você mencionou antes",
    "Baseada no que você me contou",
    "Pensando no que conversamos",
  ],
};

// ==============================================
// LÓGICA DE CONVERSAÇÃO AVANÇADA E HUMANA
// ==============================================

/**
 * Processa mensagem do usuário com personalidade empática
 * @param {string} userId - ID do usuário
 * @param {string} message - Mensagem do usuário
 * @param {Object} user - Dados do usuário
 * @returns {Promise<Object>} Resposta da Livia
 */
async function processUserMessage(userId, message, user) {
  try {
    // 1. Salva mensagem do usuário no histórico
    await userService.saveConversationMessage(userId, message, true);

    // 2. Busca contexto recente da conversa (últimas 15 mensagens para mais contexto)
    const conversationContext = await userService.getRecentConversationContext(
      userId,
      15
    );

    // 3. Analisa intenção com contexto avançado
    const intent = await analyzeMessageIntentAdvanced(
      message,
      user,
      conversationContext
    );

    // 4. Gera resposta empática e contextualizada
    const response = await generateEmpatheticResponse(
      intent,
      user,
      conversationContext
    );

    // 5. Salva resposta da Livia no histórico
    await userService.saveConversationMessage(userId, response.text, false, {
      intent: intent.type,
      sentiment: intent.sentiment,
      empathy_level: response.empathy_level || "medium",
    });

    return response;
  } catch (error) {
    logger.error("Erro ao processar mensagem do usuário:", error);
    return {
      text: `Desculpa ${
        user.name || "querida"
      }, tive um probleminha técnico.\n\nPode repetir? Tô aqui pra te ouvir 💜`,
      type: "error",
    };
  }
}

/**
 * Analisa intenção da mensagem com IA avançada
 * @param {string} message - Mensagem do usuário
 * @param {Object} user - Dados do usuário
 * @param {Array} context - Contexto da conversa
 * @returns {Promise<Object>} Intenção identificada
 */
async function analyzeMessageIntentAdvanced(message, user, context) {
  try {
    const contextString = context
      .slice(-8) // Últimas 8 mensagens para contexto rico
      .map((m) => `${m.is_from_user ? "Usuário" : "Livia"}: ${m.message_text}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é Livia, uma assistente empática especializada em fibromialgia com personalidade carinhosa e humana.

PERFIL DO USUÁRIO:
- Nome: ${user.name || "Não informado"}
- Onboarding completo: ${user.onboarding_completed ? "Sim" : "Não"}

HISTÓRICO RECENTE DA CONVERSA:
${contextString}

INSTRUÇÕES COMPORTAMENTAIS:
- Seja natural, empática e humana
- Varie suas expressões e reações
- Use o histórico para contextualizar
- Demonstre escuta ativa
- Evite repetições robóticas
- Seja carinhosa mas não invasiva

TIPOS DE INTENÇÃO:
1. "new_user_greeting" - Usuário novo se apresentando
2. "provide_name" - Fornecendo nome
3. "daily_checkin" - Quer fazer check-in diário  
4. "checkin_response" - Respondendo pergunta de check-in
5. "symptom_report" - Relatando sintomas/dor
6. "emotional_support" - Precisando de apoio emocional
7. "ask_suggestion" - Pedindo sugestão
8. "general_chat" - Conversa geral sobre fibromialgia
9. "gratitude" - Expressando gratidão
10. "concern_sharing" - Compartilhando preocupações

Analise a mensagem e responda em JSON:`,
        },
        {
          role: "user",
          content: `Mensagem atual: "${message}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const response = JSON.parse(completion.choices[0].message.content);

    return {
      type: response.intent || "general_chat",
      confidence: response.confidence || 0.8,
      sentiment: response.sentiment || "neutral",
      emotion: response.emotion || "neutral",
      context_awareness: response.context_awareness || false,
      urgency: response.urgency || "normal",
      entities: response.entities || {},
    };
  } catch (error) {
    logger.error("Erro ao analisar intenção:", error);
    return {
      type: "general_chat",
      confidence: 0.5,
      sentiment: "neutral",
      emotion: "neutral",
      urgency: "normal",
    };
  }
}

/**
 * Gera resposta empática e contextualizada
 * @param {Object} intent - Intenção identificada
 * @param {Object} user - Dados do usuário
 * @param {Array} context - Contexto da conversa
 * @returns {Promise<Object>} Resposta empática
 */
async function generateEmpatheticResponse(intent, user, context) {
  try {
    const userName = user.name || "querida";

    // Respostas específicas com personalidade humana
    switch (intent.type) {
      case "new_user_greeting":
        return {
          text: getWelcomeMessage(),
          type: "welcome",
          nextStep: "await_name",
          empathy_level: "warm",
        };

      case "provide_name":
        const extractedName = extractNameFromMessage(
          context[context.length - 1]?.message_text || ""
        );
        if (extractedName) {
          await userService.updateUserName(user.id, extractedName);
          return {
            text: `Que bom te conhecer, ${extractedName}! 😊\n\nTô aqui pra te acompanhar todos os dias, entender sua rotina e juntos criarmos maneiras de te ajudar a se sentir melhor.\n\nPode contar comigo 💜`,
            type: "name_confirmed",
            empathy_level: "high",
          };
        }
        break;

      case "daily_checkin":
        const checkInResult = await userService.startDailyCheckIn(user.id);
        if (checkInResult.completed) {
          return {
            text: checkInResult.message,
            type: "checkin_complete",
            empathy_level: "supportive",
          };
        }
        return {
          text: `${getDailyCheckInMessage(userName)}\n\n${
            checkInResult.question
          }`,
          type: "checkin_question",
          checkInId: checkInResult.checkInId,
          nextStep: checkInResult.nextStep,
          empathy_level: "caring",
        };

      case "symptom_report":
        return await handleSymptomReportEmpathetic(userName, intent, context);

      case "emotional_support":
        return await provideEmotionalSupportAdvanced(userName, intent);

      case "gratitude":
        return handleGratitude(userName);

      case "concern_sharing":
        return handleConcernSharing(userName, intent);

      default:
        return await generateNaturalResponse(userName, intent, context);
    }
  } catch (error) {
    logger.error("Erro ao gerar resposta empática:", error);
    return {
      text: `${userName}, desculpa, tive um probleminha.\n\nMas tô aqui pra te ouvir. Me conta de novo? 💜`,
      type: "error",
      empathy_level: "supportive",
    };
  }
}

// ==============================================
// HANDLERS EMPÁTICOS ESPECÍFICOS
// ==============================================

/**
 * Manipula relato de sintomas com empatia
 */
async function handleSymptomReportEmpathetic(userName, intent, context) {
  const understandingExpression =
    CONVERSATION_EXPRESSIONS.understanding[
      Math.floor(Math.random() * CONVERSATION_EXPRESSIONS.understanding.length)
    ];

  const encouragingExpression =
    CONVERSATION_EXPRESSIONS.encouraging[
      Math.floor(Math.random() * CONVERSATION_EXPRESSIONS.encouraging.length)
    ];

  return {
    text: `${understandingExpression}\n\n${encouragingExpression}`,
    type: "symptom_acknowledged",
    empathy_level: "high",
  };
}

/**
 * Fornece apoio emocional avançado
 */
async function provideEmotionalSupportAdvanced(userName, intent) {
  const supportiveExpression =
    CONVERSATION_EXPRESSIONS.supportive[
      Math.floor(Math.random() * CONVERSATION_EXPRESSIONS.supportive.length)
    ];

  let responseText = "";

  if (intent.emotion === "sad" || intent.sentiment === "negative") {
    responseText = `${userName}, eu entendo que você está passando por um momento difícil 😕\n\n${supportiveExpression}`;
  } else if (intent.emotion === "anxious") {
    responseText = `${userName}, sinto que você está preocupada.\n\nQuer me contar o que está te deixando assim? ${supportiveExpression}`;
  } else {
    responseText = `${userName}, estou aqui pra te acompanhar sempre.\n\n${supportiveExpression}`;
  }

  return {
    text: responseText,
    type: "emotional_support",
    empathy_level: "very_high",
  };
}

/**
 * Manipula expressões de gratidão
 */
function handleGratitude(userName) {
  const gratitudeResponses = [
    `Fico muito feliz em poder te ajudar, ${userName}! 💜\n\nÉ isso mesmo, juntas somos mais fortes.`,
    `Que bom saber que tô conseguindo te apoiar, ${userName}! 😊\n\nVocê merece todo cuidado do mundo.`,
    `Suas palavras me deixam muito feliz, ${userName}! 🌷\n\nTô aqui sempre que precisar.`,
  ];

  return {
    text: gratitudeResponses[
      Math.floor(Math.random() * gratitudeResponses.length)
    ],
    type: "gratitude_response",
    empathy_level: "warm",
  };
}

/**
 * Manipula compartilhamento de preocupações
 */
function handleConcernSharing(userName, intent) {
  return {
    text: `${userName}, obrigada por compartilhar isso comigo.\n\nSuas preocupações são válidas e é normal se sentir assim às vezes.\n\nQuer conversar mais sobre o que tá te incomodando? 💜`,
    type: "concern_acknowledged",
    empathy_level: "very_high",
  };
}

/**
 * Gera resposta natural usando IA avançada
 */
async function generateNaturalResponse(userName, intent, context) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é Livia, uma assistente carinhosa especializada em fibromialgia.

PERSONALIDADE:
- Humana, empática e natural
- Como uma amiga cuidadosa que entende de fibromialgia
- Conversa leve, variada e contextualizada
- Usa o histórico para ser mais assertiva

REGRAS IMPORTANTES:
1. NÃO repita "vou anotar isso" - seja natural
2. NÃO pergunte o que o usuário acabou de responder
3. Varie o vocabulário - seja espontânea
4. Demonstre escuta ativa e sensibilidade
5. Use emojis com moderação e naturalidade
6. Mantenha respostas entre 50-120 palavras
7. Quebre mensagens longas em partes

USUÁRIO: ${userName}
SENTIMENTO ATUAL: ${intent.sentiment}
EMOÇÃO: ${intent.emotion}

CONTEXTO RECENTE:
${context
  .slice(-3)
  .map((m) => `${m.is_from_user ? "Usuário" : "Você"}: ${m.message_text}`)
  .join("\n")}`,
        },
        {
          role: "user",
          content: context[context.length - 1]?.message_text || "",
        },
      ],
      temperature: 0.8,
      max_tokens: 250,
    });

    return {
      text: completion.choices[0].message.content,
      type: "natural_response",
      empathy_level: "medium",
    };
  } catch (error) {
    logger.error("Erro ao gerar resposta natural:", error);
    return {
      text: `${userName}, estou aqui pra conversar! 😊\n\nComo posso te ajudar hoje?`,
      type: "fallback",
      empathy_level: "supportive",
    };
  }
}

// ==============================================
// FUNÇÕES AUXILIARES MELHORADAS
// ==============================================

/**
 * Extrai nome de uma mensagem com mais precisão
 * @param {string} message - Mensagem
 * @returns {string|null} Nome extraído
 */
function extractNameFromMessage(message) {
  // Regex melhorado para extrair nomes
  const namePatterns = [
    /(?:sou|me chamo|meu nome é|eu sou|nome:?)\s+([a-záàâãéêíóôõúç]+)/i,
    /^([a-záàâãéêíóôõúç]+)$/i, // Nome simples
    /oi,?\s*(?:eu sou|sou)\s*(?:a\s*)?([a-záàâãéêíóôõúç]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1] && match[1].length >= 2) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
  }

  return null;
}

/**
 * Quebra mensagem em partes menores de forma inteligente
 * @param {string} text - Texto para quebrar
 * @param {number} maxLength - Tamanho máximo por parte
 * @returns {Array} Array de mensagens
 */
function breakMessageIntoChunks(text, maxLength = 120) {
  if (text.length <= maxLength) return [text];

  // Quebra por parágrafos primeiro
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      chunks.push(paragraph);
    } else {
      // Quebra por frases
      const sentences = paragraph.split(/[.!?\n]+/).filter((s) => s.trim());
      let currentChunk = "";

      for (const sentence of sentences) {
        const sentenceWithPunct = sentence.trim() + ". ";

        if ((currentChunk + sentenceWithPunct).length <= maxLength) {
          currentChunk += sentenceWithPunct;
        } else {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentenceWithPunct;
        }
      }

      if (currentChunk) chunks.push(currentChunk.trim());
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Detecta tipo de mídia (áudio, imagem, texto)
 * @param {Object} messageData - Dados da mensagem
 * @returns {string} Tipo de mídia
 */
function detectMediaType(messageData) {
  if (messageData.hasMedia) {
    if (messageData.type === "audio" || messageData.type === "ptt") {
      return "audio";
    } else if (messageData.type === "image") {
      return "image";
    } else if (messageData.type === "video") {
      return "video";
    }
  }
  return "text";
}

module.exports = {
  getWelcomeMessage,
  getDailyCheckInMessage,
  processUserMessage,
  analyzeMessageIntentAdvanced,
  generateEmpatheticResponse,
  breakMessageIntoChunks,
  extractNameFromMessage,
  detectMediaType,
  CONVERSATION_EXPRESSIONS,
};
