/**
 * =========================================
 * MEMORY MANAGER
 * =========================================
 *
 * Gerencia memória individual e global
 * - Memória individual: por usuário (nome, preferências, histórico, padrões)
 * - Memória global: padrões agregados, aprendizado coletivo
 */

const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

class MemoryManager {
  constructor() {
    this.cache = new Map(); // Cache em memória para performance
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtém memória individual do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Memória do usuário
   */
  async getUserMemory(userId) {
    try {
      // Verificar cache
      const cached = this._getFromCache(`user_memory_${userId}`);
      if (cached) {
        return cached;
      }

      // Buscar do banco (userId pode ser phone ou id UUID)
      // Tentar primeiro como phone (mais comum)
      let { data: user, error } = await supabase
        .from("users_livia")
        .select("*")
        .eq("phone", userId)
        .single();

      // Se não encontrou como phone, tentar como id UUID
      if (error && error.code === "PGRST116") {
        const { data: userById, error: errorById } = await supabase
          .from("users_livia")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (!errorById && userById) {
          user = userById;
          error = null;
        }
      }

      if (error && error.code !== "PGRST116") {
        logger.error("Erro ao buscar usuário:", error);
        return {};
      }

      if (!user) {
        return {};
      }

      // Obter ID UUID do usuário (se userId for phone, usar user.id)
      const userUuid = user.id;

      // Buscar padrões do usuário
      const { data: patterns } = await supabase
        .from("user_patterns")
        .select("*")
        .eq("user_id", userUuid)
        .eq("is_active", true)
        .order("confidence", { ascending: false })
        .limit(5);

      // Buscar resumo do histórico (últimas 30 mensagens) - usar phone ou user_id
      const { data: recentMessages } = await supabase
        .from("conversations_livia")
        .select("content, message_type, sent_at")
        .or(`user_id.eq.${userUuid},phone.eq.${user.phone}`)
        .order("sent_at", { ascending: false })
        .limit(30);

      // Gerar resumo do histórico
      const summary = this._generateHistorySummary(recentMessages || []);

      // Construir memória expandida
      const memory = {
        name: user.name || user.nickname || null,
        phone: user.phone,
        preferences: user.preferences || {},
        patterns: (patterns || []).map((p) => ({
          type: p.pattern_type,
          description: p.pattern_description,
          confidence: p.confidence,
        })),
        summary,
        lastInteraction: user.last_interaction || user.ultimo_contato,
        engagementLevel: user.nivel_engajamento || 0,
        // Novos campos expandidos
        dailyRoutine: user.daily_routine || {},
        behavioralProfile: user.behavioral_profile || {},
        habits: user.habits || {},
        recurringSymptoms: user.recurring_symptoms || [],
        perceivedTriggers: user.perceived_triggers || [],
        strategiesThatWorked: user.strategies_that_worked || [],
        strategiesThatFailed: user.strategies_that_failed || [],
        // Informações de saúde
        mainSymptoms: user.main_symptoms || [],
        triggers: user.triggers || [],
        medications: user.medications || [],
        severityLevel: user.severity_level,
      };

      // Salvar no cache
      this._saveToCache(`user_memory_${userId}`, memory);

      return memory;
    } catch (error) {
      logger.error("Erro ao obter memória do usuário:", error);
      return {};
    }
  }

  /**
   * Obtém contexto da conversa
   * @param {string} userId - ID do usuário
   * @param {number} limit - Número de mensagens
   * @returns {Promise<Array>} Contexto da conversa
   */
  async getConversationContext(userId, limit = 10) {
    try {
      // Buscar usuário para obter ID UUID (se userId for phone)
      let userUuid = userId;
      let userPhone = userId;
      
      const { data: user } = await supabase
        .from("users_livia")
        .select("id, phone")
        .or(`id.eq.${userId},phone.eq.${userId}`)
        .single();
      
      if (user) {
        userUuid = user.id;
        userPhone = user.phone;
      }

      const { data: messages, error } = await supabase
        .from("conversations_livia")
        .select("content, message_type, sent_at")
        .or(`user_id.eq.${userUuid},phone.eq.${userPhone}`)
        .order("sent_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Erro ao buscar contexto:", error);
        return [];
      }

      // Converter para formato de contexto
      return (messages || []).reverse().map((msg) => ({
        role: msg.message_type === "user" ? "user" : "assistant",
        content: msg.content,
        timestamp: msg.sent_at,
      }));
    } catch (error) {
      logger.error("Erro ao obter contexto:", error);
      return [];
    }
  }

