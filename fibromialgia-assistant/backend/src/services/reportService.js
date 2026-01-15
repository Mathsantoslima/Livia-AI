const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const monitoringService = require("./monitoringService");
const alertService = require("./alertService");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * Gera relatório de uso do sistema
 * @param {Object} filters Filtros para o relatório
 * @param {string} format Formato do relatório (pdf/excel)
 * @returns {Promise<string>} URL do relatório
 */
async function generateUsageReport(filters = {}, format = "pdf") {
  try {
    // Obter métricas
    const [usageMetrics, apiMetrics, whatsAppMetrics, modelMetrics] =
      await Promise.all([
        monitoringService.getUsageMetrics(),
        monitoringService.getApiMetrics(),
        monitoringService.getWhatsAppMetrics(),
        monitoringService.getModelMetrics(),
      ]);

    // Gerar relatório
    const report = {
      title: "Relatório de Uso do Sistema",
      period: {
        start:
          filters.start_date ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: filters.end_date || new Date().toISOString(),
      },
      metrics: {
        usage: usageMetrics,
        api: apiMetrics,
        whatsapp: whatsAppMetrics,
        model: modelMetrics,
      },
    };

    // Salvar relatório
    const filename = `usage_report_${Date.now()}.${format}`;
    const filepath = path.join(__dirname, "../../temp", filename);

    if (format === "pdf") {
      await generatePDFReport(report, filepath);
    } else {
      await generateExcelReport(report, filepath);
    }

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from("reports")
      .upload(filename, fs.createReadStream(filepath), {
        contentType:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

    if (error) throw error;

    // Remover arquivo temporário
    await unlinkAsync(filepath);

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("reports").getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    logger.error("Erro ao gerar relatório de uso:", error);
    throw error;
  }
}

/**
 * Gera relatório de alertas
 * @param {Object} filters Filtros para o relatório
 * @param {string} format Formato do relatório (pdf/excel)
 * @returns {Promise<string>} URL do relatório
 */
async function generateAlertReport(filters = {}, format = "pdf") {
  try {
    // Obter alertas
    const alerts = await alertService.listAlerts(filters);

    // Gerar relatório
    const report = {
      title: "Relatório de Alertas",
      period: {
        start:
          filters.start_date ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: filters.end_date || new Date().toISOString(),
      },
      alerts: alerts,
      summary: {
        total: alerts.length,
        by_type: {},
        by_severity: {},
        by_status: {},
      },
    };

    // Calcular resumo
    alerts.forEach((alert) => {
      // Por tipo
      report.summary.by_type[alert.type] =
        (report.summary.by_type[alert.type] || 0) + 1;

      // Por severidade
      report.summary.by_severity[alert.severity] =
        (report.summary.by_severity[alert.severity] || 0) + 1;

      // Por status
      report.summary.by_status[alert.status] =
        (report.summary.by_status[alert.status] || 0) + 1;
    });

    // Salvar relatório
    const filename = `alert_report_${Date.now()}.${format}`;
    const filepath = path.join(__dirname, "../../temp", filename);

    if (format === "pdf") {
      await generatePDFReport(report, filepath);
    } else {
      await generateExcelReport(report, filepath);
    }

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from("reports")
      .upload(filename, fs.createReadStream(filepath), {
        contentType:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

    if (error) throw error;

    // Remover arquivo temporário
    await unlinkAsync(filepath);

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("reports").getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    logger.error("Erro ao gerar relatório de alertas:", error);
    throw error;
  }
}

/**
 * Gera relatório de desempenho
 * @param {Object} filters Filtros para o relatório
 * @param {string} format Formato do relatório (pdf/excel)
 * @returns {Promise<string>} URL do relatório
 */
async function generatePerformanceReport(filters = {}, format = "pdf") {
  try {
    // Obter métricas
    const [
      systemMetrics,
      databaseMetrics,
      apiMetrics,
      whatsAppMetrics,
      modelMetrics,
    ] = await Promise.all([
      monitoringService.getSystemMetrics(),
      monitoringService.getDatabaseMetrics(),
      monitoringService.getApiMetrics(),
      monitoringService.getWhatsAppMetrics(),
      monitoringService.getModelMetrics(),
    ]);

    // Gerar relatório
    const report = {
      title: "Relatório de Desempenho",
      period: {
        start:
          filters.start_date ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: filters.end_date || new Date().toISOString(),
      },
      metrics: {
        system: systemMetrics,
        database: databaseMetrics,
        api: apiMetrics,
        whatsapp: whatsAppMetrics,
        model: modelMetrics,
      },
    };

    // Salvar relatório
    const filename = `performance_report_${Date.now()}.${format}`;
    const filepath = path.join(__dirname, "../../temp", filename);

    if (format === "pdf") {
      await generatePDFReport(report, filepath);
    } else {
      await generateExcelReport(report, filepath);
    }

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from("reports")
      .upload(filename, fs.createReadStream(filepath), {
        contentType:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

    if (error) throw error;

    // Remover arquivo temporário
    await unlinkAsync(filepath);

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("reports").getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    logger.error("Erro ao gerar relatório de desempenho:", error);
    throw error;
  }
}

/**
 * Gera relatório em PDF
 * @param {Object} report Dados do relatório
 * @param {string} filepath Caminho do arquivo
 * @returns {Promise<void>}
 */
async function generatePDFReport(report, filepath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Título
      doc.fontSize(20).text(report.title, { align: "center" });
      doc.moveDown();

      // Período
      doc
        .fontSize(12)
        .text(
          `Período: ${new Date(
            report.period.start
          ).toLocaleDateString()} a ${new Date(
            report.period.end
          ).toLocaleDateString()}`
        );
      doc.moveDown();

      // Métricas
      if (report.metrics) {
        Object.entries(report.metrics).forEach(([key, value]) => {
          doc.fontSize(14).text(key.charAt(0).toUpperCase() + key.slice(1));
          doc.fontSize(10);

          Object.entries(value).forEach(([k, v]) => {
            if (typeof v === "object") {
              doc.text(`${k}:`);
              Object.entries(v).forEach(([sk, sv]) => {
                doc.text(`  ${sk}: ${sv}`);
              });
            } else {
              doc.text(`${k}: ${v}`);
            }
          });

          doc.moveDown();
        });
      }

      // Alertas
      if (report.alerts) {
        doc.fontSize(14).text("Alertas");
        doc.fontSize(10);

        report.alerts.forEach((alert) => {
          doc.text(`Tipo: ${alert.type}`);
          doc.text(`Severidade: ${alert.severity}`);
          doc.text(`Status: ${alert.status}`);
          doc.text(`Mensagem: ${alert.message}`);
          doc.text(`Data: ${new Date(alert.created_at).toLocaleString()}`);
          doc.moveDown();
        });
      }

      // Resumo
      if (report.summary) {
        doc.fontSize(14).text("Resumo");
        doc.fontSize(10);

        Object.entries(report.summary).forEach(([key, value]) => {
          if (typeof value === "object") {
            doc.text(`${key}:`);
            Object.entries(value).forEach(([k, v]) => {
              doc.text(`  ${k}: ${v}`);
            });
          } else {
            doc.text(`${key}: ${value}`);
          }
        });
      }

      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Gera relatório em Excel
 * @param {Object} report Dados do relatório
 * @param {string} filepath Caminho do arquivo
 * @returns {Promise<void>}
 */
async function generateExcelReport(report, filepath) {
  try {
    const workbook = new ExcelJS.Workbook();

    // Informações
    const infoSheet = workbook.addWorksheet("Informações");
    infoSheet.columns = [
      { header: "Campo", key: "field" },
      { header: "Valor", key: "value" },
    ];

    infoSheet.addRow({ field: "Título", value: report.title });
    infoSheet.addRow({
      field: "Período Inicial",
      value: new Date(report.period.start).toLocaleString(),
    });
    infoSheet.addRow({
      field: "Período Final",
      value: new Date(report.period.end).toLocaleString(),
    });

    // Métricas
    if (report.metrics) {
      Object.entries(report.metrics).forEach(([key, value]) => {
        const sheet = workbook.addWorksheet(
          key.charAt(0).toUpperCase() + key.slice(1)
        );

        const rows = [];
        Object.entries(value).forEach(([k, v]) => {
          if (typeof v === "object") {
            Object.entries(v).forEach(([sk, sv]) => {
              rows.push({ field: `${k} - ${sk}`, value: sv });
            });
          } else {
            rows.push({ field: k, value: v });
          }
        });

        sheet.columns = [
          { header: "Campo", key: "field" },
          { header: "Valor", key: "value" },
        ];

        sheet.addRows(rows);
      });
    }

    // Alertas
    if (report.alerts) {
      const sheet = workbook.addWorksheet("Alertas");

      sheet.columns = [
        { header: "Tipo", key: "type" },
        { header: "Severidade", key: "severity" },
        { header: "Status", key: "status" },
        { header: "Mensagem", key: "message" },
        { header: "Data", key: "date" },
      ];

      const rows = report.alerts.map((alert) => ({
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        message: alert.message,
        date: new Date(alert.created_at).toLocaleString(),
      }));

      sheet.addRows(rows);
    }

    // Resumo
    if (report.summary) {
      const sheet = workbook.addWorksheet("Resumo");

      const rows = [];
      Object.entries(report.summary).forEach(([key, value]) => {
        if (typeof value === "object") {
          Object.entries(value).forEach(([k, v]) => {
            rows.push({ field: `${key} - ${k}`, value: v });
          });
        } else {
          rows.push({ field: key, value: value });
        }
      });

      sheet.columns = [
        { header: "Campo", key: "field" },
        { header: "Valor", key: "value" },
      ];

      sheet.addRows(rows);
    }

    await workbook.xlsx.writeFile(filepath);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  generateUsageReport,
  generateAlertReport,
  generatePerformanceReport,
};
