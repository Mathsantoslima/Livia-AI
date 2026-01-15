const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const monitoringService = require("./monitoringService");
const notificationService = require("./notificationService");
const alertModel = require("../models/alertModel");

// Limites para alertas
const ALERT_LIMITS = {
  cpu: {
    warning: 70,
    critical: 90,
  },
  memory: {
    warning: 80,
    critical: 95,
  },
  disk: {
    warning: 80,
    critical: 95,
  },
  api: {
    error_rate: {
      warning: 5,
      critical: 10,
    },
    response_time: {
      warning: 1000,
      critical: 3000,
    },
  },
  whatsapp: {
    error_rate: {
      warning: 5,
      critical: 10,
    },
    delivery_time: {
      warning: 5000,
      critical: 15000,
    },
  },
  model: {
    error_rate: {
      warning: 5,
      critical: 10,
    },
    accuracy: {
      warning: 80,
      critical: 70,
    },
  },
};

/**
 * Verifica métricas do sistema
 * @returns {Promise<Array>} Alertas gerados
 */
async function checkSystemMetrics() {
  try {
    const metrics = await monitoringService.getSystemMetrics();
    const alerts = [];

    // Verificar CPU
    if (metrics.cpu.usage_percent >= ALERT_LIMITS.cpu.critical) {
      alerts.push({
        type: "system",
        severity: "critical",
        message: `Uso crítico de CPU: ${metrics.cpu.usage_percent.toFixed(2)}%`,
        details: metrics.cpu,
      });
    } else if (metrics.cpu.usage_percent >= ALERT_LIMITS.cpu.warning) {
      alerts.push({
        type: "system",
        severity: "warning",
        message: `Uso elevado de CPU: ${metrics.cpu.usage_percent.toFixed(2)}%`,
        details: metrics.cpu,
      });
    }

    // Verificar memória
    if (metrics.memory.used_percent >= ALERT_LIMITS.memory.critical) {
      alerts.push({
        type: "system",
        severity: "critical",
        message: `Uso crítico de memória: ${metrics.memory.used_percent.toFixed(
          2
        )}%`,
        details: metrics.memory,
      });
    } else if (metrics.memory.used_percent >= ALERT_LIMITS.memory.warning) {
      alerts.push({
        type: "system",
        severity: "warning",
        message: `Uso elevado de memória: ${metrics.memory.used_percent.toFixed(
          2
        )}%`,
        details: metrics.memory,
      });
    }

    return alerts;
  } catch (error) {
    logger.error("Erro ao verificar métricas do sistema:", error);
    throw error;
  }
}

/**
 * Verifica métricas da API
 * @returns {Promise<Array>} Alertas gerados
 */
async function checkApiMetrics() {
  try {
    const metrics = await monitoringService.getApiMetrics();
    const alerts = [];

    // Verificar taxa de erros
    const errorRate = (metrics.errors / metrics.total_requests) * 100;
    if (errorRate >= ALERT_LIMITS.api.error_rate.critical) {
      alerts.push({
        type: "api",
        severity: "critical",
        message: `Taxa crítica de erros na API: ${errorRate.toFixed(2)}%`,
        details: {
          total_requests: metrics.total_requests,
          errors: metrics.errors,
          error_rate: errorRate,
        },
      });
    } else if (errorRate >= ALERT_LIMITS.api.error_rate.warning) {
      alerts.push({
        type: "api",
        severity: "warning",
        message: `Taxa elevada de erros na API: ${errorRate.toFixed(2)}%`,
        details: {
          total_requests: metrics.total_requests,
          errors: metrics.errors,
          error_rate: errorRate,
        },
      });
    }

    // Verificar tempo de resposta
    if (
      metrics.average_response_time >= ALERT_LIMITS.api.response_time.critical
    ) {
      alerts.push({
        type: "api",
        severity: "critical",
        message: `Tempo crítico de resposta da API: ${metrics.average_response_time.toFixed(
          2
        )}ms`,
        details: {
          average_response_time: metrics.average_response_time,
        },
      });
    } else if (
      metrics.average_response_time >= ALERT_LIMITS.api.response_time.warning
    ) {
      alerts.push({
        type: "api",
        severity: "warning",
        message: `Tempo elevado de resposta da API: ${metrics.average_response_time.toFixed(
          2
        )}ms`,
        details: {
          average_response_time: metrics.average_response_time,
        },
      });
    }

    return alerts;
  } catch (error) {
    logger.error("Erro ao verificar métricas da API:", error);
    throw error;
  }
}

