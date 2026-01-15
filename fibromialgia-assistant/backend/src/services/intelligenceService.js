const { openai } = require("../config/openai");
const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * Serviço de Inteligência Artificial Avançada para Livia
 * Combina aprendizado personalizado com inteligência coletiva
 */

// ==============================================
// ANÁLISE DE PADRÕES INDIVIDUAIS
// ==============================================

/**
 * Analisa padrões pessoais do usuário baseado no histórico
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Padrões identificados
 */
async function analyzePersonalPatterns(userId) {
  try {
    // Busca histórico dos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: checkIns, error } = await supabase
      .from("daily_check_ins")
      .select("*")
      .eq("user_id", userId)
      .gte("check_in_date", thirtyDaysAgo)
      .order("check_in_date", { ascending: true });

    if (error || !checkIns || checkIns.length < 7) {
      logger.info(`Dados insuficientes para análise de padrões: ${userId}`);
      return [];
    }

    const patterns = [];

    // 1. Padrão de ciclos de dor
    const painCycle = analyzePainCycles(checkIns);
    if (painCycle.confidence > 0.6) {
      patterns.push(painCycle);
    }

    // 2. Correlação sono x sintomas
    const sleepCorrelation = analyzeSleepSymptomCorrelation(checkIns);
    if (sleepCorrelation.confidence > 0.6) {
      patterns.push(sleepCorrelation);
    }

    // 3. Impacto de atividade física
    const activityImpact = analyzeActivityImpact(checkIns);
    if (activityImpact.confidence > 0.6) {
      patterns.push(activityImpact);
    }

    // 4. Padrões de humor
    const moodPatterns = analyzeMoodPatterns(checkIns);
    if (moodPatterns.confidence > 0.6) {
      patterns.push(moodPatterns);
    }

    // Salva padrões identificados no banco
    for (const pattern of patterns) {
      await saveUserPattern(userId, pattern);
    }

    logger.info(
      `${patterns.length} padrões identificados para usuário ${userId}`
    );
    return patterns;
  } catch (error) {
    logger.error("Erro ao analisar padrões pessoais:", error);
    return [];
  }
}

/**
 * Analisa ciclos de dor do usuário
 * @param {Array} checkIns - Check-ins do usuário
 * @returns {Object} Padrão identificado
 */
function analyzePainCycles(checkIns) {
  const painLevels = checkIns
    .map((c) => c.pain_level)
    .filter((p) => p !== null);

  if (painLevels.length < 7) {
    return { confidence: 0 };
  }

  // Detecta picos de dor (>= 6)
  const highPainDays = checkIns.filter((c) => c.pain_level >= 6);

  if (highPainDays.length < 2) {
    return { confidence: 0 };
  }

  // Calcula intervalos entre picos
  const intervals = [];
  for (let i = 1; i < highPainDays.length; i++) {
    const daysDiff = Math.floor(
      (new Date(highPainDays[i].check_in_date) -
        new Date(highPainDays[i - 1].check_in_date)) /
        (1000 * 60 * 60 * 24)
    );
    intervals.push(daysDiff);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) /
    intervals.length;

  // Confiança baseada na consistência dos intervalos
  const confidence = Math.max(0, 1 - variance / (avgInterval * avgInterval));

  return {
    pattern_type: "pain_cycle",
    pattern_name: "Ciclo de Dor",
    pattern_description: `Picos de dor ocorrem aproximadamente a cada ${Math.round(
      avgInterval
    )} dias`,
    confidence: confidence,
    pattern_data: {
      average_interval_days: avgInterval,
      variance: variance,
      high_pain_threshold: 6,
      total_episodes: highPainDays.length,
    },
  };
}

/**
 * Analisa correlação entre sono e sintomas
 * @param {Array} checkIns - Check-ins do usuário
 * @returns {Object} Padrão identificado
 */
