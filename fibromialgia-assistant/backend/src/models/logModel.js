const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Registra um novo log
 * @param {Object} logData - Dados do log
 * @returns {Promise<Object>} Log registrado
 */
async function recordLog(logData) {
  try {
    const { data, error } = await supabase
      .from("logs")
      .insert([
        {
          level: logData.level,
          message: logData.message,
          context: logData.context,
          user_id: logData.user_id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao registrar log:", error);
    throw error;
  }
}

/**
 * Obtém logs do sistema
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de logs
 */
async function getLogs(filters = {}) {
  try {
    let query = supabase.from("logs").select("*");

    // Aplicar filtros adicionais
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters.level) {
      query = query.eq("level", filters.level);
    }
    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters.search) {
      query = query.ilike("message", `%${filters.search}%`);
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
    logger.error("Erro ao obter logs:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de logs
 * @param {Object} filters - Filtros para as estatísticas
 * @returns {Promise<Object>} Estatísticas de logs
 */
async function getLogStats(filters = {}) {
  try {
    const stats = {
      total: 0,
      byLevel: {},
      byUser: {},
      byDay: {},
      byHour: {},
    };

    // Obter logs
    const { data, error } = await supabase.from("logs").select("*");

    if (error) throw error;

    if (data.length === 0) return stats;

    stats.total = data.length;

    // Distribuição por nível
    data.forEach((item) => {
      stats.byLevel[item.level] = (stats.byLevel[item.level] || 0) + 1;
    });

    // Distribuição por usuário
    data.forEach((item) => {
      if (item.user_id) {
        stats.byUser[item.user_id] = (stats.byUser[item.user_id] || 0) + 1;
      }
    });

    // Distribuição por dia
    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      if (!stats.byDay[date]) {
        stats.byDay[date] = {
          count: 0,
          byLevel: {},
        };
      }
      stats.byDay[date].count++;
      stats.byDay[date].byLevel[item.level] =
        (stats.byDay[date].byLevel[item.level] || 0) + 1;
    });

    // Distribuição por hora
    data.forEach((item) => {
      const hour = new Date(item.created_at).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error("Erro ao obter estatísticas de logs:", error);
    throw error;
  }
}

/**
 * Limpa logs antigos
 * @param {number} days - Número de dias para manter
 * @returns {Promise<number>} Número de logs removidos
 */
async function cleanOldLogs(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from("logs")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select();

    if (error) throw error;
    return data.length;
  } catch (error) {
    logger.error("Erro ao limpar logs antigos:", error);
    throw error;
  }
}

/**
 * Exporta logs para arquivo
 * @param {Object} filters - Filtros para exportação
 * @returns {Promise<string>} URL do arquivo exportado
 */
async function exportLogs(filters = {}) {
  try {
    const logs = await getLogs(filters);

    // Formatar logs para exportação
    const formattedLogs = logs.map((log) => ({
      timestamp: log.created_at,
      level: log.level,
      message: log.message,
      context: log.context,
      user_id: log.user_id,
    }));

    // Criar arquivo de exportação
    const { data, error } = await supabase.storage
      .from("exports")
      .upload(
        `logs_${new Date().toISOString()}.json`,
        JSON.stringify(formattedLogs, null, 2),
        {
          contentType: "application/json",
          upsert: true,
        }
      );

    if (error) throw error;

    // Gerar URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("exports").getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    logger.error("Erro ao exportar logs:", error);
    throw error;
  }
}

module.exports = {
  recordLog,
  getLogs,
  getLogStats,
  cleanOldLogs,
  exportLogs,
};
