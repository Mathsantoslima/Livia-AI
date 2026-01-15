const express = require("express");
const router = express.Router();
const schedulerService = require("../services/schedulerService");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const logger = require("../utils/logger");

/**
 * @route POST /api/admin/scheduler/start
 * @desc Inicia o serviço de agendamento
 * @access Private/Admin
 */
router.post("/start", authenticate, authorizeAdmin, async (req, res) => {
  try {
    await schedulerService.startScheduler();
    res.json({ message: "Serviço de agendamento iniciado com sucesso" });
  } catch (error) {
    logger.error("Erro ao iniciar serviço de agendamento:", error);
    res.status(500).json({ error: "Erro ao iniciar serviço de agendamento" });
  }
});

/**
 * @route POST /api/admin/scheduler/stop
 * @desc Para o serviço de agendamento
 * @access Private/Admin
 */
router.post("/stop", authenticate, authorizeAdmin, async (req, res) => {
  try {
    await schedulerService.stopScheduler();
    res.json({ message: "Serviço de agendamento parado com sucesso" });
  } catch (error) {
    logger.error("Erro ao parar serviço de agendamento:", error);
    res.status(500).json({ error: "Erro ao parar serviço de agendamento" });
  }
});

/**
 * @route POST /api/admin/scheduler/tasks
 * @desc Agenda uma nova tarefa
 * @access Private/Admin
 */
router.post("/tasks", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, schedule, task } = req.body;

    if (!name || !schedule || !task) {
      return res
        .status(400)
        .json({ error: "Nome, agendamento e tarefa são obrigatórios" });
    }

    await schedulerService.scheduleTask(name, schedule, task);
    res.json({ message: "Tarefa agendada com sucesso" });
  } catch (error) {
    logger.error("Erro ao agendar tarefa:", error);
    res.status(500).json({ error: "Erro ao agendar tarefa" });
  }
});

/**
 * @route DELETE /api/admin/scheduler/tasks/:name
 * @desc Remove uma tarefa agendada
 * @access Private/Admin
 */
router.delete(
  "/tasks/:name",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { name } = req.params;

      await schedulerService.removeTask(name);
      res.json({ message: "Tarefa removida com sucesso" });
    } catch (error) {
      logger.error("Erro ao remover tarefa:", error);
      res.status(500).json({ error: "Erro ao remover tarefa" });
    }
  }
);

/**
 * @route GET /api/admin/scheduler/tasks
 * @desc Lista todas as tarefas agendadas
 * @access Private/Admin
 */
router.get("/tasks", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const tasks = await schedulerService.listTasks();
    res.json(tasks);
  } catch (error) {
    logger.error("Erro ao listar tarefas:", error);
    res.status(500).json({ error: "Erro ao listar tarefas" });
  }
});

module.exports = router;
