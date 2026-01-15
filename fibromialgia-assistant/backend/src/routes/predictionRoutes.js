const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const predictionService = require("../services/predictionService");

/**
 * @route GET /api/predictions
 * @desc Busca previsões do usuário
 * @access Private
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const predictions = await predictionService.getUserPredictions(
      req.user.id,
      parseInt(limit),
      parseInt(page)
    );
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar previsões" });
  }
});

/**
 * @route GET /api/predictions/patterns
 * @desc Busca análise de padrões
 * @access Private
 */
router.get("/patterns", authenticateToken, async (req, res) => {
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
 * @route POST /api/predictions
 * @desc Gera nova previsão
 * @access Private
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { currentData } = req.body;

    if (!currentData) {
      return res.status(400).json({ error: "Dados atuais são obrigatórios" });
    }

    const prediction = await predictionService.generatePrediction(
      req.user.id,
      currentData
    );

    const registeredPrediction = await predictionService.registerPrediction(
      req.user.id,
      prediction
    );

    res.json(registeredPrediction);
  } catch (error) {
    res.status(500).json({ error: "Erro ao gerar previsão" });
  }
});

/**
 * @route GET /api/predictions/:id
 * @desc Busca previsão específica
 * @access Private
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const predictions = await predictionService.getUserPredictions(req.user.id);
    const prediction = predictions.find((p) => p.id === id);

    if (!prediction) {
      return res.status(404).json({ error: "Previsão não encontrada" });
    }

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar previsão" });
  }
});

module.exports = router;
