const express = require("express");
const router = express.Router();
const backupService = require("../services/backupService");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

/**
 * @route POST /api/admin/backups/database
 * @desc Cria um backup do banco de dados
 * @access Private/Admin
 */
router.post("/database", requireAuth, requireAdmin, async (req, res) => {
  try {
    const backup = await backupService.createDatabaseBackup();
    res.status(201).json(backup);
  } catch (error) {
    logger.error("Erro ao criar backup do banco de dados:", error);
    res.status(500).json({ error: "Erro ao criar backup do banco de dados" });
  }
});

/**
 * @route POST /api/admin/backups/files
 * @desc Cria um backup dos arquivos
 * @access Private/Admin
 */
router.post("/files", requireAuth, requireAdmin, async (req, res) => {
  try {
    const backup = await backupService.createFilesBackup();
    res.status(201).json(backup);
  } catch (error) {
    logger.error("Erro ao criar backup dos arquivos:", error);
    res.status(500).json({ error: "Erro ao criar backup dos arquivos" });
  }
});

/**
 * @route GET /api/admin/backups
 * @desc Lista backups
 * @access Private/Admin
 */
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const backups = await backupService.listBackups(req.query);
    res.json(backups);
  } catch (error) {
    logger.error("Erro ao listar backups:", error);
    res.status(500).json({ error: "Erro ao listar backups" });
  }
});

/**
 * @route GET /api/admin/backups/:id
 * @desc Obtém detalhes de um backup
 * @access Private/Admin
 */
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const backup = await backupService.getBackupDetails(req.params.id);
    res.json(backup);
  } catch (error) {
    logger.error("Erro ao obter detalhes do backup:", error);
    res.status(500).json({ error: "Erro ao obter detalhes do backup" });
  }
});

/**
 * @route DELETE /api/admin/backups/:id
 * @desc Remove um backup
 * @access Private/Admin
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await backupService.removeBackup(req.params.id);
    res.json({ message: "Backup removido com sucesso" });
  } catch (error) {
    logger.error("Erro ao remover backup:", error);
    res.status(500).json({ error: "Erro ao remover backup" });
  }
});

/**
 * @route POST /api/admin/backups/:id/restore/database
 * @desc Restaura um backup do banco de dados
 * @access Private/Admin
 */
router.post(
  "/:id/restore/database",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await backupService.restoreDatabaseBackup(req.params.id);
      res.json({ message: "Backup do banco de dados restaurado com sucesso" });
    } catch (error) {
      logger.error("Erro ao restaurar backup do banco de dados:", error);
      res
        .status(500)
        .json({ error: "Erro ao restaurar backup do banco de dados" });
    }
  }
);

/**
 * @route POST /api/admin/backups/:id/restore/files
 * @desc Restaura um backup dos arquivos
 * @access Private/Admin
 */
router.post(
  "/:id/restore/files",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      await backupService.restoreFilesBackup(req.params.id);
      res.json({ message: "Backup dos arquivos restaurado com sucesso" });
    } catch (error) {
      logger.error("Erro ao restaurar backup dos arquivos:", error);
      res.status(500).json({ error: "Erro ao restaurar backup dos arquivos" });
    }
  }
);

module.exports = router;
