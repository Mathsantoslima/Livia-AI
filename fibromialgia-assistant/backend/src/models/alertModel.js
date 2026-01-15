const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Registra um novo alerta
 * @param {Object} alertData - Dados do alerta
 * @returns {Promise<Object>} Alerta registrado
 */
async function recordAlert(alertData) {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .insert([
        {
          type: alertData.type,
          severity: alertData.severity,
          message: alertData.message,
          context: alertData.context,
          status: alertData.status || "active",
          user_id: alertData.user_id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao registrar alerta:", error);
    throw error;
  }
}

/**
 * Obtém alertas do sistema
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de alertas
 */
async function getAlerts(filters = {}) {
  try {
    let query = supabase.from("alerts").select("*");

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
    if (filters.severity) {
      query = query.eq("severity", filters.severity);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
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
    logger.error("Erro ao obter alertas:", error);
    throw error;
  }
}

/**
 * Atualiza o status de um alerta
 * @param {string} alertId - ID do alerta
 * @param {string} status - Novo status
 * @returns {Promise<Object>} Alerta atualizado
 */
async function updateAlertStatus(alertId, status) {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .update({ status })
      .eq("id", alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao atualizar status do alerta:", error);
    throw error;
  }
}

/**
 * Obtém alertas ativos
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de alertas ativos
 */
async function getActiveAlerts(filters = {}) {
  try {
    let query = supabase.from("alerts").select("*").eq("status", "active");

    // Aplicar filtros adicionais
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.severity) {
      query = query.eq("severity", filters.severity);
    }
    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }

    // Ordenação por severidade e data
    query = query
      .order("severity", { ascending: false })
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao obter alertas ativos:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de alertas
 * @param {Object} filters - Filtros para as estatísticas
 * @returns {Promise<Object>} Estatísticas de alertas
 */
async function getAlertStats(filters = {}) {
  try {
    const stats = {
      total: 0,
      active: 0,
      byType: {},
      bySeverity: {},
      byStatus: {},
      byDay: {},
    };

    // Obter alertas
    const { data, error } = await supabase.from("alerts").select("*");

    if (error) throw error;

    if (data.length === 0) return stats;

    stats.total = data.length;

    // Distribuição por tipo
    data.forEach((item) => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    });

    // Distribuição por severidade
    data.forEach((item) => {
      stats.bySeverity[item.severity] =
        (stats.bySeverity[item.severity] || 0) + 1;
    });

    // Distribuição por status
    data.forEach((item) => {
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      if (item.status === "active") {
        stats.active++;
      }
    });

    // Distribuição por dia
    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      if (!stats.byDay[date]) {
        stats.byDay[date] = {
          count: 0,
          byType: {},
          bySeverity: {},
        };
      }
      stats.byDay[date].count++;
      stats.byDay[date].byType[item.type] =
        (stats.byDay[date].byType[item.type] || 0) + 1;
      stats.byDay[date].bySeverity[item.severity] =
        (stats.byDay[date].bySeverity[item.severity] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error("Erro ao obter estatísticas de alertas:", error);
    throw error;
  }
}

/**
 * Limpa alertas antigos
 * @param {number} days - Número de dias para manter
 * @returns {Promise<number>} Número de alertas removidos
 */
async function cleanOldAlerts(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from("alerts")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select();

    if (error) throw error;
    return data.length;
  } catch (error) {
    logger.error("Erro ao limpar alertas antigos:", error);
    throw error;
  }
}

module.exports = {
  recordAlert,
  getAlerts,
  updateAlertStatus,
  getActiveAlerts,
  getAlertStats,
  cleanOldAlerts,
};
