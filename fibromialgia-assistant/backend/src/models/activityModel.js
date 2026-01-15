const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Registra uma nova atividade
 * @param {Object} activityData - Dados da atividade
 * @returns {Promise<Object>} Atividade registrada
 */
async function recordActivity(activityData) {
  try {
    const { data, error } = await supabase
      .from("activities")
      .insert([
        {
          user_id: activityData.user_id,
          name: activityData.name,
          type: activityData.type,
          duration: activityData.duration,
          intensity: activityData.intensity,
          impact: activityData.impact,
          notes: activityData.notes,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao registrar atividade:", error);
    throw error;
  }
}

/**
 * Obtém atividades de um usuário
 * @param {string} userId - ID do usuário
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de atividades
 */
async function getUserActivities(userId, filters = {}) {
  try {
    let query = supabase.from("activities").select("*").eq("user_id", userId);

    // Aplicar filtros adicionais
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.minIntensity) {
      query = query.gte("intensity", filters.minIntensity);
    }
    if (filters.maxIntensity) {
      query = query.lte("intensity", filters.maxIntensity);
    }

    // Ordenação
    query = query.order("created_at", { ascending: false });

    // Paginação
    if (filters.page && filters.limit) {
      const start = (filters.page - 1) * filters.limit;
      query = query.range(start, start + filters.limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao obter atividades do usuário:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de atividades
 * @param {string} userId - ID do usuário
 * @param {Object} filters - Filtros para as estatísticas
 * @returns {Promise<Object>} Estatísticas de atividades
 */
async function getActivityStats(userId, filters = {}) {
  try {
    const stats = {
      total: 0,
      byType: {},
      byIntensity: {},
      byImpact: {},
      averageDuration: 0,
      byDay: {},
    };

    // Obter atividades
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    if (data.length === 0) return stats;

    stats.total = data.length;

    // Distribuição por tipo
    data.forEach((item) => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    });

    // Distribuição por intensidade
    data.forEach((item) => {
      stats.byIntensity[item.intensity] =
        (stats.byIntensity[item.intensity] || 0) + 1;
    });

    // Distribuição por impacto
    data.forEach((item) => {
      stats.byImpact[item.impact] = (stats.byImpact[item.impact] || 0) + 1;
    });

    // Duração média
    const totalDuration = data.reduce((sum, item) => sum + item.duration, 0);
    stats.averageDuration = totalDuration / data.length;

    // Distribuição por dia
    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      if (!stats.byDay[date]) {
        stats.byDay[date] = {
          count: 0,
          totalDuration: 0,
          types: {},
        };
      }
      stats.byDay[date].count++;
      stats.byDay[date].totalDuration += item.duration;
      stats.byDay[date].types[item.type] =
        (stats.byDay[date].types[item.type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error("Erro ao obter estatísticas de atividades:", error);
    throw error;
  }
}

/**
 * Obtém atividades recomendadas
 * @param {string} userId - ID do usuário
 * @param {Object} userState - Estado atual do usuário
 * @returns {Promise<Array>} Lista de atividades recomendadas
 */
async function getRecommendedActivities(userId, userState) {
  try {
    // Obter histórico de atividades do usuário
    const { data: userActivities, error: userError } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (userError) throw userError;

    // Obter todas as atividades disponíveis
    const { data: allActivities, error: allError } = await supabase
      .from("activities")
      .select("*")
      .limit(100);

    if (allError) throw allError;

    // Filtrar atividades com base no estado do usuário
    const recommended = allActivities.filter((activity) => {
      // Verificar intensidade adequada
      if (userState.pain_level > 7 && activity.intensity > 3) return false;
      if (userState.fatigue_level > 7 && activity.duration > 30) return false;

      // Verificar impacto positivo
      if (activity.impact === "negative") return false;

      // Verificar se o usuário já realizou a atividade recentemente
      const recentActivity = userActivities.find(
        (a) => a.name === activity.name
      );
      if (recentActivity) return false;

      return true;
    });

    // Ordenar por relevância
    recommended.sort((a, b) => {
      // Priorizar atividades com impacto positivo
      if (a.impact === "positive" && b.impact !== "positive") return -1;
      if (b.impact === "positive" && a.impact !== "positive") return 1;

      // Priorizar atividades com intensidade adequada
      const aIntensityScore = Math.abs(
        a.intensity - (10 - userState.pain_level)
      );
      const bIntensityScore = Math.abs(
        b.intensity - (10 - userState.pain_level)
      );
      return aIntensityScore - bIntensityScore;
    });

    return recommended.slice(0, 5);
  } catch (error) {
    logger.error("Erro ao obter atividades recomendadas:", error);
    throw error;
  }
}

module.exports = {
  recordActivity,
  getUserActivities,
  getActivityStats,
  getRecommendedActivities,
};