function analyzeSleepSymptomCorrelation(checkIns) {
  const validData = checkIns.filter(
    (c) =>
      c.sleep_quality !== null &&
      c.pain_level !== null &&
      c.fatigue_level !== null
  );

  if (validData.length < 7) {
    return { confidence: 0 };
  }

  // Calcula correlação sono x dor
  const sleepPainCorr = calculateCorrelation(
    validData.map((c) => c.sleep_quality),
    validData.map((c) => c.pain_level)
  );

  // Calcula correlação sono x fadiga
  const sleepFatigueCorr = calculateCorrelation(
    validData.map((c) => c.sleep_quality),
    validData.map((c) => c.fatigue_level)
  );

  const strongCorrelation =
    Math.abs(sleepPainCorr) > 0.5 || Math.abs(sleepFatigueCorr) > 0.5;

  if (!strongCorrelation) {
    return { confidence: 0 };
  }

  return {
    pattern_type: "sleep_correlation",
    pattern_name: "Correlação Sono-Sintomas",
    pattern_description:
      sleepPainCorr < -0.5
        ? "Sono ruim está correlacionado com mais dor"
        : "Qualidade do sono afeta significativamente os sintomas",
    confidence: Math.max(Math.abs(sleepPainCorr), Math.abs(sleepFatigueCorr)),
    pattern_data: {
      sleep_pain_correlation: sleepPainCorr,
      sleep_fatigue_correlation: sleepFatigueCorr,
      sample_size: validData.length,
    },
  };
}

/**
 * Analisa impacto da atividade física
 * @param {Array} checkIns - Check-ins do usuário
 * @returns {Object} Padrão identificado
 */
function analyzeActivityImpact(checkIns) {
  const withActivity = checkIns.filter((c) => c.physical_activity === true);
  const withoutActivity = checkIns.filter((c) => c.physical_activity === false);

  if (withActivity.length < 3 || withoutActivity.length < 3) {
    return { confidence: 0 };
  }

  // Compara dor média nos dias com/sem atividade
  const avgPainWithActivity =
    withActivity
      .filter((c) => c.pain_level !== null)
      .reduce((sum, c) => sum + c.pain_level, 0) / withActivity.length;

  const avgPainWithoutActivity =
    withoutActivity
      .filter((c) => c.pain_level !== null)
      .reduce((sum, c) => sum + c.pain_level, 0) / withoutActivity.length;

  const painDifference = avgPainWithoutActivity - avgPainWithActivity;

  // Confiança baseada na diferença significativa
  const confidence = Math.min(Math.abs(painDifference) / 3, 1);

  if (confidence < 0.4) {
    return { confidence: 0 };
  }

  return {
    pattern_type: "activity_impact",
    pattern_name: "Impacto da Atividade Física",
    pattern_description:
      painDifference > 0
        ? "Atividade física ajuda a reduzir a dor"
        : "Atividade física pode estar aumentando os sintomas",
    confidence: confidence,
    pattern_data: {
      avg_pain_with_activity: avgPainWithActivity,
      avg_pain_without_activity: avgPainWithoutActivity,
      pain_difference: painDifference,
      activity_days: withActivity.length,
      rest_days: withoutActivity.length,
    },
  };
}

/**
 * Analisa padrões de humor
 * @param {Array} checkIns - Check-ins do usuário
 * @returns {Object} Padrão identificado
 */
function analyzeMoodPatterns(checkIns) {
  const validMood = checkIns.filter((c) => c.mood_level !== null);

  if (validMood.length < 7) {
    return { confidence: 0 };
  }

  // Detecta tendências de humor
  const moodTrend = calculateTrend(validMood.map((c) => c.mood_level));
  const avgMood =
    validMood.reduce((sum, c) => sum + c.mood_level, 0) / validMood.length;

  // Correlação humor x dor
  const moodPainCorr = calculateCorrelation(
    validMood.map((c) => c.mood_level),
    validMood.map((c) => c.pain_level || 0)
  );

  const hasSignificantPattern =
    Math.abs(moodTrend) > 0.1 || Math.abs(moodPainCorr) > 0.4;

  if (!hasSignificantPattern) {
    return { confidence: 0 };
  }

  return {
    pattern_type: "mood_pattern",
    pattern_name: "Padrão de Humor",
    pattern_description:
      moodTrend > 0.1
        ? "Humor tem melhorado gradualmente"
        : moodTrend < -0.1
        ? "Humor tem piorado gradualmente"
        : "Humor está correlacionado com níveis de dor",
    confidence: Math.max(Math.abs(moodTrend) * 5, Math.abs(moodPainCorr)),
    pattern_data: {
      trend: moodTrend,
      average_mood: avgMood,
      mood_pain_correlation: moodPainCorr,
      sample_size: validMood.length,
    },
  };
}

