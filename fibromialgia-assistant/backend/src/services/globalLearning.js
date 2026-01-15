/**
 * =========================================
 * SISTEMA DE APRENDIZADO GLOBAL
 * =========================================
 * 
 * Aprende padrões coletivos anonimizados de todos os usuários
 * - Horários de maior interação
 * - Sintomas mais comuns
 * - Rotinas que mais impactam dores
 * - Padrões globais agregados
 */

const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

class GlobalLearning {
  /**
   * Analisa e atualiza padrões globais
   * Deve ser executado periodicamente (ex: diariamente)
   */
  async updateGlobalPatterns() {
    try {
      logger.info("[GlobalLearning] Iniciando análise de padrões globais...");

      // 1. Analisar horários de maior interação
      const interactionPatterns = await this._analyzeInteractionTimes();

      // 2. Analisar sintomas mais comuns
      const commonSymptoms = await this._analyzeCommonSymptoms();

      // 3. Analisar rotinas que mais impactam dores
      const routineImpact = await this._analyzeRoutineImpact();

      // 4. Analisar padrões de sintomas por dia da semana
      const weeklyPatterns = await this._analyzeWeeklyPatterns();

      // 5. Salvar insights coletivos
      await this._saveGlobalInsights({
        interactionPatterns,
        commonSymptoms,
        routineImpact,
        weeklyPatterns,
      });

      logger.info("[GlobalLearning] Análise de padrões globais concluída");
      
      return {
        interactionPatterns,
        commonSymptoms,
        routineImpact,
        weeklyPatterns,
      };
    } catch (error) {
      logger.error("[GlobalLearning] Erro ao atualizar padrões globais:", error);
      throw error;
    }
  }

  /**
   * Analisa horários de maior interação
   */
  async _analyzeInteractionTimes() {
    try {
      // Buscar todas as conversas dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: conversations } = await supabase
        .from("conversations_livia")
        .select("sent_at")
        .eq("message_type", "user")
        .gte("sent_at", thirtyDaysAgo.toISOString());

      if (!conversations || conversations.length === 0) {
        return { peakHours: [], totalInteractions: 0 };
      }

      // Agrupar por hora do dia
      const hourCounts = new Array(24).fill(0);
      conversations.forEach((conv) => {
        const hour = new Date(conv.sent_at).getHours();
        hourCounts[hour]++;
      });

      // Identificar horários de pico (top 3)
      const hourStats = hourCounts.map((count, hour) => ({
        hour,
        count,
        percentage: (count / conversations.length) * 100,
      }));

      hourStats.sort((a, b) => b.count - a.count);
      const peakHours = hourStats.slice(0, 3).map((h) => ({
        hour: h.hour,
        count: h.count,
        percentage: Math.round(h.percentage * 10) / 10,
      }));

      return {
        peakHours,
        totalInteractions: conversations.length,
        averagePerHour: Math.round(conversations.length / 24),
      };
    } catch (error) {
      logger.error("[GlobalLearning] Erro ao analisar horários:", error);
      return { peakHours: [], totalInteractions: 0 };
    }
  }

  /**
   * Analisa sintomas mais comuns
   */
  async _analyzeCommonSymptoms() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Buscar conversas com sintomas mencionados
      const { data: conversations } = await supabase
        .from("conversations_livia")
        .select("symptoms_mentioned, pain_level, energy_level, mood_level")
        .eq("message_type", "user")
        .gte("sent_at", thirtyDaysAgo.toISOString())
        .not("symptoms_mentioned", "is", null);

      if (!conversations || conversations.length === 0) {
        return { symptoms: [], averagePain: null, averageEnergy: null };
      }

      // Contar sintomas
      const symptomCounts = {};
      conversations.forEach((conv) => {
        if (conv.symptoms_mentioned && Array.isArray(conv.symptoms_mentioned)) {
          conv.symptoms_mentioned.forEach((symptom) => {
            symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
          });
        }
      });

      // Ordenar por frequência
      const symptoms = Object.entries(symptomCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / conversations.length) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

      // Calcular médias
      const painLevels = conversations
        .filter((c) => c.pain_level !== null)
        .map((c) => c.pain_level);
      const energyLevels = conversations
        .filter((c) => c.energy_level !== null)
        .map((c) => c.energy_level);

