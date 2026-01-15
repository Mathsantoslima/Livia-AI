/**
 * =========================================
 * AGENDADOR DE MENSAGENS DIÁRIAS
 * =========================================
 * 
 * Envia mensagens automáticas às 08:00 AM
 * para cada usuário ativo
 */

const cron = require("node-cron");
const logger = require("../utils/logger");
const { supabase } = require("../config/supabase");
const predictiveAnalysis = require("./predictiveAnalysis");
const globalLearning = require("./globalLearning");
const { getAIInfrastructure } = require("../ai-infra/index");

class DailyScheduler {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  /**
   * Inicia o scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn("[DailyScheduler] Já está rodando");
      return;
    }

    // Agendar para 08:00 AM todos os dias (horário de São Paulo)
    // Formato: segundo minuto hora dia mês dia-da-semana
    // 0 0 8 * * * = 08:00:00 todos os dias
    this.job = cron.schedule("0 0 8 * * *", async () => {
      await this.sendDailyMessages();
    }, {
      timezone: "America/Sao_Paulo",
    });

    // Agendar aprendizado global para 02:00 AM (horário de menor uso)
    // Executa diariamente para atualizar padrões coletivos
    this.globalLearningJob = cron.schedule("0 0 2 * * *", async () => {
      try {
        logger.info("[DailyScheduler] Iniciando aprendizado global...");
        await globalLearning.updateGlobalPatterns();
        logger.info("[DailyScheduler] Aprendizado global concluído");
      } catch (error) {
        logger.error("[DailyScheduler] Erro no aprendizado global:", error);
      }
    }, {
      timezone: "America/Sao_Paulo",
    });

    this.isRunning = true;
    logger.info("[DailyScheduler] Iniciado - mensagens às 08:00 AM (horário de São Paulo)");
  }

  /**
   * Para o scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
    }
    if (this.globalLearningJob) {
      this.globalLearningJob.stop();
      this.globalLearningJob = null;
    }
    this.isRunning = false;
    logger.info("[DailyScheduler] Parado");
  }

  /**
   * Envia mensagens diárias para todos os usuários ativos
   */
  async sendDailyMessages() {
    try {
      logger.info("[DailyScheduler] Iniciando envio de mensagens diárias...");

      // Buscar todos os usuários ativos
      const { data: users, error } = await supabase
        .from("users_livia")
        .select("id, phone, name, nickname, timezone")
        .eq("status", "active")
        .not("phone", "is", null);

      if (error) {
        logger.error("[DailyScheduler] Erro ao buscar usuários:", error);
        return;
      }

      if (!users || users.length === 0) {
        logger.info("[DailyScheduler] Nenhum usuário ativo encontrado");
        return;
      }

      logger.info(`[DailyScheduler] Enviando mensagens para ${users.length} usuários`);

      // Obter infraestrutura de IA
      const aiInfra = getAIInfrastructure();
      const liviaAgent = aiInfra.getAgent("Livia");
      const whatsappChannel = aiInfra.getChannel("whatsapp");

      if (!liviaAgent || !whatsappChannel) {
        logger.error("[DailyScheduler] Agente ou canal não encontrado");
        return;
      }

      // Enviar mensagem para cada usuário
      for (const user of users) {
        try {
          await this.sendDailyMessageToUser(user, liviaAgent, whatsappChannel);
          // Delay entre mensagens para não sobrecarregar
          await this._delay(2000);
        } catch (userError) {
          logger.error(
            `[DailyScheduler] Erro ao enviar mensagem para ${user.phone}:`,
            userError
          );
        }
      }

      logger.info("[DailyScheduler] Envio de mensagens diárias concluído");
    } catch (error) {
      logger.error("[DailyScheduler] Erro ao enviar mensagens diárias:", error);
    }
  }