// ==============================================
// INTELIGÊNCIA COLETIVA
// ==============================================

/**
 * Analisa dados coletivos para gerar insights
 * @returns {Promise<Array>} Insights coletivos gerados
 */
async function generateCollectiveInsights() {
  try {
    logger.info("Iniciando análise de inteligência coletiva...");

    const insights = [];

    // 1. Análise de eficácia de intervenções
    const interventionInsights = await analyzeInterventionEffectiveness();
    insights.push(...interventionInsights);

    // 2. Correlações demográficas
    const demographicInsights = await analyzeDemographicCorrelations();
    insights.push(...demographicInsights);

    // 3. Padrões sazonais/temporais
    const temporalInsights = await analyzeTemporalPatterns();
    insights.push(...temporalInsights);

    // Salva insights no banco
    for (const insight of insights) {
      await saveCollectiveInsight(insight);
    }

    logger.info(`${insights.length} insights coletivos gerados`);
    return insights;
  } catch (error) {
    logger.error("Erro ao gerar insights coletivos:", error);
    return [];
  }
}

/**
 * Analisa eficácia de diferentes tipos de intervenção
 * @returns {Promise<Array>} Insights sobre eficácia
 */
async function analyzeInterventionEffectiveness() {
  try {
    const { data: suggestions, error } = await supabase
      .from("daily_suggestions")
      .select(
        `
        category,
        effectiveness_rating,
        user_tried,
        based_on_symptoms
      `
      )
      .not("effectiveness_rating", "is", null)
      .eq("user_tried", true);

    if (error || !suggestions || suggestions.length < 20) {
      return [];
    }

    // Agrupa por categoria
    const categories = {};
    suggestions.forEach((s) => {
      if (!categories[s.category]) {
        categories[s.category] = [];
      }
      categories[s.category].push(s.effectiveness_rating);
    });

    const insights = [];

    for (const [category, ratings] of Object.entries(categories)) {
      if (ratings.length >= 5) {
        const avgEffectiveness =
          ratings.reduce((a, b) => a + b, 0) / ratings.length;
        const successRate =
          ratings.filter((r) => r >= 4).length / ratings.length;

        insights.push({
          insight_type: "intervention_effectiveness",
          title: `Eficácia de ${category}`,
          description: `Intervenções de ${category} têm eficácia média de ${avgEffectiveness.toFixed(
            1
          )}/5`,
          evidence_strength: Math.min(ratings.length / 50, 1),
          sample_size: ratings.length,
          recommended_action:
            avgEffectiveness >= 3.5
              ? `Continuar recomendando estratégias de ${category}`
              : `Revisar e melhorar estratégias de ${category}`,
          action_category: category,
        });
      }
    }

    return insights;
  } catch (error) {
    logger.error("Erro ao analisar eficácia de intervenções:", error);
    return [];
  }
}

/**
 * Analisa correlações demográficas
 * @returns {Promise<Array>} Insights demográficos
 */
