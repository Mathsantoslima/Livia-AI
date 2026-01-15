const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const monitoringService = require("./monitoringService");
const alertService = require("./alertService");
const reportService = require("./reportService");
const notificationService = require("./notificationService");
const cron = require("node-cron");

// Tarefas agendadas
const scheduledTasks = new Map();

/**
 * Inicia o serviço de agendamento
 */
function startScheduler() {
  try {
    // Verificar métricas a cada 5 minutos
    scheduleTask("check_metrics", "*/5 * * * *", async () => {
      try {
        const alerts = await alertService.checkAllMetrics();

        if (alerts.length > 0) {
          logger.info(`Verificação de métricas gerou ${alerts.length} alertas`);
        }
      } catch (error) {
        logger.error("Erro ao executar verificação de métricas:", error);
      }
    });

    // Gerar relatório diário às 00:00
    scheduleTask("daily_report", "0 0 * * *", async () => {
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const today = new Date();

        const filters = {
          start_date: yesterday.toISOString(),
          end_date: today.toISOString(),
        };

        // Gerar relatórios
        const [usageReportUrl, alertReportUrl, performanceReportUrl] =
          await Promise.all([
            reportService.generateUsageReport(filters, "pdf"),
            reportService.generateAlertReport(filters, "pdf"),
            reportService.generatePerformanceReport(filters, "pdf"),
          ]);

        // Notificar administradores
        await notificationService.notifyAdmins({
          type: "report",
          title: "Relatório Diário",
          message: "Relatórios diários gerados com sucesso",
          details: {
            usage_report: usageReportUrl,
            alert_report: alertReportUrl,
            performance_report: performanceReportUrl,
          },
        });

        logger.info("Relatórios diários gerados com sucesso");
      } catch (error) {
        logger.error("Erro ao gerar relatórios diários:", error);
      }
    });

    // Limpar logs antigos às 01:00
    scheduleTask("clean_logs", "0 1 * * *", async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Limpar logs
        const { error } = await supabase
          .from("logs")
          .delete()
          .lt("created_at", thirtyDaysAgo.toISOString());

        if (error) throw error;

        logger.info("Logs antigos removidos com sucesso");
      } catch (error) {
        logger.error("Erro ao limpar logs antigos:", error);
      }
    });

    // Limpar alertas resolvidos às 02:00
    scheduleTask("clean_alerts", "0 2 * * *", async () => {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Limpar alertas
        const { error } = await supabase
          .from("alerts")
          .delete()
          .eq("status", "resolved")
          .lt("updated_at", sevenDaysAgo.toISOString());

        if (error) throw error;

        logger.info("Alertas resolvidos removidos com sucesso");
      } catch (error) {
        logger.error("Erro ao limpar alertas resolvidos:", error);
      }
    });

    // Limpar relatórios antigos às 03:00
    scheduleTask("clean_reports", "0 3 * * *", async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Listar arquivos antigos
        const { data: files, error } = await supabase.storage
          .from("reports")
          .list();

        if (error) throw error;

        // Remover arquivos antigos
        const oldFiles = files.filter((file) => {
          const fileDate = new Date(file.created_at);
          return fileDate < thirtyDaysAgo;
        });

        await Promise.all(
          oldFiles.map((file) =>
            supabase.storage.from("reports").remove([file.name])
          )
        );

        logger.info(
          `${oldFiles.length} relatórios antigos removidos com sucesso`
        );
      } catch (error) {
        logger.error("Erro ao limpar relatórios antigos:", error);
      }
    });

    logger.info("Serviço de agendamento iniciado com sucesso");
  } catch (error) {
    logger.error("Erro ao iniciar serviço de agendamento:", error);
    throw error;
  }
}

/**
 * Para o serviço de agendamento
 */
function stopScheduler() {
  try {
    // Parar todas as tarefas
    scheduledTasks.forEach((task, name) => {
      task.stop();
      logger.info(`Tarefa "${name}" parada com sucesso`);
    });

    scheduledTasks.clear();

    logger.info("Serviço de agendamento parado com sucesso");
  } catch (error) {
    logger.error("Erro ao parar serviço de agendamento:", error);
    throw error;
  }
}

/**
 * Agenda uma tarefa
 * @param {string} name Nome da tarefa
 * @param {string} schedule Expressão cron
 * @param {Function} task Função a ser executada
 */
function scheduleTask(name, schedule, task) {
  try {
    // Verificar se a tarefa já existe
    if (scheduledTasks.has(name)) {
      throw new Error(`Tarefa "${name}" já existe`);
    }

    // Criar tarefa
    const scheduledTask = cron.schedule(schedule, task);

    // Armazenar tarefa
    scheduledTasks.set(name, scheduledTask);

    logger.info(`Tarefa "${name}" agendada com sucesso`);
  } catch (error) {
    logger.error(`Erro ao agendar tarefa "${name}":`, error);
    throw error;
  }
}

/**
 * Remove uma tarefa agendada
 * @param {string} name Nome da tarefa
 */
function removeTask(name) {
  try {
    // Verificar se a tarefa existe
    if (!scheduledTasks.has(name)) {
      throw new Error(`Tarefa "${name}" não existe`);
    }

    // Parar tarefa
    const task = scheduledTasks.get(name);
    task.stop();

    // Remover tarefa
    scheduledTasks.delete(name);

    logger.info(`Tarefa "${name}" removida com sucesso`);
  } catch (error) {
    logger.error(`Erro ao remover tarefa "${name}":`, error);
    throw error;
  }
}

/**
 * Lista tarefas agendadas
 * @returns {Array} Lista de tarefas
 */
function listTasks() {
  try {
    const tasks = [];

    scheduledTasks.forEach((task, name) => {
      tasks.push({
        name,
        status: task.getStatus(),
      });
    });

    return tasks;
  } catch (error) {
    logger.error("Erro ao listar tarefas agendadas:", error);
    throw error;
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  scheduleTask,
  removeTask,
  listTasks,
};
