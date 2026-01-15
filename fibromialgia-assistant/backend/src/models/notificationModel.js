const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Registra uma nova notificação
 * @param {Object} notificationData - Dados da notificação
 * @returns {Promise<Object>} Notificação registrada
 */
async function recordNotification(notificationData) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: notificationData.user_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority,
          status: notificationData.status || "pending",
          scheduled_for: notificationData.scheduled_for,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao registrar notificação:", error);
    throw error;
  }
}

/**
 * Obtém notificações de um usuário
 * @param {string} userId - ID do usuário
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de notificações
 */
async function getUserNotifications(userId, filters = {}) {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId);

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
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
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
    logger.error("Erro ao obter notificações do usuário:", error);
    throw error;
  }
}

/**
 * Atualiza o status de uma notificação
 * @param {string} notificationId - ID da notificação
 * @param {string} status - Novo status
 * @returns {Promise<Object>} Notificação atualizada
 */
async function updateNotificationStatus(notificationId, status) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ status })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao atualizar status da notificação:", error);
    throw error;
  }
}

/**
 * Obtém notificações pendentes
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de notificações pendentes
 */
async function getPendingNotifications(filters = {}) {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString());

    // Aplicar filtros adicionais
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }

    // Ordenação por prioridade e data
    query = query
      .order("priority", { ascending: false })
      .order("scheduled_for", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao obter notificações pendentes:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de notificações
 * @param {string} userId - ID do usuário
 * @param {Object} filters - Filtros para as estatísticas
 * @returns {Promise<Object>} Estatísticas de notificações
 */
async function getNotificationStats(userId, filters = {}) {
  try {
    const stats = {
      total: 0,
      byType: {},
      byStatus: {},
      byPriority: {},
      byDay: {},
    };

    // Obter notificações
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    if (data.length === 0) return stats;

    stats.total = data.length;

    // Distribuição por tipo
    data.forEach((item) => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    });

    // Distribuição por status
    data.forEach((item) => {
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    });

    // Distribuição por prioridade
    data.forEach((item) => {
      stats.byPriority[item.priority] =
        (stats.byPriority[item.priority] || 0) + 1;
    });

    // Distribuição por dia
    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      if (!stats.byDay[date]) {
        stats.byDay[date] = {
          count: 0,
          byType: {},
          byStatus: {},
        };
      }
      stats.byDay[date].count++;
      stats.byDay[date].byType[item.type] =
        (stats.byDay[date].byType[item.type] || 0) + 1;
      stats.byDay[date].byStatus[item.status] =
        (stats.byDay[date].byStatus[item.status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error("Erro ao obter estatísticas de notificações:", error);
    throw error;
  }
}

module.exports = {
  recordNotification,
  getUserNotifications,
  updateNotificationStatus,
  getPendingNotifications,
  getNotificationStats,
};
