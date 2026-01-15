const express = require("express");
const router = express.Router();
const reportService = require("../services/reportService");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

/**
 * @route POST /api/admin/reports/usage
 * @desc Gera relatório de uso do sistema
 * @access Private/Admin
 */
router.post("/usage", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, format = "pdf" } = req.body;

    const filters = {
      start_date,
      end_date,
    };

    const reportUrl = await reportService.generateUsageReport(filters, format);
    res.json({ url: reportUrl });
  } catch (error) {
    logger.error("Erro ao gerar relatório de uso:", error);
    res.status(500).json({ error: "Erro ao gerar relatório de uso" });
  }
});

/**
 * @route POST /api/admin/reports/alerts
 * @desc Gera relatório de alertas
 * @access Private/Admin
 */
router.post("/alerts", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      type,
      severity,
      status,
      format = "pdf",
    } = req.body;

    const filters = {
      start_date,
      end_date,
      type,
      severity,
      status,
    };

    const reportUrl = await reportService.generateAlertReport(filters, format);
    res.json({ url: reportUrl });
  } catch (error) {
    logger.error("Erro ao gerar relatório de alertas:", error);
    res.status(500).json({ error: "Erro ao gerar relatório de alertas" });
  }
});

/**
 * @route POST /api/admin/reports/performance
 * @desc Gera relatório de desempenho
 * @access Private/Admin
 */
router.post("/performance", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, format = "pdf" } = req.body;

    const filters = {
      start_date,
      end_date,
    };

    const reportUrl = await reportService.generatePerformanceReport(
      filters,
      format
    );
    res.json({ url: reportUrl });
  } catch (error) {
    logger.error("Erro ao gerar relatório de desempenho:", error);
    res.status(500).json({ error: "Erro ao gerar relatório de desempenho" });
  }
});

module.exports = router;