  /**
   * Salva contexto da conversa
   * @param {string} userId - ID do usuário
   * @param {Array} context - Contexto da conversa
   */
  async saveConversationContext(userId, context) {
    try {
      // O contexto já está sendo salvo mensagem por mensagem
      // Este método pode ser usado para operações adicionais se necessário
      logger.debug(
        `Contexto salvo para ${userId}: ${context.length} mensagens`
      );
    } catch (error) {
      logger.error("Erro ao salvar contexto:", error);
    }
  }

  /**
   * Obtém memória global (insights coletivos)
   * @param {number} limit - Número de insights
   * @returns {Promise<Array>} Insights coletivos
   */
  async getGlobalMemory(limit = 5) {
    try {
      // Verificar cache
      const cached = this._getFromCache("global_memory");
      if (cached) {
        return cached;
      }

      // Buscar insights coletivos ativos
      const { data: insights, error } = await supabase
        .from("collective_insights")
        .select("*")
        .eq("is_active", true)
        .order("evidence_strength", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Erro ao buscar insights coletivos:", error);
        return [];
      }

      // Buscar padrões globais agregados
      const { data: globalPatterns } = await supabase
        .from("global_patterns")
        .select("*")
        .eq("is_active", true)
        .order("relevance", { ascending: false })
        .limit(5);

      const globalMemory = {
        insights: insights || [],
        patterns: globalPatterns || [],
        timestamp: new Date().toISOString(),
      };

      // Salvar no cache
      this._saveToCache("global_memory", globalMemory);

      return globalMemory;
    } catch (error) {
      logger.error("Erro ao obter memória global:", error);
      return { insights: [], patterns: [] };
    }
  }

  /**
   * Atualiza memória do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} updates - Atualizações
   */
  async updateUserMemory(userId, updates) {
    try {
      // Invalidar cache
      this._invalidateCache(`user_memory_${userId}`);

      // Atualizar no banco
      const { error } = await supabase
        .from("users_livia")
        .update(updates)
        .eq("id", userId);

      if (error) {
        logger.error("Erro ao atualizar memória:", error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Erro ao atualizar memória:", error);
      return false;
    }
  }

  /**
   * Salva padrão detectado para o usuário
   * @param {string} userId - ID do usuário
   * @param {Object} pattern - Padrão detectado
   */
  async saveUserPattern(userId, pattern) {
    try {
      const { error } = await supabase.from("user_patterns").insert({
        user_id: userId,
        pattern_type: pattern.type,
        pattern_name: pattern.name,
        pattern_description: pattern.description,
        confidence: pattern.confidence,
        pattern_data: pattern.data || {},
        is_active: true,
        detected_at: new Date().toISOString(),
      });

      if (error) {
        logger.error("Erro ao salvar padrão:", error);
        return false;
      }

      // Invalidar cache
      this._invalidateCache(`user_memory_${userId}`);

      return true;
    } catch (error) {
      logger.error("Erro ao salvar padrão:", error);
      return false;
    }
  }

  /**
   * Gera resumo do histórico de mensagens
   */
  _generateHistorySummary(messages) {
    if (!messages || messages.length === 0) {
      return "Sem histórico de conversas ainda.";
    }

    // Contar tipos de mensagens
    const userMessages = messages.filter((m) => m.message_type === "user");
    const assistantMessages = messages.filter(
      (m) => m.message_type === "assistant"
    );

    // Extrair temas principais (simplificado)
    const themes = this._extractThemes(messages);

    return `Histórico: ${userMessages.length} mensagens do usuário, ${
      assistantMessages.length
    } respostas. Temas principais: ${themes.join(", ")}.`;
  }

  /**
   * Extrai temas principais das mensagens
   */
  _extractThemes(messages) {
    const themes = new Set();
    const keywords = {
      dor: ["dor", "doendo", "machuca", "latejando"],
      fadiga: ["cansado", "fadiga", "exausto", "sem energia"],
      sono: ["sono", "insônia", "dormir", "descanso"],
      humor: ["triste", "ansioso", "feliz", "irritado"],
    };

    messages.forEach((msg) => {
      const content = (msg.content || "").toLowerCase();
      Object.keys(keywords).forEach((theme) => {
        if (keywords[theme].some((kw) => content.includes(kw))) {
          themes.add(theme);
        }
      });
    });

    return Array.from(themes).slice(0, 3);
  }

  /**
   * Cache helpers
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  _saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  _invalidateCache(key) {
    this.cache.delete(key);
  }
}

module.exports = MemoryManager;
