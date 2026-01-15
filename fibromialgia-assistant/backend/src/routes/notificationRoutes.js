const express = require("express");
const router = express.Router();
const notificationService = require("../services/notificationService");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

/**
 * @route POST /api/admin/notifications
 * @desc Cria uma nova notificação
 * @access Private/Admin
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    logger.error("Erro ao criar notificação:", error);
    res.status(500).json({ error: "Erro ao criar notificação" });
  }
});

/**
 * @route POST /api/admin/notifications/:id/send
 * @desc Envia uma notificação
 * @access Private/Admin
 */
router.post("/:id/send", requireAuth, requireAdmin, async (req, res) => {
  try {
    const notification = await notificationService.sendNotification(
      req.params.id
    );
    res.json(notification);
  } catch (error) {
    logger.error("Erro ao enviar notificação:", error);
    res.status(500).json({ error: "Erro ao enviar notificação" });
  }
});

/**
 * @route POST /api/admin/notifications/schedule
 * @desc Agenda uma notificação
 * @access Private/Admin
 */
router.post("/schedule", requireAuth, requireAdmin, async (req, res) => {
  try {
    const notification = await notificationService.scheduleNotification(
      req.body
    );
    res.status(201).json(notification);
  } catch (error) {
    logger.error("Erro ao agendar notificação:", error);
    res.status(500).json({ error: "Erro ao agendar notificação" });
  }
});

/**
 * @route GET /api/admin/notifications
 * @desc Lista notificações
 * @access Private/Admin
 */
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    };

    const notifications = await notificationService.listNotifications(filters);
    res.json(notifications);
  } catch (error) {
    logger.error("Erro ao listar notificações:", error);
    res.status(500).json({ error: "Erro ao listar notificações" });
  }
});

/**
 * @route GET /api/admin/notifications/:id
 * @desc Obtém detalhes de uma notificação
 * @access Private/Admin
 */
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const notification = await notificationService.getNotificationDetails(
      req.params.id
    );
    res.json(notification);
  } catch (error) {
    logger.error("Erro ao obter detalhes da notificação:", error);
    res.status(500).json({ error: "Erro ao obter detalhes da notificação" });
  }
});

/**
 * @route POST /api/admin/notifications/:id/cancel
 * @desc Cancela uma notificação
 * @access Private/Admin
 */
router.post("/:id/cancel", requireAuth, requireAdmin, async (req, res) => {
  try {
    const notification = await notificationService.cancelNotification(
      req.params.id
    );
    res.json(notification);
  } catch (error) {
    logger.error("Erro ao cancelar notificação:", error);
    res.status(500).json({ error: "Erro ao cancelar notificação" });
  }
});

/**
 * @route POST /api/admin/notifications/process
 * @desc Processa notificações agendadas
 * @access Private/Admin
 */
router.post("/process", requireAuth, requireAdmin, async (req, res) => {
  try {
    await notificationService.processScheduledNotifications();
    res.json({ message: "Processamento de notificações iniciado" });
  } catch (error) {
    logger.error("Erro ao processar notificações:", error);
    res.status(500).json({ error: "Erro ao processar notificações" });
  }
});

/**
 * @route POST /api/admin/notifications/:id/read
 * @desc Marca notificação como lida
 * @access Private/Admin
 */
router.post("/:id/read", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await notificationService.markAsRead(id);
    res.json({ message: "Notificação marcada como lida" });
  } catch (error) {
    logger.error("Erro ao marcar notificação como lida:", error);
    res.status(500).json({ error: "Erro ao marcar notificação como lida" });
  }
});

/**
 * @route POST /api/admin/notifications/test
 * @desc Envia notificação de teste
 * @access Private/Admin
 */
router.post("/test", requireAuth, requireAdmin, async (req, res) => {
  try {
    await notificationService.notifyAdmins({
      type: "system",
      title: "Notificação de Teste",
      message: "Esta é uma notificação de teste do sistema.",
      details: {
        timestamp: new Date().toISOString(),
        user: req.user.name,
      },
    });

    res.json({ message: "Notificação de teste enviada com sucesso" });
  } catch (error) {
    logger.error("Erro ao enviar notificação de teste:", error);
    res.status(500).json({ error: "Erro ao enviar notificação de teste" });
  }
});

module.exports = router;