/**
 * Verifica métricas do WhatsApp
 * @returns {Promise<Array>} Alertas gerados
 */
async function checkWhatsAppMetrics() {
  try {
    const metrics = await monitoringService.getWhatsAppMetrics();
    const alerts = [];

    // Verificar taxa de erros
    const errorRate = (metrics.errors / metrics.total_messages) * 100;
    if (errorRate >= ALERT_LIMITS.whatsapp.error_rate.critical) {
      alerts.push({
        type: "whatsapp",
        severity: "critical",
        message: `Taxa crítica de erros no WhatsApp: ${errorRate.toFixed(2)}%`,
        details: {
          total_messages: metrics.total_messages,
          errors: metrics.errors,
          error_rate: errorRate,
        },
      });
    } else if (errorRate >= ALERT_LIMITS.whatsapp.error_rate.warning) {
      alerts.push({
        type: "whatsapp",
        severity: "warning",
        message: `Taxa elevada de erros no WhatsApp: ${errorRate.toFixed(2)}%`,
        details: {
          total_messages: metrics.total_messages,
          errors: metrics.errors,
          error_rate: errorRate,
        },
      });
    }

    // Verificar tempo de entrega
    if (
      metrics.average_delivery_time >=
      ALERT_LIMITS.whatsapp.delivery_time.critical
    ) {
      alerts.push({
        type: "whatsapp",
        severity: "critical",
        message: `Tempo crítico de entrega no WhatsApp: ${metrics.average_delivery_time.toFixed(
          2
        )}ms`,
        details: {
          average_delivery_time: metrics.average_delivery_time,
        },
      });
    } else if (
      metrics.average_delivery_time >=
      ALERT_LIMITS.whatsapp.delivery_time.warning
    ) {
      alerts.push({
        type: "whatsapp",
        severity: "warning",
        message: `Tempo elevado de entrega no WhatsApp: ${metrics.average_delivery_time.toFixed(
          2
        )}ms`,
        details: {
          average_delivery_time: metrics.average_delivery_time,
        },
      });
    }

    return alerts;
  } catch (error) {
    logger.error("Erro ao verificar métricas do WhatsApp:", error);
    throw error;
  }
}

/**
 * Verifica métricas do modelo
 * @returns {Promise<Array>} Alertas gerados
 */
async function checkModelMetrics() {
  try {
    const metrics = await monitoringService.getModelMetrics();
    const alerts = [];

    // Verificar acurácia geral
    if (metrics.average_accuracy <= ALERT_LIMITS.model.accuracy.critical) {
      alerts.push({
        type: "model",
        severity: "critical",
        message: `Acurácia crítica do modelo: ${metrics.average_accuracy.toFixed(
          2
        )}%`,
        details: {
          average_accuracy: metrics.average_accuracy,
        },
      });
    } else if (
      metrics.average_accuracy <= ALERT_LIMITS.model.accuracy.warning
    ) {
      alerts.push({
        type: "model",
        severity: "warning",
        message: `Acurácia baixa do modelo: ${metrics.average_accuracy.toFixed(
          2
        )}%`,
        details: {
          average_accuracy: metrics.average_accuracy,
        },
      });
    }

    // Verificar acurácia por sintoma
    Object.entries(metrics.accuracy_by_symptom).forEach(
      ([symptom, accuracy]) => {
        if (accuracy <= ALERT_LIMITS.model.accuracy.critical) {
          alerts.push({
            type: "model",
            severity: "critical",
            message: `Acurácia crítica para sintoma "${symptom}": ${accuracy.toFixed(
              2
            )}%`,
            details: {
              symptom,
              accuracy,
            },
          });
        } else if (accuracy <= ALERT_LIMITS.model.accuracy.warning) {
          alerts.push({
            type: "model",
            severity: "warning",
            message: `Acurácia baixa para sintoma "${symptom}": ${accuracy.toFixed(
              2
            )}%`,
            details: {
              symptom,
              accuracy,
            },
          });
        }
      }
    );

    return alerts;
  } catch (error) {
    logger.error("Erro ao verificar métricas do modelo:", error);
    throw error;
  }
}

/**
 * Registra um alerta no banco de dados
 * @param {Object} alert Alerta a ser registrado
 * @returns {Promise<Object>} Alerta registrado
 */
