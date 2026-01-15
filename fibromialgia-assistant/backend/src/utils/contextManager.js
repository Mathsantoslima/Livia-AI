const { SupabaseClient } = require("../api/supabase");
const logger = require("./logger");
const { config } = require("../config");

/**
 * Gerenciador de contexto para conversas com IA
 * Responsável por manter o histórico de conversas e informações relevantes sobre os usuários
 */
class ContextManager {
  /**
   * Obtém o histórico de conversas de um usuário
   * @param {string} userId - ID do usuário
   * @param {number} limit - Número máximo de mensagens a serem retornadas
   * @returns {Promise<Array>} - Array de mensagens
   */
  static async getConversationHistory(
    userId,
    limit = config.assistant.maxHistoryLength
  ) {
    try {
      const { data } = await SupabaseClient.select("messages", {
        filters: [{ column: "user_id", operator: "eq", value: userId }],
        order: "created_at",
        ascending: false,
        limit,
      });

      // Formatar mensagens para o formato de conversação
      return data
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((msg) => ({
          role: msg.is_from_user ? "user" : "assistant",
          content: msg.content,
          timestamp: msg.created_at,
        }));
    } catch (error) {
      logger.error(
        `Erro ao obter histórico de conversas para o usuário ${userId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Adiciona uma mensagem ao histórico de conversas
   * @param {string} userId - ID do usuário
   * @param {string} content - Conteúdo da mensagem
   * @param {boolean} isFromUser - Indica se a mensagem é do usuário ou do assistente
   * @returns {Promise<Object>} - Mensagem adicionada
   */
  static async addMessageToHistory(userId, content, isFromUser = true) {
    try {
      const { data } = await SupabaseClient.insert("messages", {
        user_id: userId,
        content,
        is_from_user: isFromUser,
        created_at: new Date().toISOString(),
      });

      return data[0];
    } catch (error) {
      logger.error(
        `Erro ao adicionar mensagem ao histórico do usuário ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Prepara o contexto da conversa para envio à IA
   * @param {string} userId - ID do usuário
   * @param {string} currentMessage - Mensagem atual do usuário
   * @returns {Promise<Object>} - Contexto preparado
   */
  static async prepareConversationContext(userId, currentMessage) {
    try {
      // Obter histórico de conversas
      const history = await this.getConversationHistory(userId);

      // Obter informações do usuário
      const { data: userData } = await SupabaseClient.select("users", {
        filters: [{ column: "id", operator: "eq", value: userId }],
        limit: 1,
      });

      const user = userData && userData.length > 0 ? userData[0] : null;

      // Obter dados de saúde do usuário
      const { data: healthData } = await SupabaseClient.select(
        "user_health_data",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
          order: "recorded_at",
          ascending: false,
          limit: 10,
        }
      );

      // Obter sintomas recentes
      const { data: symptoms } = await SupabaseClient.select("user_symptoms", {
        filters: [{ column: "user_id", operator: "eq", value: userId }],
        order: "recorded_at",
        ascending: false,
        limit: 10,
      });

      // Adicionar a mensagem atual ao histórico
      if (currentMessage) {
        await this.addMessageToHistory(userId, currentMessage, true);
      }

      // Construir contexto completo
      return {
        user,
        history,
        currentMessage,
        healthData,
        symptoms,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(
        `Erro ao preparar contexto de conversa para o usuário ${userId}:`,
        error
      );
      // Retornar um contexto mínimo em caso de erro
      return {
        history: [],
        currentMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Obtém informações específicas sobre o usuário para melhorar a personalização
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - Informações do usuário
   */
  static async getUserProfile(userId) {
    try {
      // Obter dados básicos do usuário
      const { data: userData } = await SupabaseClient.select("users", {
        filters: [{ column: "id", operator: "eq", value: userId }],
        limit: 1,
      });

      if (!userData || userData.length === 0) {
        throw new Error(`Usuário ${userId} não encontrado`);
      }

      const user = userData[0];

      // Obter preferências do usuário
      const { data: preferences } = await SupabaseClient.select(
        "user_preferences",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
          limit: 1,
        }
      );

      // Obter medicamentos do usuário
      const { data: medications } = await SupabaseClient.select(
        "user_medications",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
        }
      );

      // Obter dados de atividades físicas
      const { data: activities } = await SupabaseClient.select(
        "user_activities",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
          order: "recorded_at",
          ascending: false,
          limit: 10,
        }
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        preferences:
          preferences && preferences.length > 0 ? preferences[0] : {},
        medications: medications || [],
        activities: activities || [],
        // Adicionar mais informações conforme necessário
      };
    } catch (error) {
      logger.error(`Erro ao obter perfil do usuário ${userId}:`, error);
      return null;
    }
  }

  /**
   * Extrai e armazena informações relevantes da mensagem do usuário
   * @param {string} userId - ID do usuário
   * @param {string} message - Mensagem do usuário
   * @param {Object} extractedData - Dados extraídos da análise da mensagem
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  static async storeMessageInsights(userId, message, extractedData) {
    try {
      // Se não há dados extraídos, não há o que armazenar
      if (!extractedData) return false;

      const now = new Date().toISOString();

      // Armazenar sintomas se foram mencionados
      if (extractedData.sintomas && extractedData.sintomas.length > 0) {
        for (const symptom of extractedData.sintomas) {
          await SupabaseClient.insert("user_symptoms", {
            user_id: userId,
            symptom_name: symptom,
            source: "message_analysis",
            intensity: extractedData.nivelDor || "medium",
            recorded_at: now,
          });
        }
      }

      // Armazenar medicamentos se foram mencionados
      if (extractedData.medicacoes && extractedData.medicacoes.length > 0) {
        for (const medication of extractedData.medicacoes) {
          await SupabaseClient.insert("user_medications", {
            user_id: userId,
            medication_name: medication,
            source: "message_analysis",
            recorded_at: now,
          });
        }
      }

      // Armazenar humor se foi mencionado
      if (extractedData.estadoEmocional) {
        await SupabaseClient.insert("user_mood", {
          user_id: userId,
          mood: extractedData.estadoEmocional,
          source: "message_analysis",
          recorded_at: now,
        });
      }

      // Armazenar a análise completa
      await SupabaseClient.insert("message_insights", {
        user_id: userId,
        message,
        insights: extractedData,
        created_at: now,
      });

      return true;
    } catch (error) {
      logger.error(
        `Erro ao armazenar insights da mensagem do usuário ${userId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Obtém perguntas frequentes relacionadas à fibromialgia
   * @param {string} category - Categoria das perguntas (opcional)
   * @returns {Promise<Array>} - Lista de FAQs
   */
  static async getFibromyalgiaFAQs(category = null) {
    try {
      let queryParams = {};

      if (category) {
        queryParams.filters = [
          { column: "category", operator: "eq", value: category },
        ];
      }

      const { data } = await SupabaseClient.select("faqs", queryParams);

      return data || [];
    } catch (error) {
      logger.error("Erro ao obter FAQs sobre fibromialgia:", error);
      return [];
    }
  }

  /**
   * Obtém conteúdo educativo sobre fibromialgia
   * @param {string} topic - Tópico específico (opcional)
   * @returns {Promise<Array>} - Conteúdo educativo
   */
  static async getEducationalContent(topic = null) {
    try {
      let queryParams = {};

      if (topic) {
        queryParams.filters = [
          { column: "topic", operator: "eq", value: topic },
        ];
      }

      const { data } = await SupabaseClient.select(
        "educational_content",
        queryParams
      );

      return data || [];
    } catch (error) {
      logger.error(
        "Erro ao obter conteúdo educativo sobre fibromialgia:",
        error
      );
      return [];
    }
  }

  /**
   * Limpa o histórico de conversa de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  static async clearConversationHistory(userId) {
    try {
      await SupabaseClient.delete("messages", { user_id: userId });

      logger.info(
        `Histórico de conversas do usuário ${userId} limpo com sucesso`
      );
      return true;
    } catch (error) {
      logger.error(
        `Erro ao limpar histórico de conversas do usuário ${userId}:`,
        error
      );
      return false;
    }
  }
}

module.exports = ContextManager;