async function analyzeDemographicCorrelations() {
  try {
    // Por enquanto, análise simplificada
    // Em produção, isso seria mais sofisticado com ML

    const { data: userData, error } = await supabase
      .from("users_livia")
      .select(
        `
        age_range,
        diagnosis_time,
        id
      `
      )
      .not("age_range", "is", null);

    if (error || !userData || userData.length < 10) {
      return [];
    }

    // Análise básica de padrões por faixa etária
    const ageGroups = {};
    for (const user of userData) {
      if (!ageGroups[user.age_range]) {
        ageGroups[user.age_range] = [];
      }
      ageGroups[user.age_range].push(user.id);
    }

    const insights = [];

    // Gera insight básico sobre distribuição etária
    const mostCommonAge = Object.keys(ageGroups).reduce((a, b) =>
      ageGroups[a].length > ageGroups[b].length ? a : b
    );

    insights.push({
      insight_type: "demographic_pattern",
      title: "Distribuição Etária",
      description: `Faixa etária mais comum: ${mostCommonAge}`,
      evidence_strength: 0.7,
      sample_size: userData.length,
      recommended_action: `Desenvolver conteúdo específico para faixa ${mostCommonAge}`,
      action_category: "content_personalization",
    });

    return insights;
  } catch (error) {
    logger.error("Erro ao analisar correlações demográficas:", error);
    return [];
  }
}

/**
 * Analisa padrões temporais
 * @returns {Promise<Array>} Insights temporais
 */
