const {
  SYMPTOMS,
  PAIN_LEVELS,
  DIARY_TOPICS,
  MOOD_STATES,
} = require("../config/constants");
const logger = require("./logger");

/**
 * Formatador de mensagens para o assistente de fibromialgia
 * Responsável por formatar as mensagens de entrada e saída do assistente
 */
class MessageFormatter {
  /**
   * Formata uma mensagem para uso com o modelo de IA da OpenAI
   * @param {Array} messages - Array de mensagens no formato { role, content }
   * @returns {Array} - Array formatado para a API da OpenAI
   */
  static formatForOpenAI(messages) {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Formata uma mensagem para uso com o modelo Claude da Anthropic
   * @param {Array} messages - Array de mensagens no formato { role, content }
   * @returns {Array} - Array formatado para a API da Anthropic
   */
  static formatForClaude(messages) {
    return messages
      .map((msg) => {
        if (msg.role === "user") {
          return {
            role: "user",
            content: msg.content,
          };
        } else if (msg.role === "assistant") {
          return {
            role: "assistant",
            content: msg.content,
          };
        } else if (msg.role === "system") {
          // Claude usa o system prompt de forma separada
          return null;
        } else {
          // Para outros papéis, converter para usuário com prefixo
          return {
            role: "user",
            content: `[${msg.role}]: ${msg.content}`,
          };
        }
      })
      .filter(Boolean); // Remover itens nulos
  }

  /**
   * Extrai o prompt do sistema de um array de mensagens
   * @param {Array} messages - Array de mensagens
   * @returns {string|null} - Prompt do sistema ou null se não encontrado
   */
  static extractSystemPrompt(messages) {
    const systemMsg = messages.find((msg) => msg.role === "system");
    return systemMsg ? systemMsg.content : null;
  }

  /**
   * Formata uma mensagem de texto simples para exibição ao usuário
   * @param {string} text - Texto da mensagem
   * @returns {Object} - Mensagem formatada
   */
  static formatTextResponse(text) {
    return {
      type: "text",
      content: text,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Formata um objeto de sintomas para uso no sistema
   * @param {Object} symptomsData - Dados de sintomas do usuário
   * @returns {Object} - Objeto de sintomas formatado
   */
  static formatSymptomData(symptomsData) {
    try {
      const {
        symptomName,
        intensity,
        location,
        duration,
        triggers = [],
      } = symptomsData;

      // Validar nome do sintoma
      const validSymptom = Object.values(SYMPTOMS).includes(
        symptomName.toLowerCase()
      )
        ? symptomName.toLowerCase()
        : "other";

      // Validar intensidade da dor
      const validIntensity = Object.values(PAIN_LEVELS).includes(
        Number(intensity)
      )
        ? Number(intensity)
        : PAIN_LEVELS.MILD;

      // Formatar gatilhos
      const formattedTriggers = Array.isArray(triggers)
        ? triggers
            .filter((t) => t && typeof t === "string")
            .map((t) => t.trim().toLowerCase())
        : [];

      return {
        symptomName: validSymptom,
        intensity: validIntensity,
        location: location ? location.trim() : null,
        duration: duration ? duration.trim() : null,
        triggers: formattedTriggers,
        recordedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Erro ao formatar dados de sintomas:", error);
      return {
        symptomName: "other",
        intensity: PAIN_LEVELS.MILD,
        recordedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Formata dados de diário para uso no sistema
   * @param {Object} diaryData - Dados do diário do usuário
   * @returns {Object} - Objeto de diário formatado
   */
  static formatDiaryEntry(diaryData) {
    try {
      const {
        painLevel,
        medication,
        sleepQuality,
        mood,
        activityLevel,
        diet,
        triggerFactors,
        notes,
      } = diaryData;

      // Validar nível de dor
      const validPainLevel = Object.values(PAIN_LEVELS).includes(
        Number(painLevel)
      )
        ? Number(painLevel)
        : null;

      // Validar humor
      const validMood = Object.values(MOOD_STATES).includes(mood?.toLowerCase())
        ? mood.toLowerCase()
        : null;

      // Formatar fatores desencadeantes
      const formattedTriggers = Array.isArray(triggerFactors)
        ? triggerFactors
            .filter((t) => t && typeof t === "string")
            .map((t) => t.trim().toLowerCase())
        : [];

      return {
        date: new Date().toISOString(),
        entries: {
          painLevel: validPainLevel,
          medication: medication ? medication.trim() : null,
          sleepQuality: sleepQuality ? sleepQuality.trim() : null,
          mood: validMood,
          activityLevel: activityLevel ? activityLevel.trim() : null,
          diet: diet ? diet.trim() : null,
          triggerFactors: formattedTriggers,
          notes: notes ? notes.trim() : null,
        },
      };
    } catch (error) {
      logger.error("Erro ao formatar entrada de diário:", error);
      return {
        date: new Date().toISOString(),
        entries: {},
      };
    }
  }

  /**
   * Formata um objeto de recomendação para exibição ao usuário
   * @param {Object} recommendation - Recomendação gerada pela IA
   * @returns {Object} - Recomendação formatada
   */
  static formatRecommendation(recommendation) {
    try {
      const {
        recomendacaoPrincipal,
        justificativa,
        acoesSugeridas = [],
        recursosAdicionais = [],
      } = recommendation;

      // Verificar e formatar o objeto
      return {
        type: "recommendation",
        content: {
          mainRecommendation:
            recomendacaoPrincipal ||
            "Não foi possível gerar uma recomendação específica",
          justification: justificativa || null,
          suggestedActions: Array.isArray(acoesSugeridas) ? acoesSugeridas : [],
          additionalResources: Array.isArray(recursosAdicionais)
            ? recursosAdicionais
            : [],
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Erro ao formatar recomendação:", error);
      return {
        type: "text",
        content:
          "Não foi possível processar a recomendação. Por favor, consulte um profissional de saúde para orientações personalizadas.",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Formata dados de análise de sentimento para uso no sistema
   * @param {Object} sentimentData - Dados de análise de sentimento
   * @returns {Object} - Objeto de sentimento formatado
   */
  static formatSentimentAnalysis(sentimentData) {
    try {
      const { classification, score, emotions = [] } = sentimentData;

      // Validar classificação de sentimento
      const validClassification = ["positivo", "negativo", "neutro"].includes(
        classification?.toLowerCase()
      )
        ? classification.toLowerCase()
        : "neutro";

      // Validar score
      const validScore =
        typeof score === "number" && score >= -1 && score <= 1 ? score : 0;

      // Validar emoções
      const validEmotions = Array.isArray(emotions)
        ? emotions
            .filter((e) => e && typeof e === "string")
            .map((e) => e.trim().toLowerCase())
        : [];

      return {
        classification: validClassification,
        score: validScore,
        emotions: validEmotions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Erro ao formatar análise de sentimento:", error);
      return {
        classification: "neutro",
        score: 0,
        emotions: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Formata uma mensagem do WhatsApp para uso no sistema
   * @param {Object} whatsappMessage - Mensagem recebida do webhook do WhatsApp
   * @returns {Object} - Mensagem formatada
   */
  static formatWhatsAppMessage(whatsappMessage) {
    try {
      const {
        messageId,
        from,
        timestamp,
        type,
        text,
        image,
        document,
        button,
        interactive,
      } = whatsappMessage;

      // Construir objeto base da mensagem
      const formattedMessage = {
        id: messageId,
        from,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        type,
        source: "whatsapp",
      };

      // Adicionar conteúdo específico com base no tipo
      switch (type) {
        case "text":
          formattedMessage.content = text;
          break;
        case "image":
          formattedMessage.content = {
            imageId: image.id,
            caption: image.caption || null,
          };
          break;
        case "document":
          formattedMessage.content = {
            documentId: document.id,
            filename: document.filename,
            caption: document.caption || null,
          };
          break;
        case "button":
          formattedMessage.content = {
            text: button.text,
            payload: button.payload,
          };
          break;
        case "interactive":
          if (interactive.type === "button_reply") {
            formattedMessage.content = {
              interactiveType: "button",
              buttonId: interactive.button_reply.id,
              buttonTitle: interactive.button_reply.title,
            };
          } else if (interactive.type === "list_reply") {
            formattedMessage.content = {
              interactiveType: "list",
              listId: interactive.list_reply.id,
              listTitle: interactive.list_reply.title,
              listDescription: interactive.list_reply.description,
            };
          }
          break;
        default:
          formattedMessage.content = null;
      }

      return formattedMessage;
    } catch (error) {
      logger.error("Erro ao formatar mensagem do WhatsApp:", error);
      return {
        id: whatsappMessage.messageId || "unknown",
        from: whatsappMessage.from || "unknown",
        timestamp: new Date().toISOString(),
        type: "unknown",
        content: null,
        source: "whatsapp",
      };
    }
  }

  /**
   * Sanitiza o texto de entrada para remover conteúdo potencialmente problemático
   * @param {string} text - Texto de entrada
   * @returns {string} - Texto sanitizado
   */
  static sanitizeInput(text) {
    if (!text) return "";

    // Remove caracteres de controle
    let sanitized = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

    // Remove comandos SQL maliciosos
    sanitized = sanitized.replace(
      /(\b)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)(\b)/gi,
      "[$2]"
    );

    // Remove scripts
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "[script removido]"
    );

    // Limita o comprimento
    if (sanitized.length > 4000) {
      sanitized = sanitized.substring(0, 4000) + "... (texto truncado)";
    }

    return sanitized.trim();
  }
}

module.exports = MessageFormatter;
