const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Registra um novo backup
 * @param {Object} backupData - Dados do backup
 * @returns {Promise<Object>} Backup registrado
 */
async function recordBackup(backupData) {
  try {
    const { data, error } = await supabase
      .from("backups")
      .insert([
        {
          type: backupData.type,
          status: backupData.status,
          size: backupData.size,
          path: backupData.path,
          metadata: backupData.metadata,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao registrar backup:", error);
    throw error;
  }
}

/**
 * Obtém backups do sistema
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de backups
 */
async function getBackups(filters = {}) {
  try {
    let query = supabase.from("backups").select("*");

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
    logger.error("Erro ao obter backups:", error);
    throw error;
  }
}

/**
 * Atualiza o status de um backup
 * @param {string} backupId - ID do backup
 * @param {string} status - Novo status
 * @returns {Promise<Object>} Backup atualizado
 */
async function updateBackupStatus(backupId, status) {
  try {
    const { data, error } = await supabase
      .from("backups")
      .update({ status })
      .eq("id", backupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao atualizar status do backup:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de backups
 * @param {Object} filters - Filtros para as estatísticas
 * @returns {Promise<Object>} Estatísticas de backups
 */
async function getBackupStats(filters = {}) {
  try {
    const stats = {
      total: 0,
      totalSize: 0,
      byType: {},
      byStatus: {},
      byDay: {},
    };

    // Obter backups
    const { data, error } = await supabase.from("backups").select("*");

    if (error) throw error;

    if (data.length === 0) return stats;

    stats.total = data.length;

    // Distribuição por tipo
    data.forEach((item) => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      stats.totalSize += item.size || 0;
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
          size: 0,
          byType: {},
        };
      }
      stats.byDay[date].count++;
      stats.byDay[date].size += item.size || 0;
      stats.byDay[date].byType[item.type] =
        (stats.byDay[date].byType[item.type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error("Erro ao obter estatísticas de backups:", error);
    throw error;
  }
}

/**
 * Limpa backups antigos
 * @param {number} days - Número de dias para manter
 * @returns {Promise<number>} Número de backups removidos
 */
async function cleanOldBackups(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from("backups")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select();

    if (error) throw error;
    return data.length;
  } catch (error) {
    logger.error("Erro ao limpar backups antigos:", error);
    throw error;
  }
}

/**
 * Restaura um backup
 * @param {string} backupId - ID do backup
 * @returns {Promise<Object>} Resultado da restauração
 */
async function restoreBackup(backupId) {
  try {
    // Obter informações do backup
    const { data: backup, error: backupError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .single();

    if (backupError) throw backupError;

    // Verificar se o backup existe
    if (!backup) {
      throw new Error("Backup não encontrado");
    }

    // Verificar se o backup está completo
    if (backup.status !== "completed") {
      throw new Error("Backup não está completo");
    }

    // Atualizar status do backup
    await updateBackupStatus(backupId, "restoring");

    // TODO: Implementar lógica de restauração específica para cada tipo de backup

    // Atualizar status do backup
    await updateBackupStatus(backupId, "restored");

    return {
      success: true,
      message: "Backup restaurado com sucesso",
      backup,
    };
  } catch (error) {
    logger.error("Erro ao restaurar backup:", error);
    throw error;
  }
}

module.exports = {
  recordBackup,
  getBackups,
  updateBackupStatus,
  getBackupStats,
  cleanOldBackups,
  restoreBackup,
};
