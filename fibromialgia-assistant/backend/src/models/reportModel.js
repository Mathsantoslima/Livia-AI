const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Registra um novo relatório
 * @param {Object} reportData - Dados do relatório
 * @returns {Promise<Object>} Relatório registrado
 */
async function recordReport(reportData) {
  try {
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          type: reportData.type,
          format: reportData.format,
          content: reportData.content,
          metadata: reportData.metadata,
          status: reportData.status || "pending",
          user_id: reportData.user_id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao registrar relatório:", error);
    throw error;
  }
}

/**
 * Obtém relatórios do sistema
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de relatórios
 */
async function getReports(filters = {}) {
  try {
    let query = supabase.from("reports").select("*");

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
    if (filters.format) {
      query = query.eq("format", filters.format);
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
    logger.error("Erro ao obter relatórios:", error);
    throw error;
  }
}

/**
 * Atualiza o status de um relatório
 * @param {string} reportId - ID do relatório
 * @param {string} status - Novo status
 * @returns {Promise<Object>} Relatório atualizado
 */
async function updateReportStatus(reportId, status) {
  try {
    const { data, error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao atualizar status do relatório:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de relatórios
 * @param {Object} filters - Filtros para as estatísticas
 * @returns {Promise<Object>} Estatísticas de relatórios
 */
async function getReportStats(filters = {}) {
  try {
    const stats = {
      total: 0,
      byType: {},
      byFormat: {},
      byStatus: {},
      byDay: {},
    };

    // Obter relatórios
    const { data, error } = await supabase.from("reports").select("*");

    if (error) throw error;

    if (data.length === 0) return stats;

    stats.total = data.length;

    // Distribuição por tipo
    data.forEach((item) => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    });

    // Distribuição por formato
    data.forEach((item) => {
      stats.byFormat[item.format] = (stats.byFormat[item.format] || 0) + 1;
    });

    // Distribuição por status
    data.forEach((item) => {
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    });

    // Distribuição por dia
    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      if (!stats.byDay[date]) {
        stats.byDay[date] = {
          count: 0,
          byType: {},
          byFormat: {},
        };
      }
      stats.byDay[date].count++;
      stats.byDay[date].byType[item.type] =
        (stats.byDay[date].byType[item.type] || 0) + 1;
      stats.byDay[date].byFormat[item.format] =
        (stats.byDay[date].byFormat[item.format] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error("Erro ao obter estatísticas de relatórios:", error);
    throw error;
  }
}

/**
 * Limpa relatórios antigos
 * @param {number} days - Número de dias para manter
 * @returns {Promise<number>} Número de relatórios removidos
 */
async function cleanOldReports(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from("reports")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select();

    if (error) throw error;
    return data.length;
  } catch (error) {
    logger.error("Erro ao limpar relatórios antigos:", error);
    throw error;
  }
}

/**
 * Gera um novo relatório
 * @param {Object} reportConfig - Configurações do relatório
 * @returns {Promise<Object>} Relatório gerado
 */
async function generateReport(reportConfig) {
  try {
    // Criar registro do relatório
    const report = await recordReport({
      type: reportConfig.type,
      format: reportConfig.format,
      status: "generating",
      user_id: reportConfig.userId,
      metadata: reportConfig.metadata,
    });

    // TODO: Implementar lógica de geração específica para cada tipo de relatório

    // Atualizar status do relatório
    await updateReportStatus(report.id, "completed");

    return {
      success: true,
      message: "Relatório gerado com sucesso",
      report,
    };
  } catch (error) {
    logger.error("Erro ao gerar relatório:", error);
    throw error;
  }
}

module.exports = {
  recordReport,
  getReports,
  updateReportStatus,
  getReportStats,
  cleanOldReports,
  generateReport,
};
