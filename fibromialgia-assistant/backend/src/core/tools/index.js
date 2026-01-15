/**
 * =========================================
 * TOOLS - FERRAMENTAS DO AGENTE
 * =========================================
 * 
 * Tools que o agente pode usar para:
 * - Buscar informações
 * - Salvar dados
 * - Detectar padrões
 * - Gerar sugestões
 */

const { supabase } = require("../../config/supabase");
const logger = require("../../utils/logger");

/**
 * Tool: Buscar histórico do usuário
 */
async function buscarHistorico(userId, limit = 10) {
  try {
    const { data: messages, error } = await supabase
      .from("conversations_livia")
      .select("content, message_type, sent_at, intent, sentiment")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Erro ao buscar histórico:", error);
      return [];
    }

    return (messages || []).reverse();
  } catch (error) {
    logger.error("Erro na tool buscarHistorico:", error);
    return [];
  }
}

/**
 * Tool: Salvar evento/conversa
 */
async function salvarEvento(userId, userMessage, agentResponse, context = {}) {
  try {
    const timestamp = new Date().toISOString();

    // Salvar mensagem do usuário
    const { error: userError } = await supabase
      .from("conversations_livia")
      .insert({
        user_id: userId,
        content: userMessage,
        message_type: "user",
        sent_at: timestamp,
        intent: context.intent || null,
        sentiment: context.sentiment || null,
        metadata: context.metadata || {},
      });

    if (userError) {
      logger.error("Erro ao salvar mensagem do usuário:", userError);
    }

    // Salvar resposta do agente
    const { error: agentError } = await supabase
      .from("conversations_livia")
      .insert({
        user_id: userId,
        content: agentResponse,
        message_type: "assistant",
        sent_at: timestamp,
        metadata: {
          model: context.model || "gemini",
          tools_used: context.toolsUsed || [],
        },
      });

    if (agentError) {
      logger.error("Erro ao salvar resposta do agente:", agentError);
    }

    // Atualizar última interação do usuário
    await supabase
      .from("users_livia")
      .update({
        last_interaction: timestamp,
        ultimo_contato: timestamp,
      })
      .eq("id", userId);

    return { success: true };
  } catch (error) {
    logger.error("Erro na tool salvarEvento:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Tool: Detectar padrões do usuário
 */
async function detectarPadroes(userId) {
  try {
    // Buscar check-ins dos últimos 30 dias
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
      return [];
    }

    const patterns = [];

    // Detectar padrão de dor
    const painPattern = detectarPadraoDor(checkIns);
    if (painPattern) {
      patterns.push(painPattern);
    }

    // Detectar padrão de sono
    const sleepPattern = detectarPadraoSono(checkIns);
    if (sleepPattern) {
      patterns.push(sleepPattern);
    }

    // Detectar correlações
    const correlations = detectarCorrelacoes(checkIns);
    patterns.push(...correlations);

    return patterns;
  } catch (error) {
    logger.error("Erro na tool detectarPadroes:", error);
    return [];
  }
}

/**
 * Tool: Gerar resumo diário
 */
async function gerarResumoDiario(userId, date = null) {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Buscar check-in do dia
    const { data: checkIn } = await supabase
      .from("daily_check_ins")
      .select("*")
      .eq("user_id", userId)
      .eq("check_in_date", targetDate)
      .single();

    // Buscar mensagens do dia
    const { data: messages } = await supabase
      .from("conversations_livia")
      .select("*")
      .eq("user_id", userId)
      .gte("sent_at", `${targetDate}T00:00:00`)
      .lte("sent_at", `${targetDate}T23:59:59`);

    const summary = {
      date: targetDate,
      checkIn: checkIn || null,
      messagesCount: (messages || []).length,
      themes: extrairTemas(messages || []),
    };

    return summary;
  } catch (error) {
    logger.error("Erro na tool gerarResumoDiario:", error);
    return null;
  }
}

/**
 * Tool: Sugerir ações baseadas em evidência
 */
async function sugerirAcoes(userId, context = {}) {
  try {
    // Buscar padrões do usuário
    const { data: patterns } = await supabase
      .from("user_patterns")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("confidence", { ascending: false })
      .limit(3);

    // Buscar insights coletivos relevantes
    const { data: insights } = await supabase
      .from("collective_insights")
      .select("*")
      .eq("is_active", true)
      .order("evidence_strength", { ascending: false })
      .limit(3);

    // Gerar sugestões baseadas nos dados
    const suggestions = [];

    if (patterns && patterns.length > 0) {
      patterns.forEach((pattern) => {
        if (pattern.pattern_type === "pain_cycle") {
          suggestions.push({
            type: "preventive",
            text: "Baseado no seu padrão de dor, considere atividades preventivas hoje.",
            category: "pain_management",
          });
        }
      });
    }

    if (insights && insights.length > 0) {
      insights.forEach((insight) => {
        if (insight.recommended_action) {
          suggestions.push({
            type: "collective",
            text: insight.recommended_action,
            category: insight.action_category || "general",
          });
        }
      });
    }

    return suggestions;
  } catch (error) {
    logger.error("Erro na tool sugerirAcoes:", error);
    return [];
  }
}

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

function detectarPadraoDor(checkIns) {
  const painLevels = checkIns
    .map((c) => c.pain_level)
    .filter((p) => p !== null);

  if (painLevels.length < 7) {
    return null;
  }

  const avgPain = painLevels.reduce((a, b) => a + b, 0) / painLevels.length;
  const highPainDays = checkIns.filter((c) => c.pain_level >= 6).length;

  if (highPainDays >= 3) {
    return {
      type: "pain_pattern",
      description: `Dor média de ${avgPain.toFixed(1)}/10 nos últimos dias, com ${highPainDays} dias de dor intensa.`,
      confidence: Math.min(highPainDays / 7, 1),
    };
  }

  return null;
}

function detectarPadraoSono(checkIns) {
  const sleepData = checkIns
    .map((c) => c.sleep_quality)
    .filter((s) => s !== null);

  if (sleepData.length < 7) {
    return null;
  }

  const avgSleep = sleepData.reduce((a, b) => a + b, 0) / sleepData.length;
  const poorSleepDays = checkIns.filter((c) => c.sleep_quality <= 4).length;

  if (poorSleepDays >= 3 || avgSleep <= 4) {
    return {
      type: "sleep_pattern",
      description: `Qualidade média do sono: ${avgSleep.toFixed(1)}/10, com ${poorSleepDays} noites ruins.`,
      confidence: Math.min(poorSleepDays / 7, 1),
    };
  }

  return null;
}

function detectarCorrelacoes(checkIns) {
  const correlations = [];

  // Correlação sono x dor
  const validData = checkIns.filter(
    (c) => c.sleep_quality !== null && c.pain_level !== null
  );

  if (validData.length >= 7) {
    const sleepValues = validData.map((c) => c.sleep_quality);
    const painValues = validData.map((c) => c.pain_level);

    const correlation = calcularCorrelacao(sleepValues, painValues);

    if (Math.abs(correlation) > 0.5) {
      correlations.push({
        type: "correlation",
        description:
          correlation < 0
            ? "Sono ruim está correlacionado com mais dor"
            : "Sono melhor está correlacionado com menos dor",
        confidence: Math.abs(correlation),
        correlation_value: correlation,
      });
    }
  }

  return correlations;
}

function calcularCorrelacao(x, y) {
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

function extrairTemas(messages) {
  const themes = new Set();
  const keywords = {
    dor: ["dor", "doendo", "machuca"],
    fadiga: ["cansado", "fadiga", "exausto"],
    sono: ["sono", "insônia", "dormir"],
    humor: ["triste", "ansioso", "feliz"],
  };

  messages.forEach((msg) => {
    const content = (msg.content || "").toLowerCase();
    Object.keys(keywords).forEach((theme) => {
      if (keywords[theme].some((kw) => content.includes(kw))) {
        themes.add(theme);
      }
    });
  });

  return Array.from(themes);
}

module.exports = {
  buscarHistorico,
  salvarEvento,
  detectarPadroes,
  gerarResumoDiario,
  sugerirAcoes,
};