      return {
        symptoms,
        averagePain:
          painLevels.length > 0
            ? Math.round(
                (painLevels.reduce((a, b) => a + b, 0) / painLevels.length) * 10
              ) / 10
            : null,
        averageEnergy:
          energyLevels.length > 0
            ? Math.round(
                (energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length) *
                  10
              ) / 10
            : null,
        totalReports: conversations.length,
      };
    } catch (error) {
      logger.error("[GlobalLearning] Erro ao analisar sintomas:", error);
      return { symptoms: [], averagePain: null, averageEnergy: null };
    }
  }

  /**
   * Analisa rotinas que mais impactam dores
   */
  async _analyzeRoutineImpact() {
    try {
      // Buscar usuários com rotina e dados de dor
      const { data: users } = await supabase
        .from("users_livia")
        .select("id, daily_routine, habits, avg_pain_level")
        .not("daily_routine", "is", null);

      if (!users || users.length === 0) {
        return { patterns: [] };
      }

      const patterns = [];

      // Analisar padrão de sono
      const sleepPatterns = this._analyzeSleepImpact(users);
      if (sleepPatterns) patterns.push(sleepPatterns);

      // Analisar padrão de trabalho
      const workPatterns = this._analyzeWorkImpact(users);
      if (workPatterns) patterns.push(workPatterns);

      // Analisar padrão de atividade física
      const physicalPatterns = this._analyzePhysicalActivityImpact(users);
      if (physicalPatterns) patterns.push(physicalPatterns);

      return { patterns };
    } catch (error) {
      logger.error("[GlobalLearning] Erro ao analisar rotinas:", error);
      return { patterns: [] };
    }
  }

  /**
   * Analisa impacto do sono
   */
  _analyzeSleepImpact(users) {
    const sleepData = users
      .filter((u) => u.habits?.sleep?.averageHours && u.avg_pain_level)
      .map((u) => ({
        hours: u.habits.sleep.averageHours,
        quality: u.habits.sleep.quality,
        pain: u.avg_pain_level,
      }));

    if (sleepData.length < 5) return null;

    // Agrupar por horas de sono
    const byHours = {};
    sleepData.forEach((d) => {
      const range = d.hours < 6 ? "<6h" : d.hours < 8 ? "6-8h" : "≥8h";
      if (!byHours[range]) byHours[range] = [];
      byHours[range].push(d.pain);
    });

    const impact = {};
    Object.entries(byHours).forEach(([range, pains]) => {
      impact[range] = {
        averagePain:
          Math.round((pains.reduce((a, b) => a + b, 0) / pains.length) * 10) /
          10,
        count: pains.length,
      };
    });

    return {
      type: "sleep",
      impact,
      insight: this._generateSleepInsight(impact),
    };
  }

  /**
   * Analisa impacto do trabalho
   */
  _analyzeWorkImpact(users) {
    const workData = users
      .filter(
        (u) =>
          u.habits?.work?.hoursPerDay &&
          u.habits?.work?.stressLevel &&
          u.avg_pain_level
      )
      .map((u) => ({
        hours: u.habits.work.hoursPerDay,
        stress: u.habits.work.stressLevel,
        pain: u.avg_pain_level,
      }));

    if (workData.length < 5) return null;

    // Agrupar por nível de estresse
    const byStress = {};
    workData.forEach((d) => {
      if (!byStress[d.stress]) byStress[d.stress] = [];
      byStress[d.stress].push(d.pain);
    });

    const impact = {};
    Object.entries(byStress).forEach(([stress, pains]) => {
      impact[stress] = {
        averagePain:
          Math.round((pains.reduce((a, b) => a + b, 0) / pains.length) * 10) /
          10,
        count: pains.length,
      };
    });

    return {
      type: "work",
      impact,
      insight: this._generateWorkInsight(impact),
    };
  }

  /**
   * Analisa impacto de atividade física
   */
  _analyzePhysicalActivityImpact(users) {
    const physicalData = users
      .filter(
        (u) =>
          u.habits?.physicalEffort?.level &&
          u.habits?.physicalEffort?.frequency &&
          u.avg_pain_level
      )
      .map((u) => ({
        level: u.habits.physicalEffort.level,
        frequency: u.habits.physicalEffort.frequency,
        pain: u.avg_pain_level,
      }));

    if (physicalData.length < 5) return null;

    // Agrupar por nível
    const byLevel = {};
    physicalData.forEach((d) => {
      if (!byLevel[d.level]) byLevel[d.level] = [];
      byLevel[d.level].push(d.pain);
    });

    const impact = {};
    Object.entries(byLevel).forEach(([level, pains]) => {
      impact[level] = {
        averagePain:
          Math.round((pains.reduce((a, b) => a + b, 0) / pains.length) * 10) /
          10,
        count: pains.length,
      };
    });

    return {
      type: "physical_activity",
      impact,
      insight: this._generatePhysicalInsight(impact),
    };
  }

  /**
   * Analisa padrões semanais
   */
  async _analyzeWeeklyPatterns() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: conversations } = await supabase
        .from("conversations_livia")
        .select("sent_at, pain_level, energy_level")
        .eq("message_type", "user")
        .gte("sent_at", thirtyDaysAgo.toISOString());

      if (!conversations || conversations.length === 0) {
        return { patterns: [] };
      }

      // Agrupar por dia da semana
      const dayPatterns = {};
      conversations.forEach((conv) => {
        const day = new Date(conv.sent_at).getDay();
        const dayName = [
          "domingo",
          "segunda",
          "terça",
          "quarta",
          "quinta",
          "sexta",
          "sábado",
        ][day];

        if (!dayPatterns[dayName]) {
          dayPatterns[dayName] = { pain: [], energy: [], count: 0 };
        }

        if (conv.pain_level) dayPatterns[dayName].pain.push(conv.pain_level);
        if (conv.energy_level)
          dayPatterns[dayName].energy.push(conv.energy_level);
        dayPatterns[dayName].count++;
      });

      const patterns = Object.entries(dayPatterns).map(([day, data]) => ({
        day,
        averagePain:
          data.pain.length > 0
            ? Math.round(
                (data.pain.reduce((a, b) => a + b, 0) / data.pain.length) * 10
              ) / 10
            : null,
        averageEnergy:
          data.energy.length > 0
            ? Math.round(
                (data.energy.reduce((a, b) => a + b, 0) / data.energy.length) *
                  10
              ) / 10
            : null,
        count: data.count,
      }));

      return { patterns };
    } catch (error) {
      logger.error("[GlobalLearning] Erro ao analisar padrões semanais:", error);
      return { patterns: [] };
    }
  }

  /**
   * Gera insight sobre sono
   */
  _generateSleepInsight(impact) {
    const ranges = Object.keys(impact);
    if (ranges.length < 2) return null;

    const sorted = ranges.sort((a, b) => impact[b].averagePain - impact[a].averagePain);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];

    return `Usuários que dormem ${worst} tendem a relatar mais dor (média ${impact[worst].averagePain}) comparado a ${best} (média ${impact[best].averagePain})`;
  }

  /**
   * Gera insight sobre trabalho
   */
  _generateWorkInsight(impact) {
    const levels = Object.keys(impact);
    if (levels.length < 2) return null;

    const sorted = levels.sort((a, b) => impact[b].averagePain - impact[a].averagePain);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];

    return `Usuários com estresse ${worst} no trabalho tendem a relatar mais dor (média ${impact[worst].averagePain}) comparado a ${best} (média ${impact[best].averagePain})`;
  }

  /**
   * Gera insight sobre atividade física
   */
  _generatePhysicalInsight(impact) {
    const levels = Object.keys(impact);
    if (levels.length < 2) return null;

    // Atividade física moderada geralmente ajuda
    if (impact.medium && impact.low) {
      if (impact.medium.averagePain < impact.low.averagePain) {
        return "Atividade física moderada está associada a menos dor comparado a baixa atividade";
      }
    }

    return null;
  }

  /**
   * Salva insights globais no banco
   */
  async _saveGlobalInsights(data) {
    try {
      // Verificar se tabela existe, se não, criar (ou usar metadata)
      // Por enquanto, vamos salvar em uma tabela de insights coletivos
      // Se a tabela não existir, vamos usar o MemoryManager para armazenar

      const insights = [];

      // Insight de horários
      if (data.interactionPatterns.peakHours.length > 0) {
        insights.push({
          title: "Horários de Maior Interação",
          description: `Maioria das conversas ocorre entre ${data.interactionPatterns.peakHours
            .map((h) => `${h.hour}h`)
            .join(", ")}`,
          type: "interaction_pattern",
          data: data.interactionPatterns,
          evidence_strength: 0.7,
          is_active: true,
        });
      }

      // Insight de sintomas
      if (data.commonSymptoms.symptoms.length > 0) {
        insights.push({
          title: "Sintomas Mais Comuns",
          description: `Sintomas mais mencionados: ${data.commonSymptoms.symptoms
            .slice(0, 3)
            .map((s) => s.name)
            .join(", ")}`,
          type: "symptom_pattern",
          data: data.commonSymptoms,
          evidence_strength: 0.8,
          is_active: true,
        });
      }

      // Insight de rotina
      if (data.routineImpact.patterns.length > 0) {
        data.routineImpact.patterns.forEach((pattern) => {
          if (pattern.insight) {
            insights.push({
              title: `Impacto de ${pattern.type}`,
              description: pattern.insight,
              type: "routine_impact",
              data: pattern,
              evidence_strength: 0.6,
              is_active: true,
            });
          }
        });
      }

      // Salvar insights (usar tabela collective_insights se existir, senão apenas logar)
      logger.info("[GlobalLearning] Insights coletivos gerados:", insights.length);
      
      // Tentar salvar no banco (se a tabela existir)
      try {
        for (const insight of insights) {
          await supabase.from("collective_insights").upsert(
            {
              ...insight,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "title,type",
            }
          );
        }
      } catch (dbError) {
        logger.warn(
          "[GlobalLearning] Tabela collective_insights não existe ou erro ao salvar:",
          dbError.message
        );
      }

      return insights;
    } catch (error) {
      logger.error("[GlobalLearning] Erro ao salvar insights:", error);
      return [];
    }
  }
}

module.exports = new GlobalLearning();
