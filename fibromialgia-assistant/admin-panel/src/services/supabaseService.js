import { supabase } from "../config/supabaseClient";

class SupabaseService {
  // ================================
  // OPERAÇÕES DE USUÁRIOS
  // ================================

  async getAllUsers(filters = {}) {
    let query = supabase.from("users_livia").select("*");

    if (filters.name) {
      query = query.ilike("name", `%${filters.name}%`);
    }

    if (filters.phone) {
      query = query.ilike("phone", `%${filters.phone}%`);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.dateFrom) {
      query = query.gte("primeiro_contato", filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte("primeiro_contato", filters.dateTo);
    }

    const { data, error } = await query.order("ultimo_contato", {
      ascending: false,
    });

    if (error) throw error;
    return data;
  }

  async getUserById(userId) {
    const { data, error } = await supabase
      .from("users_livia")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserStatus(userId, status) {
    const { data, error } = await supabase
      .from("users_livia")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ================================
  // OPERAÇÕES DE MENSAGENS
  // ================================

  async getUserMessages(userId, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from("conversations_livia")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async getMessagesByDateRange(startDate, endDate) {
    const { data, error } = await supabase
      .from("conversations_livia")
      .select("*")
      .gte("timestamp", startDate)
      .lte("timestamp", endDate)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getMessageTrends(days = 30) {
    const { data, error } = await supabase
      .from("message_trends")
      .select("*")
      .gte(
        "data",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .order("data", { ascending: false });

    if (error) throw error;
    return data;
  }

  // ================================
  // ANÁLISE DE SENTIMENTOS
  // ================================

  async getSentimentAnalysis(days = 30) {
    const { data, error } = await supabase
      .from("sentiment_analysis")
      .select("*")
      .gte(
        "data",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .order("data", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getUserSentimentHistory(userId, days = 30) {
    const { data, error } = await supabase
      .from("conversations_livia")
      .select("timestamp, classificacao_sentimento, categoria")
      .eq("user_id", userId)
      .eq("tipo", "user")
      .not("classificacao_sentimento", "is", null)
      .gte(
        "timestamp",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("timestamp", { ascending: true });

    if (error) throw error;
    return data;
  }

  // ================================
  // CHECK-INS DIÁRIOS
  // ================================

  async getUserCheckins(userId, days = 30) {
    const { data, error } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .gte(
        "data",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .order("data", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getGlobalCheckinStats(days = 30) {
    const { data, error } = await supabase
      .from("daily_checkins")
      .select("data, nivel_dor, nivel_humor, nivel_energia, qualidade_sono")
      .gte(
        "data",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .order("data", { ascending: false });

    if (error) throw error;
    return data;
  }

  // ================================
  // PADRÕES DETECTADOS
  // ================================

  async getUserPatterns(userId) {
    const { data, error } = await supabase
      .from("patterns_detected")
      .select("*")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("relevancia", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getGlobalPatterns(limit = 20) {
    const { data, error } = await supabase
      .from("patterns_detected")
      .select("tipo_padrao, descricao, count(*)")
      .eq("ativo", true)
      .gte("relevancia", 0.5)
      .order("count", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // ================================
  // ENGAJAMENTO
  // ================================

  async getUserEngagement(userId, days = 30) {
    const { data, error } = await supabase
      .from("engagement_logs")
      .select("*")
      .eq("user_id", userId)
      .gte(
        "timestamp",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getGlobalEngagementStats(days = 7) {
    const { data, error } = await supabase
      .from("engagement_logs")
      .select("evento, timestamp, user_id")
      .gte(
        "timestamp",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data;
  }

  // ================================
  // SUGESTÕES DA LIVIA
  // ================================

  async getUserSuggestions(userId) {
    const { data, error } = await supabase
      .from("livia_suggestions")
      .select("*")
      .eq("user_id", userId)
      .order("data_sugestao", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getSuggestionStats(days = 30) {
    const { data, error } = await supabase
      .from("livia_suggestions")
      .select("tipo_sugestao, feedback, count(*)")
      .gte(
        "data_sugestao",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("count", { ascending: false });

    if (error) throw error;
    return data;
  }

  // ================================
  // SESSÕES DE CONVERSA
  // ================================

  async getUserSessions(userId) {
    const { data, error } = await supabase
      .from("conversation_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("inicio_sessao", { ascending: false });

    if (error) throw error;
    return data;
  }

  // ================================
  // DASHBOARD GLOBAL
  // ================================

  async getDashboardStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        totalMessages,
        todayMessages,
        avgResponseTime,
      ] = await Promise.all([
        this.getTotalUsers(),
        this.getActiveUsers(),
        this.getTotalMessages(),
        this.getTodayMessages(),
        this.getAvgResponseTime(),
      ]);

      return {
        totalUsers,
        activeUsers,
        totalMessages,
        todayMessages,
        avgResponseTime,
      };
    } catch (error) {
      console.error("Erro ao buscar estatísticas do dashboard:", error);
      throw error;
    }
  }

  async getTotalUsers() {
    const { count, error } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count;
  }

  async getActiveUsers(days = 7) {
    const { count, error } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true })
      .gte(
        "ultimo_contato",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;
    return count;
  }

  async getTotalMessages() {
    const { count, error } = await supabase
      .from("conversations_livia")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count;
  }

  async getTodayMessages() {
    const today = new Date().toISOString().split("T")[0];
    const { count, error } = await supabase
      .from("conversations_livia")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", today);

    if (error) throw error;
    return count;
  }

  async getAvgResponseTime() {
    // Implementar lógica para calcular tempo médio de resposta
    return "2.3min"; // Placeholder
  }

  // ================================
  // HORÁRIOS DE PICO (HEATMAP)
  // ================================

  async getHeatmapData(days = 30) {
    const { data, error } = await supabase
      .from("conversations_livia")
      .select("timestamp")
      .eq("tipo", "user")
      .gte(
        "timestamp",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    // Processar dados para heatmap (hora do dia vs dia da semana)
    const heatmapData = Array(7)
      .fill()
      .map(() => Array(24).fill(0));

    data.forEach((message) => {
      const date = new Date(message.timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      heatmapData[day][hour]++;
    });

    return heatmapData;
  }

  // ================================
  // BUSCA E FILTROS AVANÇADOS
  // ================================

  async searchMessages(query, filters = {}) {
    let dbQuery = supabase
      .from("conversations_livia")
      .select("*, users(name, phone)")
      .ilike("mensagem", `%${query}%`);

    if (filters.userId) {
      dbQuery = dbQuery.eq("user_id", filters.userId);
    }

    if (filters.tipo) {
      dbQuery = dbQuery.eq("tipo", filters.tipo);
    }

    if (filters.categoria) {
      dbQuery = dbQuery.eq("categoria", filters.categoria);
    }

    if (filters.sentimento) {
      dbQuery = dbQuery.eq("classificacao_sentimento", filters.sentimento);
    }

    const { data, error } = await dbQuery
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  }
}

export default new SupabaseService();
