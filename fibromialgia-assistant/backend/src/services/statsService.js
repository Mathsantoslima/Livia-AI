const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Obtém estatísticas gerais do sistema
 * @returns {Promise<Object>} Estatísticas gerais
 */
async function getGeneralStats() {
  try {
    // Total de usuários
    const { count: totalUsers } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true });

    // Usuários ativos (últimos 7 dias)
    const { count: activeUsers } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true })
      .gte(
        "last_interaction",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    // Total de interações
    const { count: totalInteractions } = await supabase
      .from("interactions")
      .select("*", { count: "exact", head: true });

    // Precisão média das previsões
    const { data: predictions } = await supabase
      .from("predictions")
      .select("accuracy")
      .not("accuracy", "is", null);

    const avgAccuracy =
      predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.accuracy, 0) /
          predictions.length
        : 0;

    // Receita total
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("amount")
      .eq("status", "active");

    const totalRevenue = subscriptions.reduce(
      (sum, s) => sum + (s.amount || 0),
      0
    );

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        retentionRate:
          totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0,
      },
      interactions: {
        total: totalInteractions,
        averagePerUser:
          totalUsers > 0 ? (totalInteractions / totalUsers).toFixed(2) : 0,
      },
      predictions: {
        accuracy: (avgAccuracy * 100).toFixed(2),
      },
      revenue: {
        total: totalRevenue,
        monthly: totalRevenue / 12, // Simplificado - idealmente calcular com base em dados reais
      },
    };
  } catch (error) {
    logger.error("Erro ao obter estatísticas gerais:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de uso do sistema
 * @param {string} period - Período (day, week, month)
 * @returns {Promise<Object>} Estatísticas de uso
 */
async function getUsageStats(period) {
  try {
    const startDate = new Date();
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default: // day
        startDate.setDate(startDate.getDate() - 1);
    }

    // Interações por período
    const { data: interactions } = await supabase
      .from("interactions")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    // Usuários ativos por período
    const { data: activeUsers } = await supabase
      .from("users_livia")
      .select("last_interaction")
      .gte("last_interaction", startDate.toISOString());

    // Previsões geradas por período
    const { data: predictions } = await supabase
      .from("predictions")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    return {
      interactions: interactions.length,
      activeUsers: activeUsers.length,
      predictions: predictions.length,
      period,
    };
  } catch (error) {
    logger.error("Erro ao obter estatísticas de uso:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de sintomas
 * @returns {Promise<Object>} Estatísticas de sintomas
 */
async function getSymptomStats() {
  try {
    // Médias dos últimos 30 dias
    const { data: symptoms } = await supabase
      .from("symptoms")
      .select("*")
      .gte(
        "date",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    const averages = {
      pain: 0,
      fatigue: 0,
      sleep: 0,
      mood: 0,
    };

    if (symptoms.length > 0) {
      averages.pain =
        symptoms.reduce((sum, s) => sum + s.pain_level, 0) / symptoms.length;
      averages.fatigue =
        symptoms.reduce((sum, s) => sum + s.fatigue_level, 0) / symptoms.length;
      averages.sleep =
        symptoms.reduce((sum, s) => sum + s.sleep_quality, 0) / symptoms.length;
      averages.mood =
        symptoms.reduce((sum, s) => sum + s.mood_level, 0) / symptoms.length;
    }

    // Distribuição de atividades
    const activities = {};
    symptoms.forEach((s) => {
      if (s.activities) {
        s.activities.forEach((activity) => {
          activities[activity] = (activities[activity] || 0) + 1;
        });
      }
    });

    // Distribuição de clima
    const weather = {};
    symptoms.forEach((s) => {
      if (s.weather) {
        weather[s.weather] = (weather[s.weather] || 0) + 1;
      }
    });

    return {
      averages,
      activities: Object.entries(activities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      weather: Object.entries(weather)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      totalRecords: symptoms.length,
    };
  } catch (error) {
    logger.error("Erro ao obter estatísticas de sintomas:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de previsões
 * @returns {Promise<Object>} Estatísticas de previsões
 */
async function getPredictionStats() {
  try {
    // Previsões dos últimos 30 dias
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    // Média de acurácia
    const avgAccuracy =
      predictions.length > 0
        ? predictions.reduce((sum, p) => sum + (p.accuracy || 0), 0) /
          predictions.length
        : 0;

    // Distribuição de recomendações
    const recommendations = {};
    predictions.forEach((p) => {
      if (p.recommendations) {
        p.recommendations.forEach((rec) => {
          recommendations[rec] = (recommendations[rec] || 0) + 1;
        });
      }
    });

    // Distribuição de fatores
    const factors = {};
    predictions.forEach((p) => {
      if (p.factors) {
        p.factors.forEach((factor) => {
          factors[factor] = (factors[factor] || 0) + 1;
        });
      }
    });

    return {
      total: predictions.length,
      accuracy: (avgAccuracy * 100).toFixed(2),
      recommendations: Object.entries(recommendations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      factors: Object.entries(factors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    };
  } catch (error) {
    logger.error("Erro ao obter estatísticas de previsões:", error);
    throw error;
  }
}

/**
 * Gera relatório de estatísticas
 * @param {Object} options - Opções do relatório
 * @param {string} options.type - Tipo de relatório
 * @param {string} options.format - Formato do relatório (pdf, excel)
 * @param {Object} options.filters - Filtros do relatório
 * @returns {Promise<Object>} URL do relatório gerado
 */
async function generateReport({ type, format, filters }) {
  try {
    let data;
    switch (type) {
      case "general":
        data = await getGeneralStats();
        break;
      case "usage":
        data = await getUsageStats(filters.period);
        break;
      case "symptoms":
        data = await getSymptomStats();
        break;
      case "predictions":
        data = await getPredictionStats();
        break;
      default:
        throw new Error("Tipo de relatório inválido");
    }

    // Aqui você implementaria a geração do relatório no formato especificado
    // e o upload para o Supabase Storage
    // Por enquanto, retornamos os dados diretamente
    return {
      url: `https://api.example.com/reports/${type}-${Date.now()}.${format}`,
      data,
    };
  } catch (error) {
    logger.error("Erro ao gerar relatório:", error);
    throw error;
  }
}

module.exports = {
  getGeneralStats,
  getUsageStats,
  getSymptomStats,
  getPredictionStats,
  generateReport,
};
