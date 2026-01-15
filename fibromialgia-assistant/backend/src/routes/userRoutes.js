const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const userService = require("../services/userService");
const predictionService = require("../services/predictionService");

/**
 * @route GET /api/users/me
 * @desc Busca dados do usuário autenticado
 * @access Private
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await userService.getUserData(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

/**
 * @route GET /api/users/me/interactions
 * @desc Busca interações do usuário
 * @access Private
 */
router.get("/me/interactions", authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const interactions = await userService.getUserInteractions(
      req.user.id,
      parseInt(limit)
    );
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar interações" });
  }
});

/**
 * @route GET /api/users/me/predictions
 * @desc Busca previsões do usuário
 * @access Private
 */
router.get("/me/predictions", authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const predictions = await predictionService.getUserPredictions(
      req.user.id,
      parseInt(limit)
    );
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar previsões" });
  }
});

/**
 * @route GET /api/users/me/patterns
 * @desc Busca análise de padrões do usuário
 * @access Private
 */
router.get("/me/patterns", authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const patterns = await predictionService.analyzePatterns(
      req.user.id,
      parseInt(days)
    );
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: "Erro ao analisar padrões" });
  }
});

/**
 * @route POST /api/users/me/predict
 * @desc Gera previsão para o usuário
 * @access Private
 */
router.post("/me/predict", authenticateToken, async (req, res) => {
  try {
    const { currentData } = req.body;

    if (!currentData) {
      return res.status(400).json({ error: "Dados atuais são obrigatórios" });
    }

    const prediction = await predictionService.generatePrediction(
      req.user.id,
      currentData
    );
    await predictionService.registerPrediction(req.user.id, prediction);

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: "Erro ao gerar previsão" });
  }
});

/**
 * @route PUT /api/users/me
 * @desc Atualiza dados do usuário
 * @access Private
 */
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const { name, onboarding_completed } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (onboarding_completed !== undefined)
      updates.onboarding_completed = onboarding_completed;

    const user = await userService.updateUser(req.user.id, updates);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar dados do usuário" });
  }
});

module.exports = router;