async function analyzeTemporalPatterns() {
  try {
    const { data: checkIns, error } = await supabase
      .from("daily_check_ins")
      .select("check_in_date, pain_level, mood_level")
      .gte(
        "check_in_date",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .not("pain_level", "is", null);

    if (error || !checkIns || checkIns.length < 30) {
      return [];
    }

    // Analisa padrões por dia da semana
    const dayPatterns = {};
    checkIns.forEach((c) => {
      const dayOfWeek = new Date(c.check_in_date).getDay();
      if (!dayPatterns[dayOfWeek]) {
        dayPatterns[dayOfWeek] = { pain: [], mood: [] };
      }
      if (c.pain_level !== null) dayPatterns[dayOfWeek].pain.push(c.pain_level);
      if (c.mood_level !== null) dayPatterns[dayOfWeek].mood.push(c.mood_level);
    });

    const insights = [];

    // Encontra dia da semana com maior dor média
    let worstDay = null;
    let worstPain = 0;

    Object.keys(dayPatterns).forEach((day) => {
      const avgPain =
        dayPatterns[day].pain.reduce((a, b) => a + b, 0) /
        dayPatterns[day].pain.length;
      if (avgPain > worstPain) {
        worstPain = avgPain;
        worstDay = day;
      }
    });

    if (worstDay !== null) {
      const dayNames = [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
      ];

      insights.push({
        insight_type: "temporal_pattern",
        title: "Padrão Semanal de Dor",
        description: `${dayNames[worstDay]} é o dia com maior nível de dor em média`,
        evidence_strength: 0.6,
        sample_size: checkIns.length,
        recommended_action: `Focar estratégias preventivas para ${dayNames[worstDay]}`,
        action_category: "temporal_optimization",
      });
    }

    return insights;
  } catch (error) {
    logger.error("Erro ao analisar padrões temporais:", error);
    return [];
  }
}

// ==============================================
// GERAÇÃO DE SUGESTÕES INTELIGENTES
// ==============================================

/**
 * Gera sugestões usando IA avançada combinando dados pessoais e coletivos
 * @param {string} userId - ID do usuário
 * @param {Object} checkInData - Dados do check-in atual
 * @returns {Promise<Array>} Sugestões personalizadas
 */
async function generateIntelligentSuggestions(userId, checkInData) {
  try {
    // 1. Busca padrões pessoais do usuário
    const { data: userPatterns } = await supabase
      .from("user_patterns")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    // 2. Busca insights coletivos relevantes
    const { data: collectiveInsights } = await supabase
      .from("collective_insights")
      .select("*")
      .eq("is_active", true)
      .limit(5);

    // 3. Busca histórico recente do usuário
    const { data: recentHistory } = await supabase
      .from("daily_check_ins")
      .select("*")
      .eq("user_id", userId)
      .order("check_in_date", { ascending: false })
      .limit(7);

    // 4. Usa IA para gerar sugestões personalizadas
    const aiSuggestions = await generateAISuggestions({
      currentCheckIn: checkInData,
      userPatterns: userPatterns || [],
      collectiveInsights: collectiveInsights || [],
      recentHistory: recentHistory || [],
    });

    return aiSuggestions;
  } catch (error) {
    logger.error("Erro ao gerar sugestões inteligentes:", error);
    return [];
  }
}

/**
 * Usa OpenAI para gerar sugestões baseadas em todos os dados
 * @param {Object} context - Contexto completo
 * @returns {Promise<Array>} Sugestões geradas
 */
async function generateAISuggestions(context) {
  try {
    const prompt = `
Você é Livia, uma assistente especializada em fibromialgia. Analise os dados abaixo e gere sugestões personalizadas:

DADOS ATUAIS:
- Dor: ${context.currentCheckIn.pain_level}/10
- Fadiga: ${context.currentCheckIn.fatigue_level}/10
- Humor: ${context.currentCheckIn.mood_level}/10
- Sono: ${context.currentCheckIn.sleep_quality}/10
- Atividade física: ${context.currentCheckIn.physical_activity ? "Sim" : "Não"}

PADRÕES PESSOAIS IDENTIFICADOS:
${context.userPatterns
  .map((p) => `- ${p.pattern_name}: ${p.pattern_description}`)
  .join("\n")}

INSIGHTS COLETIVOS:
${context.collectiveInsights
  .map((i) => `- ${i.title}: ${i.description}`)
  .join("\n")}

HISTÓRICO RECENTE (últimos 7 dias):
${context.recentHistory
  .map(
    (h) =>
      `Data: ${h.check_in_date}, Dor: ${h.pain_level}, Humor: ${h.mood_level}`
  )
  .join("\n")}

Gere 2-3 sugestões específicas, práticas e baseadas em evidências. Cada sugestão deve ter:
1. Categoria (exercise, sleep, nutrition, relaxation, pain_management)
2. Texto da sugestão (máximo 80 caracteres)
3. Justificativa baseada nos dados

Responda em JSON:
{
  "suggestions": [
    {
      "category": "categoria",
      "text": "texto da sugestão",
      "reasoning": "justificativa baseada nos dados"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response.suggestions || [];
  } catch (error) {
    logger.error("Erro ao gerar sugestões com IA:", error);
    return [];
  }
}

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

/**
 * Calcula correlação entre duas variáveis
 * @param {Array} x - Primeira variável
 * @param {Array} y - Segunda variável
 * @returns {number} Coeficiente de correlação
 */
function calculateCorrelation(x, y) {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const meanX = x.reduce((a, b) => a + b) / n;
  const meanY = y.reduce((a, b) => a + b) / n;

  const numerator = x.reduce(
    (sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY),
    0
  );
  const denomX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0));
  const denomY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0));

  return denomX === 0 || denomY === 0 ? 0 : numerator / (denomX * denomY);
}

/**
 * Calcula tendência linear
 * @param {Array} values - Valores para análise
 * @returns {number} Coeficiente de tendência
 */
function calculateTrend(values) {
  const n = values.length;
  if (n < 2) return 0;

  const x = Array.from({ length: n }, (_, i) => i);
  return calculateCorrelation(x, values);
}

/**
 * Salva um padrão do usuário no banco
 * @param {string} userId - ID do usuário
 * @param {Object} pattern - Padrão identificado
 */
async function saveUserPattern(userId, pattern) {
  try {
    const { error } = await supabase.from("user_patterns").insert([
      {
        user_id: userId,
        ...pattern,
      },
    ]);

    if (error) {
      logger.error("Erro ao salvar padrão:", error);
    }
  } catch (error) {
    logger.error("Erro ao salvar padrão do usuário:", error);
  }
}

/**
 * Salva um insight coletivo no banco
 * @param {Object} insight - Insight coletivo
 */
async function saveCollectiveInsight(insight) {
  try {
    const { error } = await supabase
      .from("collective_insights")
      .insert([insight]);

    if (error) {
      logger.error("Erro ao salvar insight:", error);
    }
  } catch (error) {
    logger.error("Erro ao salvar insight coletivo:", error);
  }
}

module.exports = {
  analyzePersonalPatterns,
  generateCollectiveInsights,
  generateIntelligentSuggestions,
  generateAISuggestions,
};