async function registerAlert(alert) {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .insert([
        {
          ...alert,
          status: "active",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Notificar administradores
    await notificationService.notifyAdmins({
      type: "alert",
      title: `Alerta: ${alert.severity.toUpperCase()} - ${alert.type}`,
      message: alert.message,
      details: alert.details,
    });

    return data;
  } catch (error) {
    logger.error("Erro ao registrar alerta:", error);
    throw error;
  }
}

/**
 * Atualiza o status de um alerta
 * @param {string} alertId ID do alerta
 * @param {string} status Novo status
 * @returns {Promise<Object>} Alerta atualizado
 */
async function updateAlertStatus(alertId, status) {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
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
 * Lista alertas
 * @param {Object} filters Filtros para a listagem
 * @returns {Promise<Array>} Lista de alertas
 */
async function listAlerts(filters = {}) {
  try {
    let query = supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.severity) {
      query = query.eq("severity", filters.severity);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.start_date) {
      query = query.gte("created_at", filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte("created_at", filters.end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error("Erro ao listar alertas:", error);
    throw error;
  }
}

/**
 * Verifica todas as métricas e gera alertas
 * @returns {Promise<Array>} Alertas gerados
 */
async function checkAllMetrics() {
  try {
    const [systemAlerts, apiAlerts, whatsAppAlerts, modelAlerts] =
      await Promise.all([
        checkSystemMetrics(),
        checkApiMetrics(),
        checkWhatsAppMetrics(),
        checkModelMetrics(),
      ]);

    const allAlerts = [
      ...systemAlerts,
      ...apiAlerts,
      ...whatsAppAlerts,
      ...modelAlerts,
    ];

    // Registrar alertas
    const registeredAlerts = await Promise.all(
      allAlerts.map((alert) => registerAlert(alert))
    );

    return registeredAlerts;
  } catch (error) {
    logger.error("Erro ao verificar todas as métricas:", error);
    throw error;
  }
}

/**
 * Registra um novo alerta
 * @param {Object} alertData - Dados do alerta
 * @returns {Promise<Object>} Alerta registrado
 */
async function createAlert(alertData) {
  try {
    // Registrar alerta
    const alert = await alertModel.recordAlert(alertData);

    // Enviar notificação para administradores
    await notificationService.sendAlertNotification(alert);

    return alert;
  } catch (error) {
    logger.error("Erro ao criar alerta:", error);
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
    return await alertModel.getAlerts(filters);
  } catch (error) {
    logger.error("Erro ao obter alertas:", error);
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
    return await alertModel.getActiveAlerts(filters);
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
    return await alertModel.getAlertStats(filters);
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
    return await alertModel.cleanOldAlerts(days);
  } catch (error) {
    logger.error("Erro ao limpar alertas antigos:", error);
    throw error;
  }
}

/**
 * Exporta alertas para arquivo
 * @param {Object} filters - Filtros para os alertas
 * @param {string} format - Formato do arquivo (csv, json)
 * @returns {Promise<string>} Caminho do arquivo gerado
 */
async function exportAlerts(filters = {}, format = "csv") {
  try {
    const alerts = await alertModel.getAlerts(filters);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `alerts_${timestamp}.${format}`;
    const filepath = `./exports/${filename}`;

    // Garantir que o diretório existe
    const fs = require("fs");
    if (!fs.existsSync("./exports")) {
      fs.mkdirSync("./exports", { recursive: true });
    }

    if (format === "csv") {
      const csv = require("fast-csv");
      const ws = fs.createWriteStream(filepath);
      csv.write(alerts, { headers: true }).pipe(ws);
    } else if (format === "json") {
      fs.writeFileSync(filepath, JSON.stringify(alerts, null, 2));
    } else {
      throw new Error("Formato de arquivo não suportado");
    }

    return filepath;
  } catch (error) {
    logger.error("Erro ao exportar alertas:", error);
    throw error;
  }
}

module.exports = {
  checkSystemMetrics,
  checkApiMetrics,
  checkWhatsAppMetrics,
  checkModelMetrics,
  registerAlert,
  updateAlertStatus,
  listAlerts,
  checkAllMetrics,
  createAlert,
  getAlerts,
  getActiveAlerts,
  getAlertStats,
  cleanOldAlerts,
  exportAlerts,
};