  /**
   * Envia mensagem diária para um usuário específico
   */
  async sendDailyMessageToUser(user, liviaAgent, whatsappChannel) {
    try {
      const userId = user.id;

      // Gerar análise preditiva
      const analysis = await predictiveAnalysis.analyzeDay(userId);

      if (analysis.error) {
        logger.warn(
          `[DailyScheduler] Não foi possível analisar usuário ${user.phone}:`,
          analysis.error
        );
        return;
      }

      // Gerar mensagem personalizada usando o agente
      const message = await this.generateDailyMessage(user, analysis, liviaAgent);

      // Enviar via WhatsApp
      await whatsappChannel.sendMessage(user.phone, message);

      logger.info(
        `[DailyScheduler] Mensagem diária enviada para ${user.phone}`
      );

      // Salvar no histórico
      await supabase.from("conversations_livia").insert({
        user_id: userId,
        phone: user.phone,
        content: message,
        message_type: "assistant",
        is_daily_report: true,
        sent_at: new Date().toISOString(),
        metadata: {
          type: "daily_message",
          analysis: analysis,
        },
      });
    } catch (error) {
      logger.error(
        `[DailyScheduler] Erro ao enviar mensagem diária para ${user.phone}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Gera mensagem diária personalizada
   */
  async generateDailyMessage(user, analysis, liviaAgent) {
    try {
      const name = user.name || user.nickname || "querido(a)";
      const today = analysis.today;
      const yesterday = analysis.yesterday;

      // Construir contexto para o agente
      const context = {
        type: "daily_message",
        analysis: analysis,
        user: user,
      };

      // Usar o agente para gerar mensagem mais natural
      const prompt = `Você é a Livia, assistente empática para pessoas com fibromialgia.

Hoje é ${new Date().toLocaleDateString("pt-BR")}.

Com base no dia de ontem de ${name}:
${this._formatAnalysisForPrompt(yesterday, today)}

Gere uma mensagem matinal (08:00 AM) que:
1. Referencie o dia anterior de forma natural
2. Use o histórico recente
3. Faça uma leitura preditiva leve sobre como provavelmente será o dia de hoje
4. Seja empática, calorosa e natural
5. Use frases curtas e quebradas
6. Não seja robótica
7. Não repita que está "anotando" ou "analisando"

A mensagem deve soar como uma amiga que entende de fibromialgia e está presente todos os dias.

IMPORTANTE: Não diagnostique, não prescreva medicamentos.`;

      const response = await liviaAgent.processMessage(user.id, prompt, context);

      return response.text || response.chunks?.join("\n") || this._generateFallbackMessage(name, today);
    } catch (error) {
      logger.error("[DailyScheduler] Erro ao gerar mensagem:", error);
      return this._generateFallbackMessage(user.name || user.nickname || "querido(a)", analysis.today);
    }
  }

  /**
   * Formata análise para prompt
   */
  _formatAnalysisForPrompt(yesterday, today) {
    let text = "";

    if (yesterday.routine) {
      text += `Rotina de ontem: sono ${yesterday.routine.sleep?.hours || "?"}h, qualidade ${yesterday.routine.sleep?.quality || "?"}\n`;
    }

    if (today.predictions && today.predictions.length > 0) {
      text += `Previsões para hoje:\n`;
      today.predictions.forEach((pred) => {
        text += `- ${pred.message}: ${pred.impact} (probabilidade: ${Math.round(pred.probability * 100)}%)\n`;
      });
    }

    if (today.suggestions && today.suggestions.length > 0) {
      text += `Sugestões: ${today.suggestions.join(", ")}\n`;
    }

    return text;
  }

  /**
   * Gera mensagem de fallback se o agente falhar
   */
  _generateFallbackMessage(name, today) {
    const messages = [
      `Bom dia, ${name}! ☀️`,
      "",
      "Como você está se sentindo hoje?",
    ];

    if (today.predictions && today.predictions.length > 0) {
      const firstPred = today.predictions[0];
      messages.push("");
      messages.push(`Com base no seu dia de ontem, ${firstPred.message.toLowerCase()}.`);
      messages.push(firstPred.impact);
    }

    if (today.suggestions && today.suggestions.length > 0) {
      messages.push("");
      messages.push(`💡 ${today.suggestions[0]}`);
    }

    return messages.join("\n");
  }

  /**
   * Delay helper
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new DailyScheduler();
