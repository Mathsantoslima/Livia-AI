const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * Registra um novo log no sistema
 * @param {Object} logData - Dados do log
 * @returns {Promise<void>}
 */
async function createLog(logData) {
  try {
    await supabase.from("system_logs").insert([
      {
        type: logData.type,
        level: logData.level,
        message: logData.message,
        metadata: logData.metadata,
        user_id: logData.user_id,
        admin_id: logData.admin_id,
      },
    ]);

    logger.info(`Log criado: ${logData.type} - ${logData.message}`);
  } catch (error) {
    logger.error("Erro ao criar log:", error);
    throw error;
  }
}

/**
 * Lista logs com paginação e filtros
 * @param {Object} options - Opções de paginação e filtros
 * @returns {Promise<Object>} Lista de logs e metadados
 */
async function listLogs(options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      level,
      start_date,
      end_date,
      user_id,
      admin_id,
      sort_by = "created_at",
      sort_order = "desc",
    } = options;

    // Construir query
    let query = supabase.from("system_logs").select("*", { count: "exact" });

    // Aplicar filtros
    if (type) {
      query = query.eq("type", type);
    }

    if (level) {
      query = query.eq("level", level);
    }

    if (start_date) {
      query = query.gte("created_at", start_date);
    }

    if (end_date) {
      query = query.lte("created_at", end_date);
    }

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    if (admin_id) {
      query = query.eq("admin_id", admin_id);
    }

    // Aplicar ordenação
    query = query.order(sort_by, { ascending: sort_order === "asc" });

    // Aplicar paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Executar query
    const { data: logs, error, count } = await query;

    if (error) throw error;

    return {
      logs,
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
    };
  } catch (error) {
    logger.error("Erro ao listar logs:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas dos logs
 * @param {Object} options - Opções de filtro
 * @returns {Promise<Object>} Estatísticas
 */
async function getLogStats(options = {}) {
  try {
    const { start_date, end_date } = options;

    // Construir query base
    let query = supabase.from("system_logs").select("type, level, created_at");

    // Aplicar filtros de data
    if (start_date) {
      query = query.gte("created_at", start_date);
    }

    if (end_date) {
      query = query.lte("created_at", end_date);
    }

    // Executar query
    const { data: logs, error } = await query;

    if (error) throw error;

    // Processar estatísticas
    const stats = {
      total: logs.length,
      by_type: {},
      by_level: {},
      by_hour: Array(24).fill(0),
      by_day: Array(7).fill(0),
    };

    logs.forEach((log) => {
      // Contagem por tipo
      stats.by_type[log.type] = (stats.by_type[log.type] || 0) + 1;

      // Contagem por nível
      stats.by_level[log.level] = (stats.by_level[log.level] || 0) + 1;

      // Contagem por hora
      const hour = new Date(log.created_at).getHours();
      stats.by_hour[hour]++;

      // Contagem por dia da semana
      const day = new Date(log.created_at).getDay();
      stats.by_day[day]++;
    });

    return stats;
  } catch (error) {
    logger.error("Erro ao obter estatísticas dos logs:", error);
    throw error;
  }
}

/**
 * Limpa logs antigos
 * @param {number} daysToKeep - Número de dias para manter
 * @returns {Promise<void>}
 */
async function cleanOldLogs(daysToKeep = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from("system_logs")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (error) throw error;

    logger.info(
      `Logs antigos removidos (antes de ${cutoffDate.toISOString()})`
    );
  } catch (error) {
    logger.error("Erro ao limpar logs antigos:", error);
    throw error;
  }
}

/**
 * Exporta logs para arquivo
 * @param {Object} options - Opções de exportação
 * @returns {Promise<string>} URL do arquivo exportado
 */
async function exportLogs(options = {}) {
  try {
    const { type, level, start_date, end_date, format = "csv" } = options;

    // Buscar logs
    const { data: logs, error } = await listLogs({
      type,
      level,
      start_date,
      end_date,
      limit: 1000, // Limite para exportação
    });

    if (error) throw error;

    // Preparar dados para exportação
    const exportData = logs.map((log) => ({
      id: log.id,
      type: log.type,
      level: log.level,
      message: log.message,
      metadata: JSON.stringify(log.metadata),
      user_id: log.user_id,
      admin_id: log.admin_id,
      created_at: log.created_at,
    }));

    // Gerar arquivo
    let fileContent;
    let fileExtension;

    if (format === "csv") {
      fileContent = convertToCSV(exportData);
      fileExtension = "csv";
    } else if (format === "json") {
      fileContent = JSON.stringify(exportData, null, 2);
      fileExtension = "json";
    } else {
      throw new Error("Formato de exportação não suportado");
    }

    // Upload do arquivo
    const fileName = `logs_export_${new Date().toISOString()}.${fileExtension}`;
    const { data: file, error: uploadError } = await supabase.storage
      .from("exports")
      .upload(fileName, fileContent, {
        contentType: format === "csv" ? "text/csv" : "application/json",
      });

    if (uploadError) throw uploadError;

    // Gerar URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("exports").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    logger.error("Erro ao exportar logs:", error);
    throw error;
  }
}

/**
 * Converte array de objetos para CSV
 * @param {Array} data - Dados para conversão
 * @returns {string} CSV formatado
 */
function convertToCSV(data) {
  if (!data.length) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((item) => headers.map((header) => item[header]));

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

module.exports = {
  createLog,
  listLogs,
  getLogStats,
  cleanOldLogs,
  exportLogs,
};
