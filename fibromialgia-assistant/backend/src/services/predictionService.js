const { openai } = require("../config/openai");
const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const claude = require("../config/claude");

/**
 * Analisa padrões nos sintomas do usuário
 * @param {string} userId - ID do usuário
 * @param {number} days - Número de dias para análise
 * @returns {Promise<Object>} Análise de padrões
 */
async function analyzePatterns(userId, days = 30) {
  try {
    // Busca interações dos últimos dias
    const { data: interactions, error } = await supabase
      .from("interactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "symptom_registration")
      .gte(
        "created_at",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    if (!interactions.length) {
      return {
        patterns: [],
        insights: "Dados insuficientes para análise de padrões",
        confidence: 0,
      };
    }

    // Prepara dados para análise
    const symptomsData = interactions.map((interaction) => ({
      date: interaction.created_at,
      entities: interaction.entities,
    }));

    // Usa OpenAI para análise de padrões
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Analise os padrões nos registros de sintomas de fibromialgia.
          Identifique:
          - Padrões temporais (horários, dias da semana)
          - Gatilhos comuns (atividades, clima, etc)
          - Correlações entre sintomas
          - Tendências de melhora/piora
          
          Retorne um objeto JSON com:
          - patterns: lista de padrões identificados
          - insights: observações relevantes
          - confidence: nível de confiança (0-1)`,
        },
        {
          role: "user",
          content: `Dados de sintomas:
          ${JSON.stringify(symptomsData, null, 2)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch (parseError) {
      logger.warn("Erro ao fazer parse da análise:", parseError);
      return {
        patterns: [],
        insights: "Erro ao analisar padrões",
        confidence: 0,
      };
    }
  } catch (error) {
    logger.error("Erro ao analisar padrões:", error);
    throw error;
  }
}

/**
 * Gera previsão de sintomas
 * @param {string} userId - ID do usuário
 * @param {Object} currentData - Dados atuais
 * @returns {Promise<Object>} Previsão gerada
 */
async function generatePrediction(userId, currentData) {
  try {
    // Busca análise de padrões
    const patterns = await analyzePatterns(userId);

    // Gera previsão usando OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Gere uma previsão de sintomas baseada em:
          - Padrões históricos
          - Dados atuais
          - Fatores externos
          
          Retorne um objeto JSON com:
          - prediction: previsão para próximos dias
          - factors: fatores considerados
          - recommendations: recomendações
          - confidence: nível de confiança (0-1)`,
        },
        {
          role: "user",
          content: `Padrões identificados:
          ${JSON.stringify(patterns, null, 2)}
          
          Dados atuais:
          ${JSON.stringify(currentData, null, 2)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch (parseError) {
      logger.warn("Erro ao fazer parse da previsão:", parseError);
      return {
        prediction: "Não foi possível gerar previsão",
        factors: [],
        recommendations: [],
        confidence: 0,
      };
    }
  } catch (error) {
    logger.error("Erro ao gerar previsão:", error);
    throw error;
  }
}

/**
 * Registra uma previsão
 * @param {string} userId - ID do usuário
 * @param {Object} prediction - Dados da previsão
 * @returns {Promise<Object>} Previsão registrada
 */
async function registerPrediction(userId, prediction) {
  try {
    const { data, error } = await supabase
      .from("predictions")
      .insert([
        {
          user_id: userId,
          prediction_data: prediction,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Erro ao registrar previsão:", error);
    throw error;
  }
}

/**
 * Busca previsões do usuário
 * @param {string} userId - ID do usuário
 * @param {number} limit - Limite de registros
 * @returns {Promise<Array>} Lista de previsões
 */
async function getUserPredictions(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Erro ao buscar previsões do usuário:", error);
    throw error;
  }
}

/**
 * Gera uma previsão para o dia seguinte com base nos dados históricos
 */
async function generateDailyPrediction(userId) {
  try {
    // Obter dados históricos de sintomas
    const recentSymptoms = await getRecentSymptoms(userId, 14); // últimos 14 dias

    // Obter dados de interações recentes
    const recentInteractions = await getRecentInteractions(userId, 10);

    // Obter dados coletivos de usuários similares
    const collectiveData = await getCollectiveInsights(userId);

    // Preparar dados para o modelo preditivo
    const predictionData = {
      recentSymptoms,
      recentInteractions,
      collectiveData,
    };

    // Gerar previsão usando Claude
    const prediction = await predictWithAI(predictionData);

    // Salvar previsão no banco de dados
    await savePrediction({
      user_id: userId,
      prediction_date: new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split("T")[0],
      predicted_pain_level: prediction.painLevel,
      predicted_fatigue_level: prediction.fatigueLevel,
      predicted_sleep_quality: prediction.sleepQuality,
      predicted_mood_level: prediction.moodLevel,
      recommendations: prediction.recommendations,
      factors: prediction.factors,
      raw_prediction_data: prediction,
    });

    return prediction;
  } catch (error) {
    logger.error("Erro ao gerar previsão:", error);
    throw error;
  }
}

/**
 * Obtém sintomas recentes do usuário
 */
async function getRecentSymptoms(userId, days) {
  try {
    const { data, error } = await supabase
      .from("symptoms")
      .select("*")
      .eq("user_id", userId)
      .gte(
        "date",
        new Date(new Date().setDate(new Date().getDate() - days)).toISOString()
      )
      .order("date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao buscar sintomas recentes:", error);
    throw error;
  }
}

/**
 * Obtém interações recentes do usuário
 */
async function getRecentInteractions(userId, limit) {
  try {
    const { data, error } = await supabase
      .from("interactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao buscar interações recentes:", error);
    throw error;
  }
}

/**
 * Obtém insights coletivos de usuários similares
 */
async function getCollectiveInsights(userId) {
  try {
    // Obter perfil do usuário
    const userProfile = await getUserProfile(userId);

    // Encontrar usuários similares
    const similarUsers = await findSimilarUsers(userProfile);

    // Agregar dados dos usuários similares
    const collectiveData = await aggregateDataFromUsers(similarUsers);

    return collectiveData;
  } catch (error) {
    logger.error("Erro ao obter insights coletivos:", error);
    return {}; // Retornar objeto vazio em caso de erro
  }
}

/**
 * Obtém o perfil do usuário
 */
async function getUserProfile(userId) {
  try {
    const symptoms = await getRecentSymptoms(userId, 30);

    // Calcular médias
    const avgPain =
      symptoms.reduce((sum, s) => sum + s.pain_level, 0) / symptoms.length;
    const avgFatigue =
      symptoms.reduce((sum, s) => sum + s.fatigue_level, 0) / symptoms.length;
    const avgSleep =
      symptoms.reduce((sum, s) => sum + s.sleep_quality, 0) / symptoms.length;
    const avgMood =
      symptoms.reduce((sum, s) => sum + s.mood_level, 0) / symptoms.length;

    // Identificar padrões
    const commonActivities = identifyCommonItems(
      symptoms.map((s) => s.activities || [])
    );
    const commonWeather = identifyCommonItems(
      symptoms.map((s) => s.weather || "")
    );

    return {
      userId,
      avgPain,
      avgFatigue,
      avgSleep,
      avgMood,
      commonActivities,
      commonWeather,
      sampleSize: symptoms.length,
    };
  } catch (error) {
    logger.error("Erro ao obter perfil do usuário:", error);
    throw error;
  }
}

/**
 * Identifica itens comuns em uma lista
 */
function identifyCommonItems(items) {
  const flatItems = items.flat();
  const counts = {};

  flatItems.forEach((item) => {
    counts[item] = (counts[item] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => entry[0]);
}

/**
 * Encontra usuários com perfil similar
 */
async function findSimilarUsers(profile) {
  try {
    const { data, error } = await supabase.rpc("find_similar_users", {
      p_user_id: profile.userId,
      p_pain_threshold: 1.5,
      p_fatigue_threshold: 1.5,
      p_sleep_threshold: 1.5,
      p_mood_threshold: 1.5,
      p_limit: 20,
    });

    if (error) throw error;
    return data.map((user) => user.id);
  } catch (error) {
    logger.error("Erro ao encontrar usuários similares:", error);
    return [];
  }
}

/**
 * Agrega dados de um grupo de usuários
 */
async function aggregateDataFromUsers(userIds) {
  try {
    if (userIds.length === 0) return {};

    const { data, error } = await supabase.rpc("aggregate_user_symptoms", {
      p_user_ids: userIds,
      p_days: 30,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao agregar dados dos usuários:", error);
    return {};
  }
}

/**
 * Usa IA para gerar previsão com base nos dados
 */
async function predictWithAI(data) {
  try {
    const response = await claude.post("/v1/messages", {
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `Você é um sistema preditivo especializado em fibromialgia.
          Com base nos dados históricos de sintomas e interações do usuário, bem como dados coletivos de usuários similares, gere uma previsão para o dia seguinte.
          A previsão deve incluir níveis esperados de dor, fadiga, qualidade do sono e humor (escala 1-10), fatores que podem influenciar esses níveis, e recomendações personalizadas.
          Retorne um JSON com:
          - painLevel: nível de dor previsto (1-10)
          - fatigueLevel: nível de fadiga previsto (1-10)
          - sleepQuality: qualidade do sono prevista (1-10)
          - moodLevel: nível de humor previsto (1-10)
          - recommendations: lista de recomendações personalizadas
          - factors: fatores que podem influenciar os níveis`,
        },
        {
          role: "user",
          content: JSON.stringify(data),
        },
      ],
    });

    const prediction = JSON.parse(response.data.content[0].text);

    logger.info("Previsão gerada:", {
      prediction,
    });

    return prediction;
  } catch (error) {
    logger.error("Erro na previsão com IA:", error);

    // Fallback para OpenAI em caso de erro
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `Você é um sistema preditivo especializado em fibromialgia.
            Gere uma previsão para o dia seguinte com base nos dados fornecidos.
            Retorne um JSON com os níveis previstos (1-10) e recomendações.`,
          },
          {
            role: "user",
            content: JSON.stringify(data),
          },
        ],
        response_format: { type: "json_object" },
      });

      const prediction = JSON.parse(completion.choices[0].message.content);

      logger.info("Previsão gerada (fallback):", {
        prediction,
      });

      return prediction;
    } catch (fallbackError) {
      logger.error("Erro no fallback de previsão:", fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Salva a previsão no banco de dados
 */
async function savePrediction(predictionData) {
  try {
    const { data, error } = await supabase
      .from("predictions")
      .insert([predictionData])
      .select()
      .single();

    if (error) throw error;

    logger.info("Previsão salva:", {
      predictionId: data.id,
      userId: predictionData.user_id,
    });

    return data;
  } catch (error) {
    logger.error("Erro ao salvar previsão:", error);
    throw error;
  }
}

/**
 * Avalia a precisão das previsões anteriores
 */
async function evaluatePredictionAccuracy(userId) {
  try {
    const predictions = await getRecentPredictions(userId, 30);
    const actualSymptoms = await getRecentSymptoms(userId, 30);

    // Mapear previsões com dados reais do mesmo dia
    const matchedData = predictions
      .map((prediction) => {
        const actualData = actualSymptoms.find(
          (s) => s.date.split("T")[0] === prediction.prediction_date
        );

        if (!actualData) return null;

        return {
          prediction,
          actual: actualData,
          accuracy: calculateAccuracy(prediction, actualData),
        };
      })
      .filter((item) => item !== null);

    // Calcular métricas gerais
    const overallAccuracy =
      matchedData.reduce((sum, item) => sum + item.accuracy, 0) /
      matchedData.length;

    return {
      overallAccuracy,
      sampleSize: matchedData.length,
      detailedResults: matchedData,
    };
  } catch (error) {
    logger.error("Erro ao avaliar precisão das previsões:", error);
    throw error;
  }
}

/**
 * Obtém previsões recentes do usuário
 */
async function getRecentPredictions(userId, days) {
  try {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId)
      .gte(
        "prediction_date",
        new Date(new Date().setDate(new Date().getDate() - days))
          .toISOString()
          .split("T")[0]
      )
      .order("prediction_date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao buscar previsões recentes:", error);
    throw error;
  }
}

/**
 * Calcula a precisão entre previsão e dados reais
 */
function calculateAccuracy(prediction, actual) {
  const painDiff = Math.abs(
    prediction.predicted_pain_level - actual.pain_level
  );
  const fatigueDiff = Math.abs(
    prediction.predicted_fatigue_level - actual.fatigue_level
  );
  const sleepDiff = Math.abs(
    prediction.predicted_sleep_quality - actual.sleep_quality
  );
  const moodDiff = Math.abs(
    prediction.predicted_mood_level - actual.mood_level
  );

  // Calcular diferença média (escala 0-10)
  const avgDiff = (painDiff + fatigueDiff + sleepDiff + moodDiff) / 4;

  // Converter para precisão (0-1)
  return Math.max(0, 1 - avgDiff / 10);
}

module.exports = {
  analyzePatterns,
  generatePrediction,
  registerPrediction,
  getUserPredictions,
  generateDailyPrediction,
  evaluatePredictionAccuracy,
  getRecentPredictions,
};
