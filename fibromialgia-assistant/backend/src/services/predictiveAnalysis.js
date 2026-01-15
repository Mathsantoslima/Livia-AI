/**
 * =========================================
 * SERVIÇO DE ANÁLISE PREDITIVA
 * =========================================
 *
 * Analisa rotina, esforço físico/mental e sintomas
 * para fazer previsões sobre o dia atual e próximo dia
 *
 * Trabalha com probabilidades, não certezas
 */

const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

class PredictiveAnalysis {
  /**
   * Analisa o dia anterior e prevê o dia atual
   * @param {string} userId - ID do usuário
   * @param {Date} targetDate - Data alvo (padrão: hoje)
   * @returns {Promise<Object>} Análise preditiva
   */
  async analyzeDay(userId, targetDate = new Date()) {
    try {
      // Buscar dados do usuário
      const userData = await this._getUserData(userId);
      if (!userData) {
        return { error: "Usuário não encontrado" };
      }

      // Buscar dados do dia anterior
      const yesterday = new Date(targetDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayData = await this._getDayData(userId, yesterday);

      // Buscar dados dos últimos 7 dias para padrões
      const last7Days = await this._getLastNDays(userId, 7);

      // Analisar rotina do dia anterior
      const routineAnalysis = this._analyzeRoutine(yesterdayData, userData);

      // Analisar esforço físico e mental
      const effortAnalysis = this._analyzeEffort(yesterdayData, userData);

      // Analisar sintomas
      const symptomAnalysis = this._analyzeSymptoms(yesterdayData, last7Days);

      // Gerar previsão para o dia atual
      const todayPrediction = this._predictToday(
        routineAnalysis,
        effortAnalysis,
        symptomAnalysis,
        userData
      );

      // Gerar previsão para amanhã
      const tomorrowPrediction = this._predictTomorrow(
        routineAnalysis,
        effortAnalysis,
        symptomAnalysis,
        userData
      );

      return {
        yesterday: {
          routine: routineAnalysis,
          effort: effortAnalysis,
          symptoms: symptomAnalysis,
        },
        today: todayPrediction,
        tomorrow: tomorrowPrediction,
        confidence: this._calculateConfidence(last7Days.length),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[PredictiveAnalysis] Erro ao analisar dia:", error);
      throw error;
    }
  }

  /**
   * Busca dados do usuário
   */
  async _getUserData(userId) {
    try {
      const { data, error } = await supabase
        .from("users_livia")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        logger.error("Erro ao buscar dados do usuário:", error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error("Erro ao buscar dados do usuário:", error);
      return null;
    }
  }

  /**
   * Busca dados de um dia específico
   */
  async _getDayData(userId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Buscar conversas do dia
      const { data: conversations } = await supabase
        .from("conversations_livia")
        .select("*")
        .eq("user_id", userId)
        .gte("sent_at", startOfDay.toISOString())
        .lte("sent_at", endOfDay.toISOString())
        .order("sent_at", { ascending: true });

      return {
        date: date.toISOString().split("T")[0],
        conversations: conversations || [],
        painLevel: this._extractAveragePain(conversations || []),
        energyLevel: this._extractAverageEnergy(conversations || []),
        moodLevel: this._extractAverageMood(conversations || []),
        symptoms: this._extractSymptoms(conversations || []),
      };
    } catch (error) {
      logger.error("Erro ao buscar dados do dia:", error);
      return { date: date.toISOString().split("T")[0], conversations: [] };
    }
  }

  /**
   * Busca dados dos últimos N dias
   */
  async _getLastNDays(userId, n) {
    const days = [];
    for (let i = 0; i < n; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayData = await this._getDayData(userId, date);
      days.push(dayData);
    }
    return days.reverse(); // Mais antigo primeiro
  }

  /**
   * Analisa rotina do dia anterior
   */
  _analyzeRoutine(dayData, userData) {
    const routine = userData.daily_routine || {};
    const habits = userData.habits || {};

    return {
      sleep: {
        hours: habits.sleep?.averageHours || 7,
        quality: habits.sleep?.quality || "medium",
        consistency: habits.sleep?.consistency || "medium",
      },
      work: {
        hours: habits.work?.hoursPerDay || 8,
        stressLevel: habits.work?.stressLevel || "medium",
        breaks: habits.work?.breaks || false,
      },
      physicalActivity: {
        level: habits.physicalEffort?.level || "low",
        frequency: habits.physicalEffort?.frequency || "rarely",
      },
      mentalActivity: {
        level: habits.mentalEffort?.level || "medium",
        concentration: habits.mentalEffort?.concentration || "medium",
      },
    };
  }

  /**
   * Analisa esforço físico e mental
   */
  _analyzeEffort(dayData, userData) {
    const habits = userData.habits || {};

    return {
      physical: {
        level: habits.physicalEffort?.level || "low",
        impact: this._estimatePhysicalImpact(habits.physicalEffort),
      },
      mental: {
        level: habits.mentalEffort?.level || "medium",
        impact: this._estimateMentalImpact(habits.mentalEffort),
      },
      combined: {
        totalImpact: this._estimateCombinedImpact(habits),
      },
    };
  }

  /**
   * Analisa sintomas
   */
  _analyzeSymptoms(dayData, last7Days) {
    const symptoms = dayData.symptoms || [];
    const avgPain = dayData.painLevel || 0;
    const avgEnergy = dayData.energyLevel || 0;
    const avgMood = dayData.moodLevel || 0;

    // Calcular tendência dos últimos 7 dias
    const painTrend = this._calculateTrend(
      last7Days.map((d) => d.painLevel || 0)
    );
    const energyTrend = this._calculateTrend(
      last7Days.map((d) => d.energyLevel || 0)
    );
    const moodTrend = this._calculateTrend(
      last7Days.map((d) => d.moodLevel || 0)
    );

    return {
      pain: {
        level: avgPain,
        trend: painTrend,
      },
      energy: {
        level: avgEnergy,
        trend: energyTrend,
      },
      mood: {
        level: avgMood,
        trend: moodTrend,
      },
      symptoms: symptoms,
    };
  }

  /**
   * Previsão para o dia atual
   */
  _predictToday(routine, effort, symptoms, userData) {
    const predictions = [];

    // Previsão baseada em sono
    if (routine.sleep.hours < 6) {
      predictions.push({
        type: "sleep",
        message: "Dormiu pouco ontem",
        impact: "Pode sentir mais fadiga hoje",
        probability: 0.7,
      });
    } else if (routine.sleep.hours >= 8 && routine.sleep.quality === "good") {
      predictions.push({
        type: "sleep",
        message: "Dormiu bem ontem",
        impact: "Pode ter mais energia hoje",
        probability: 0.6,
      });
    }

    // Previsão baseada em esforço físico
    if (effort.physical.level === "high") {
      predictions.push({
        type: "physical",
        message: "Atividade física intensa ontem",
        impact: "Pode sentir dores musculares hoje",
        probability: 0.65,
      });
    }

    // Previsão baseada em esforço mental
    if (effort.mental.level === "high") {
      predictions.push({
        type: "mental",
        message: "Muito esforço mental ontem",
        impact: "Pode sentir mais fadiga mental hoje",
        probability: 0.6,
      });
    }

    // Previsão baseada em sintomas
    if (symptoms.pain.level > 6) {
      predictions.push({
        type: "symptoms",
        message: "Dor alta ontem",
        impact: "Pode continuar com dor moderada hoje",
        probability: 0.7,
      });
    }

    // Previsão combinada
    const overallPrediction = this._combinePredictions(predictions);

    return {
      predictions: predictions,
      overall: overallPrediction,
      suggestions: this._generateSuggestions(predictions, userData),
    };
  }

  /**
   * Previsão para amanhã
   */
  _predictTomorrow(routine, effort, symptoms, userData) {
    // Previsão mais conservadora para amanhã
    const predictions = [];

    // Baseado na rotina esperada
    const expectedRoutine = userData.daily_routine || {};
    if (expectedRoutine.work?.intensity === "high") {
      predictions.push({
        type: "routine",
        message: "Dia de trabalho intenso previsto",
        impact: "Pode sentir mais fadiga amanhã",
        probability: 0.5,
      });
    }

    return {
      predictions: predictions,
      overall: "Previsão baseada na rotina esperada",
      suggestions: [],
    };
  }

  /**
   * Combina previsões em uma mensagem geral
   */
  _combinePredictions(predictions) {
    if (predictions.length === 0) {
      return "Dia provavelmente dentro do normal";
    }

    const highImpact = predictions.filter((p) => p.probability > 0.6);
    if (highImpact.length > 0) {
      return `Pode ser um dia ${
        highImpact.length > 1 ? "mais desafiador" : "com alguns desafios"
      }`;
    }

    return "Dia provavelmente tranquilo";
  }

  /**
   * Gera sugestões baseadas nas previsões
   */
  _generateSuggestions(predictions, userData) {
    const suggestions = [];

    const sleepPred = predictions.find((p) => p.type === "sleep");
    if (sleepPred && sleepPred.probability > 0.6) {
      suggestions.push("Tente descansar mais hoje, se possível");
    }

    const physicalPred = predictions.find((p) => p.type === "physical");
    if (physicalPred && physicalPred.probability > 0.6) {
      suggestions.push("Evite atividades físicas intensas hoje");
    }

    const mentalPred = predictions.find((p) => p.type === "mental");
    if (mentalPred && mentalPred.probability > 0.6) {
      suggestions.push("Tente fazer pausas regulares no trabalho");
    }

    return suggestions;
  }

  /**
   * Calcula confiança baseada na quantidade de dados
   */
  _calculateConfidence(dataPoints) {
    if (dataPoints >= 7) return 0.8;
    if (dataPoints >= 3) return 0.6;
    return 0.4;
  }

  /**
   * Estima impacto físico
   */
  _estimatePhysicalImpact(physicalEffort) {
    if (physicalEffort?.level === "high") return "high";
    if (physicalEffort?.level === "medium") return "medium";
    return "low";
  }

  /**
   * Estima impacto mental
   */
  _estimateMentalImpact(mentalEffort) {
    if (mentalEffort?.level === "high") return "high";
    if (mentalEffort?.level === "medium") return "medium";
    return "low";
  }

  /**
   * Estima impacto combinado
   */
  _estimateCombinedImpact(habits) {
    const physical = this._estimatePhysicalImpact(habits.physicalEffort);
    const mental = this._estimateMentalImpact(habits.mentalEffort);

    if (physical === "high" && mental === "high") return "very_high";
    if (physical === "high" || mental === "high") return "high";
    if (physical === "medium" && mental === "medium") return "medium";
    return "low";
  }

  /**
   * Calcula tendência (melhorando, piorando, estável)
   */
  _calculateTrend(values) {
    if (values.length < 2) return "stable";

    const recent = values.slice(-3);
    const older = values.slice(0, -3);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (recentAvg > olderAvg + 1) return "improving";
    if (recentAvg < olderAvg - 1) return "worsening";
    return "stable";
  }

  /**
   * Extrai nível médio de dor
   */
  _extractAveragePain(conversations) {
    const painLevels = conversations
      .filter((c) => c.pain_level !== null)
      .map((c) => c.pain_level);

    if (painLevels.length === 0) return null;
    return painLevels.reduce((a, b) => a + b, 0) / painLevels.length;
  }

  /**
   * Extrai nível médio de energia
   */
  _extractAverageEnergy(conversations) {
    const energyLevels = conversations
      .filter((c) => c.energy_level !== null)
      .map((c) => c.energy_level);

    if (energyLevels.length === 0) return null;
    return energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length;
  }

  /**
   * Extrai nível médio de humor
   */
  _extractAverageMood(conversations) {
    const moodLevels = conversations
      .filter((c) => c.mood_level !== null)
      .map((c) => c.mood_level);

    if (moodLevels.length === 0) return null;
    return moodLevels.reduce((a, b) => a + b, 0) / moodLevels.length;
  }

  /**
   * Extrai sintomas mencionados
   */
  _extractSymptoms(conversations) {
    const symptoms = new Set();
    conversations.forEach((c) => {
      if (c.symptoms_mentioned) {
        c.symptoms_mentioned.forEach((s) => symptoms.add(s));
      }
    });
    return Array.from(symptoms);
  }
}

module.exports = new PredictiveAnalysis();
