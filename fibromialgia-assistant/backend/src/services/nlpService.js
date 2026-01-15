const { OpenAIService } = require("../api/openai");
const { ClaudeService } = require("../api/claude");
const ContextManager = require("../utils/contextManager");
const MessageFormatter = require("../utils/messageFormatter");
const {
  systemPromptWithContext,
  symptomAnalysisPrompt,
  educationalContentPrompt,
} = require("../utils/promptTemplates");
const logger = require("../utils/logger");
const {
  ErrorHandler,
  AssistantError,
  ErrorCodes,
} = require("../utils/errorHandler");
const { config } = require("../config");

/**
 * Serviço de Processamento de Linguagem Natural
 * Responsável por interações com modelos de IA para analisar e responder mensagens
 */
class NLPService {
  /**
   * Processa uma mensagem do usuário e gera uma resposta
   * @param {string} userId - ID do usuário
   * @param {string} message - Mensagem do usuário
   * @returns {Promise<Object>} - Resposta processada
   */
  static async processMessage(userId, message) {
    try {
      // Sanitizar mensagem de entrada
      const sanitizedMessage = MessageFormatter.sanitizeInput(message);

      // Preparar contexto da conversa
      const context = await ContextManager.prepareConversationContext(
        userId,
        sanitizedMessage
      );

      // Analisar a mensagem para extrair informações relevantes
      const messageAnalysis = await this.analyzeMessage(sanitizedMessage);

      // Armazenar insights extraídos da mensagem
      if (messageAnalysis) {
        await ContextManager.storeMessageInsights(
          userId,
          sanitizedMessage,
          messageAnalysis
        );
      }

      // Gerar resposta com base no modelo configurado
      let response;
      if (config.assistant.modelProvider === "claude") {
        response = await this.generateClaudeResponse(context);
      } else {
        response = await this.generateOpenAIResponse(context);
      }

      // Adicionar resposta ao histórico
      await ContextManager.addMessageToHistory(userId, response, false);

      return {
        type: "text",
        content: response,
        userId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Erro ao processar mensagem do usuário ${userId}:`, error);

      // Tratar erros específicos
      let assistantError;
      if (error.response && error.response.status) {
        if (error.message.includes("openai")) {
          assistantError = ErrorHandler.handleOpenAIError(error);
        } else if (
          error.message.includes("claude") ||
          error.message.includes("anthropic")
        ) {
          assistantError = ErrorHandler.handleClaudeError(error);
        } else {
          assistantError = ErrorHandler.handleError(error);
        }
      } else {
        assistantError = ErrorHandler.handleError(error);
      }

      // Gerar mensagem amigável para o usuário
      return {
        type: "error",
        content:
          "Desculpe, estou tendo dificuldades para processar sua mensagem neste momento. Por favor, tente novamente em alguns instantes.",
        userId,
        timestamp: new Date().toISOString(),
        error: assistantError.toApiResponse(),
      };
    }
  }

  /**
   * Gera uma resposta usando o modelo OpenAI
   * @param {Object} context - Contexto da conversa
   * @returns {Promise<string>} - Resposta gerada
   */
  static async generateOpenAIResponse(context) {
    try {
      const { user, history, currentMessage } = context;

      // Preparar mensagens para o modelo
      const messages = [
        { role: "system", content: systemPromptWithContext(context) },
        ...history,
      ];

      // Adicionar a mensagem atual, se não estiver no histórico
      if (
        currentMessage &&
        !history.some(
          (msg) => msg.role === "user" && msg.content === currentMessage
        )
      ) {
        messages.push({ role: "user", content: currentMessage });
      }

      // Formatar mensagens para a API da OpenAI
      const formattedMessages = MessageFormatter.formatForOpenAI(messages);

      // Gerar completions
      const { text } = await OpenAIService.generateChatCompletion(
        formattedMessages,
        {
          temperature: 0.7,
          maxTokens: 500,
        }
      );

      return text;
    } catch (error) {
      logger.error("Erro ao gerar resposta com OpenAI:", error);
      throw error;
    }
  }

  /**
   * Gera uma resposta usando o modelo Claude
   * @param {Object} context - Contexto da conversa
   * @returns {Promise<string>} - Resposta gerada
   */
  static async generateClaudeResponse(context) {
    try {
      const { user, history, currentMessage } = context;

      // Preparar mensagens para o modelo
      const messages = [...history];

      // Adicionar a mensagem atual, se não estiver no histórico
      if (
        currentMessage &&
        !history.some(
          (msg) => msg.role === "user" && msg.content === currentMessage
        )
      ) {
        messages.push({ role: "user", content: currentMessage });
      }

      // Formatar mensagens para a API do Claude
      const formattedMessages = MessageFormatter.formatForClaude(messages);

      // Extrair o sistema prompt do contexto
      const systemPrompt = systemPromptWithContext(context);

      // Gerar resposta empática com Claude
      const { response } = await ClaudeService.generateEmpatheticResponse(
        formattedMessages.length > 0
          ? formattedMessages[formattedMessages.length - 1].content
          : currentMessage,
        systemPrompt
      );

      return response;
    } catch (error) {
      logger.error("Erro ao gerar resposta com Claude:", error);
      throw error;
    }
  }

  /**
   * Analisa uma mensagem para extrair informações relevantes sobre fibromialgia
   * @param {string} message - Mensagem a ser analisada
   * @returns {Promise<Object>} - Informações extraídas
   */
  static async analyzeMessage(message) {
    try {
      // Se a mensagem for muito curta, pular análise
      if (!message || message.length < 10) {
        return null;
      }

      // Extrair informações sobre fibromialgia da mensagem
      const extractedInfo = await OpenAIService.extractFibromyalgiaInfo(
        message
      );

      // Analisar sentimento da mensagem
      const sentiment = await OpenAIService.analyzeSentiment(message);

      // Classificar o conteúdo da mensagem
      const classification = await OpenAIService.classifyContent(message);

      // Combinar todas as informações extraídas
      return {
        ...extractedInfo,
        sentiment,
        classification,
      };
    } catch (error) {
      logger.error("Erro ao analisar mensagem:", error);
      // Retornar null em caso de erro para não interromper o fluxo
      return null;
    }
  }

  /**
   * Analisa sintomas específicos e fornece informações relevantes
   * @param {string} userId - ID do usuário
   * @param {Array} symptoms - Lista de sintomas
   * @returns {Promise<Object>} - Análise dos sintomas
   */
  static async analyzeSymptoms(userId, symptoms) {
    try {
      // Formatar sintomas para análise
      const symptomsList = Array.isArray(symptoms) ? symptoms : [symptoms];

      // Criar prompt específico para análise de sintomas
      const prompt = symptomAnalysisPrompt(symptomsList);

      // Obter contexto do usuário
      const context = await ContextManager.prepareConversationContext(
        userId,
        null
      );

      // Preparar mensagens para o modelo
      const messages = [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `Por favor, analise estes sintomas de fibromialgia: ${symptomsList.join(
            ", "
          )}`,
        },
      ];

      // Gerar análise
      const { text } = await OpenAIService.generateChatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 800,
      });

      return {
        type: "symptom_analysis",
        content: text,
        symptoms: symptomsList,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(
        `Erro ao analisar sintomas para o usuário ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Gera recomendações personalizadas com base no histórico do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - Recomendações geradas
   */
  static async generateRecommendations(userId) {
    try {
      // Obter perfil completo do usuário
      const userProfile = await ContextManager.getUserProfile(userId);

      if (!userProfile) {
        throw new AssistantError(
          "Perfil de usuário não encontrado",
          ErrorCodes.USER_NOT_FOUND
        );
      }

      // Preparar dados para recomendação
      const { data: symptoms } = await SupabaseClient.select("user_symptoms", {
        filters: [{ column: "user_id", operator: "eq", value: userId }],
        order: "recorded_at",
        ascending: false,
        limit: 20,
      });

      const { data: painLevels } = await SupabaseClient.select(
        "user_pain_levels",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
          order: "recorded_at",
          ascending: false,
          limit: 10,
        }
      );

      const { data: activities } = await SupabaseClient.select(
        "user_activities",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
          order: "recorded_at",
          ascending: false,
          limit: 10,
        }
      );

      const { data: sleepData } = await SupabaseClient.select(
        "user_sleep_quality",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
          order: "recorded_at",
          ascending: false,
          limit: 10,
        }
      );

      // Obter histórico de conversas recentes
      const recentMessages = await ContextManager.getConversationHistory(
        userId,
        10
      );

      // Gerar recomendação baseada nos dados do usuário
      const userData = {
        symptoms: symptoms.map((s) => s.symptom_name),
        painLevels: painLevels.map((p) => p.level),
        medications: userProfile.medications.map((m) => m.medication_name),
        activities: activities.map((a) => a.activity_type),
        sleepQuality: sleepData.map((s) => s.quality),
        recentConversations: recentMessages,
      };

      const recommendation = await OpenAIService.generateRecommendation(
        userData
      );

      // Formatar recomendação para retorno
      return MessageFormatter.formatRecommendation(recommendation);
    } catch (error) {
      logger.error(
        `Erro ao gerar recomendações para o usuário ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Gera conteúdo educativo sobre um tópico específico de fibromialgia
   * @param {string} topic - Tópico específico
   * @returns {Promise<Object>} - Conteúdo educativo
   */
  static async generateEducationalContent(topic) {
    try {
      // Verificar se já existe conteúdo sobre este tópico no banco
      const { data: existingContent } = await SupabaseClient.select(
        "educational_content",
        {
          filters: [
            { column: "topic", operator: "eq", value: topic.toLowerCase() },
            { column: "active", operator: "eq", value: true },
          ],
          limit: 1,
        }
      );

      // Se existir conteúdo, retornar
      if (existingContent && existingContent.length > 0) {
        return {
          type: "educational",
          content: existingContent[0].content,
          topic,
          timestamp: new Date().toISOString(),
        };
      }

      // Caso contrário, gerar novo conteúdo
      let content;

      // Tentar com Claude primeiro, que é mais detalhado e educativo
      try {
        const claudeResponse = await ClaudeService.generateEducationalContent(
          topic
        );
        content = claudeResponse.content;
      } catch (claudeError) {
        logger.warn(
          `Erro ao gerar conteúdo educativo com Claude, tentando OpenAI: ${claudeError.message}`
        );

        // Fallback para OpenAI
        const messages = [
          { role: "system", content: educationalContentPrompt(topic) },
          {
            role: "user",
            content: `Por favor, me explique sobre ${topic} no contexto da fibromialgia.`,
          },
        ];

        const { text } = await OpenAIService.generateChatCompletion(messages, {
          temperature: 0.3,
          maxTokens: 1000,
        });

        content = text;
      }

      // Armazenar o conteúdo gerado para uso futuro
      await SupabaseClient.insert("educational_content", {
        topic: topic.toLowerCase(),
        content,
        source: "ai_generated",
        active: true,
        created_at: new Date().toISOString(),
      });

      return {
        type: "educational",
        content,
        topic,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Erro ao gerar conteúdo educativo sobre ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Analisa um diário de sintomas e fornece insights
   * @param {string} userId - ID do usuário
   * @param {Object} diaryData - Dados do diário
   * @returns {Promise<Object>} - Análise do diário
   */
  static async analyzeDiary(userId, diaryData) {
    try {
      // Formatar entradas do diário
      const formattedDiary = MessageFormatter.formatDiaryEntry(diaryData);

      // Obter histórico de diários anteriores
      const { data: previousEntries } = await SupabaseClient.select(
        "user_diary",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
          order: "date",
          ascending: false,
          limit: 5,
        }
      );

      // Preparar mensagens para análise
      const messages = [
        {
          role: "system",
          content: `
            Você é um especialista em fibromialgia analisando um diário de paciente.
            Analise a entrada atual em comparação com entradas anteriores, procurando:
            1. Padrões e tendências nos sintomas
            2. Correlações entre gatilhos e sintomas
            3. Eficácia de medicações ou intervenções
            4. Sugestões personalizadas baseadas nos dados
            
            Forneça uma análise perspicaz, empática e orientada para o paciente.
          `,
        },
        {
          role: "user",
          content: `
            Entrada atual do diário:
            ${JSON.stringify(formattedDiary.entries)}
            
            Entradas anteriores:
            ${JSON.stringify(previousEntries)}
            
            Por favor, analise meus sintomas e forneça insights úteis.
          `,
        },
      ];

      // Gerar análise
      const { text } = await OpenAIService.generateChatCompletion(messages, {
        temperature: 0.4,
        maxTokens: 800,
      });

      // Armazenar a entrada do diário com a análise
      await SupabaseClient.insert("user_diary", {
        user_id: userId,
        ...formattedDiary,
        analysis: text,
        created_at: new Date().toISOString(),
      });

      return {
        type: "diary_analysis",
        content: text,
        diary: formattedDiary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Erro ao analisar diário para o usuário ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = NLPService;
