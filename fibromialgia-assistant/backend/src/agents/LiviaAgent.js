/**
 * =========================================
 * AGENTE LIVIA - CONFIGURAÇÃO ESPECÍFICA
 * =========================================
 *
 * Agente especializado em fibromialgia
 * Configuração de persona, regras e restrições
 */

const AgentBase = require("../core/AgentBase");
const MemoryManager = require("../core/MemoryManager");
const {
  buscarHistorico,
  salvarEvento,
  detectarPadroes,
  gerarResumoDiario,
  sugerirAcoes,
} = require("../core/tools");
const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const userOnboarding = require("../services/userOnboarding");

class LiviaAgent extends AgentBase {
  constructor(config = {}) {
    // Configuração específica da Livia
    const liviaConfig = {
      name: "Livia",

      // Providers - Múltiplos modelos de IA com fallback automático
      providers: config.providers || {
        gemini: {
          apiKey: process.env.GOOGLE_AI_API_KEY,
          model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest", // Usar flash-latest (versão estável)
        },
        chatgpt: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        },
        claude: {
          apiKey: process.env.CLAUDE_API_KEY,
          model: process.env.CLAUDE_MODEL || "claude-3-sonnet-20240229",
        },
      },

      // Provider preferido (opcional, deixe null para usar estratégia automática)
      preferredProvider: config.preferredProvider || null,

      // Estratégia de seleção: "fallback" (padrão), "round-robin", "best-performance"
      providerStrategy: config.providerStrategy || "fallback",

      // Ordem de fallback
      fallbackOrder: config.fallbackOrder || ["gemini", "chatgpt", "claude"],

      // Persona expandida e preditiva
      persona: `Você é Livia, uma assistente carinhosa e empática especializada em ajudar pessoas com fibromialgia.
Você age como um copiloto humano no dia a dia, oferecendo suporte emocional e prático.
Sua linguagem é natural, calorosa e próxima, como uma amiga que entende profundamente a condição.

Você tem memória completa de cada usuário e usa essa informação para:
- Referenciar eventos passados naturalmente ("Ontem você comentou que...")
- Evitar perguntas repetitivas
- Demonstrar que realmente se lembra da pessoa
- Fazer conexões entre rotina, esforço físico/mental e sintomas
- Trabalhar com probabilidades e preditividade, não certezas
- Ajudar psicologicamente a entender causas comportamentais e emocionais da fibromialgia

Você NUNCA diagnostica ou prescreve medicamentos.`,

      // Objetivos
      objectives: [
        "Ajudar usuários a identificar padrões em seus sintomas e rotina",
        "Melhorar a qualidade de vida através de sugestões baseadas em evidências",
        "Oferecer suporte emocional e validação",
        "Facilitar o autoconhecimento sobre a fibromialgia",
      ],

      // Restrições críticas
      restrictions: [
        "NUNCA diagnostique condições médicas",
        "NUNCA prescreva medicamentos ou tratamentos médicos",
        "Sempre sugira acompanhamento médico para questões de saúde",
        "Não faça promessas de cura ou resultados específicos",
        "Respeite os limites e escolhas do usuário",
      ],

      // Regras de conversa expandidas
      conversationRules: [
        "Quebre suas respostas em mensagens curtas (máximo 2 frases por bloco)",
        "Evite loops de confirmação desnecessários (não diga 'vou anotar isso' a menos que seja realmente necessário)",
        "Demonstre escuta ativa - reaja ao que a pessoa compartilha",
        "Varie o vocabulário, seja espontânea e natural",
        "Use o nome da pessoa quando souber",
        "Evite perguntas repetitivas - use o contexto para continuar a conversa",
        "Seja empática mas não exagerada",
        "SEMPRE referencie conversas passadas quando relevante - demonstre memória real",
        "Use informações da rotina do usuário para fazer conexões",
        "Relacione esforço físico/mental com sintomas quando apropriado",
        "Trabalhe com probabilidades ('pode ser que...', 'é provável que...')",
        "Nunca comece conversas do zero - sempre use o histórico",
        "Faça perguntas baseadas no que já sabe sobre a pessoa",
        "Seja preditiva quando fizer sentido ('Com base no seu dia de ontem...')",
      ],

      // Memory Manager
      memoryManager: config.memoryManager || new MemoryManager(),
    };

    super(liviaConfig);

    // Configurar estratégia do ProviderManager se especificado
    if (this.providerManager && config.providerStrategy) {
      this.providerManager.strategy = config.providerStrategy;
      this.providerManager.fallbackOrder = config.fallbackOrder || [
        "gemini",
        "chatgpt",
        "claude",
      ];
    }

    // Registrar tools específicas da Livia
    this._registerLiviaTools();
  }

  /**
   * Registra tools específicas da Livia
   */
  _registerLiviaTools() {
    // Tool: Buscar histórico
    this.registerTool(
      "buscar_historico",
      async (userId, limit = 10) => {
        return await buscarHistorico(userId, limit);
      },
      "Busca o histórico de conversas do usuário para entender o contexto"
    );

    // Tool: Salvar evento
    this.registerTool(
      "salvar_evento",
      async (userId, userMessage, agentResponse, context) => {
        return await salvarEvento(userId, userMessage, agentResponse, context);
      },
      "Salva uma conversa ou evento no banco de dados"
    );

    // Tool: Detectar padrões
    this.registerTool(
      "detectar_padroes",
      async (userId) => {
        return await detectarPadroes(userId);
      },
      "Analisa dados do usuário para detectar padrões em sintomas, sono, humor, etc"
    );

    // Tool: Gerar resumo diário
    this.registerTool(
      "gerar_resumo_diario",
      async (userId, date) => {
        return await gerarResumoDiario(userId, date);
      },
      "Gera um resumo do dia do usuário baseado em check-ins e conversas"
    );

    // Tool: Sugerir ações
    this.registerTool(
      "sugerir_acoes",
      async (userId, context) => {
        return await sugerirAcoes(userId, context);
      },
      "Gera sugestões de ações baseadas em padrões pessoais e insights coletivos"
    );

    logger.info("Tools da Livia registradas");
  }

  /**
   * Processa mensagem com lógica adicional da Livia
   * Usa contexto completo do usuário em todas as respostas
   * PRIMEIRA PRIORIDADE: Verificar se precisa de onboarding
   */
  async processMessage(userId, message, context = {}) {
    try {
      // Normalizar userId (phone) - remover caracteres não numéricos
      const normalizedUserId = userId.replace(/[^\d]/g, "");

      logger.info(
        `[Livia] Processando mensagem de userId: ${userId} (normalizado: ${normalizedUserId})`
      );

      // PRIMEIRO: Verificar se o usuário precisa de onboarding
      const onboardingStatus = await userOnboarding.checkOnboardingStatus(
        normalizedUserId
      );

      logger.info(`[Livia] Status de onboarding:`, {
        needsOnboarding: onboardingStatus.needsOnboarding,
        currentStep: onboardingStatus.currentStep,
        isNewUser: onboardingStatus.isNewUser,
      });

      if (onboardingStatus.needsOnboarding) {
        logger.info(
          `[Livia] Usuário ${normalizedUserId} precisa de onboarding. Passo: ${onboardingStatus.currentStep}`
        );

        // Se é mensagem de onboarding, processar resposta
        // Se não é a primeira mensagem (welcome), então é resposta de onboarding
        // Se é welcome, é a primeira mensagem - não processar como resposta ainda
        const isOnboardingResponse = onboardingStatus.currentStep !== "welcome";

        logger.info(
          `[Livia] É resposta de onboarding? ${isOnboardingResponse}, passo atual: ${onboardingStatus.currentStep}`
        );

        if (isOnboardingResponse) {
          // Atualizar perfil com a resposta
          await userOnboarding.updateUserProfile(
            normalizedUserId,
            onboardingStatus.currentStep,
            message
          );

          // Verificar próximo passo
          const nextStatus = await userOnboarding.checkOnboardingStatus(
            normalizedUserId
          );

          // Salvar resposta do usuário no histórico
          try {
            await this._saveOnboardingMessage(
              normalizedUserId,
              message,
              "user"
            );
          } catch (saveError) {
            logger.warn(
              "[Livia] Erro ao salvar resposta de onboarding:",
              saveError
            );
          }

          if (nextStatus.needsOnboarding) {
            // Ainda há mais perguntas
            const nextQuestion = userOnboarding.getOnboardingQuestion(
              nextStatus.currentStep,
              nextStatus.profile?.name || nextStatus.profile?.nickname
            );

            // Salvar próxima pergunta no histórico
            try {
              await this._saveOnboardingMessage(
                normalizedUserId,
                nextQuestion,
                "assistant"
              );
            } catch (saveError) {
              logger.warn(
                "[Livia] Erro ao salvar pergunta de onboarding:",
                saveError
              );
            }

            return {
              text: nextQuestion,
              chunks: [nextQuestion],
              type: "onboarding",
              onboardingStep: nextStatus.currentStep,
            };
          } else {
            // Onboarding completo
            await userOnboarding.completeOnboarding(normalizedUserId);
            const completionMessage =
              userOnboarding.getOnboardingQuestion(
                "symptoms",
                nextStatus.profile?.name,
                nextStatus.profile?.nickname
              );

            // Salvar mensagem de conclusão no histórico
            try {
              await this._saveOnboardingMessage(
                normalizedUserId,
                completionMessage,
                "assistant"
              );
            } catch (saveError) {
              logger.warn(
                "[Livia] Erro ao salvar conclusão de onboarding:",
                saveError
              );
            }

            return {
              text: completionMessage,
              chunks: [completionMessage],
              type: "onboarding_complete",
            };
          }
        } else {
          // Primeira mensagem - iniciar onboarding
          logger.info(
            `[Livia] Iniciando onboarding para usuário ${normalizedUserId}`
          );

          const welcomeMessage = userOnboarding.getOnboardingQuestion(
            onboardingStatus.currentStep,
            onboardingStatus.profile?.name || onboardingStatus.profile?.nickname
          );

          // Salvar mensagem de onboarding no histórico
          try {
            await this._saveOnboardingMessage(
              normalizedUserId,
              welcomeMessage,
              "assistant"
            );
          } catch (saveError) {
            logger.warn(
              "[Livia] Erro ao salvar mensagem de onboarding:",
              saveError
            );
          }

          return {
            text: welcomeMessage,
            chunks: [welcomeMessage],
            type: "onboarding",
            onboardingStep: onboardingStatus.currentStep,
          };
        }
      }

      // Usuário já tem perfil completo - processar normalmente
      // Carregar memória completa do usuário
      const userMemory = await this.memoryManager.getUserMemory(
        normalizedUserId
      );

      // Carregar contexto de conversa (últimas mensagens)
      const conversationContext =
        await this.memoryManager.getConversationContext(normalizedUserId, 10);

      // Carregar memória global para contexto
      const globalMemory = await this.memoryManager.getGlobalMemory(5);

      // Carregar análise preditiva se disponível
      const predictiveAnalysis = require("../services/predictiveAnalysis");
      let predictiveContext = null;
      try {
        predictiveContext = await predictiveAnalysis.analyzeDay(
          normalizedUserId
        );
      } catch (predError) {
        logger.warn(
          "[Livia] Erro ao carregar análise preditiva:",
          predError.message
        );
      }

      // Construir contexto completo
      context.userMemory = userMemory;
      context.conversationContext = conversationContext;
      context.globalInsights = globalMemory.insights;
      context.predictiveContext = predictiveContext;

      // Adicionar informações específicas para referências passadas
      context.pastEvents = this._extractPastEvents(
        conversationContext,
        userMemory
      );
      context.routineContext = this._buildRoutineContext(userMemory);
      context.behavioralContext = this._buildBehavioralContext(userMemory);

      // Processar com o AgentBase (que já usa o contexto)
      const response = await super.processMessage(
        normalizedUserId,
        message,
        context
      );

      // Pós-processamento específico da Livia
      response.chunks = this._optimizeChunksForLivia(
        response.chunks || [response.text]
      );

      return response;
    } catch (error) {
      logger.error("[Livia] Erro ao processar mensagem:", error);
      throw error;
    }
  }

  /**
   * Extrai eventos passados relevantes da conversa
   */
  _extractPastEvents(conversationContext, userMemory) {
    const events = [];

    // Buscar eventos das últimas conversas
    if (conversationContext && conversationContext.length > 0) {
      conversationContext.forEach((msg, index) => {
        if (msg.role === "user" && index < 5) {
          // Extrair informações relevantes das últimas 5 mensagens do usuário
          const content = msg.content.toLowerCase();

          // Detectar menções de sintomas, atividades, etc.
          if (content.includes("dor") || content.includes("dói")) {
            events.push({
              type: "symptom",
              content: "mencionou dor",
              timestamp: msg.timestamp,
            });
          }
          if (content.includes("cansado") || content.includes("fadiga")) {
            events.push({
              type: "symptom",
              content: "mencionou fadiga",
              timestamp: msg.timestamp,
            });
          }
          if (content.includes("trabalho") || content.includes("trabalhei")) {
            events.push({
              type: "activity",
              content: "mencionou trabalho",
              timestamp: msg.timestamp,
            });
          }
          if (content.includes("exercício") || content.includes("caminhada")) {
            events.push({
              type: "activity",
              content: "mencionou atividade física",
              timestamp: msg.timestamp,
            });
          }
        }
      });
    }

    return events.slice(0, 3); // Retornar apenas os 3 mais recentes
  }

  /**
   * Constrói contexto de rotina
   */
  _buildRoutineContext(userMemory) {
    const routine = userMemory.dailyRoutine || {};
    const habits = userMemory.habits || {};

    return {
      sleep: {
        hours: habits.sleep?.averageHours || null,
        quality: habits.sleep?.quality || null,
      },
      work: {
        hours: habits.work?.hoursPerDay || null,
        stressLevel: habits.work?.stressLevel || null,
      },
      physicalActivity: {
        level: habits.physicalEffort?.level || null,
        frequency: habits.physicalEffort?.frequency || null,
      },
      mentalActivity: {
        level: habits.mentalEffort?.level || null,
      },
    };
  }

  /**
   * Constrói contexto comportamental
   */
  _buildBehavioralContext(userMemory) {
    const profile = userMemory.behavioralProfile || {};

    return {
      communicationStyle: profile.communicationStyle || null,
      responsePattern: profile.responsePattern || null,
      emotionalTendency: profile.emotionalTendency || null,
      copingMechanisms: profile.copingMechanisms || [],
    };
  }

  /**
   * Salva mensagem de onboarding no histórico
   */
  async _saveOnboardingMessage(userId, content, messageType) {
    try {
      // Normalizar phone
      const normalizedPhone = userId.replace(/[^\d]/g, "");

      // Buscar usuário para obter ID UUID
      const { data: user } = await supabase
        .from("users_livia")
        .select("id")
        .eq("phone", normalizedPhone)
        .single();

      const userUuid = user?.id || null;

      const { error } = await supabase.from("conversations_livia").insert({
        user_id: userUuid,
        phone: normalizedPhone,
        content: content,
        message_type: messageType,
        sent_at: new Date().toISOString(),
        metadata: {
          type: "onboarding",
        },
      });

      if (error) {
        logger.warn("[Livia] Erro ao salvar mensagem de onboarding:", error);
      }
    } catch (error) {
      logger.error("[Livia] Erro ao salvar mensagem de onboarding:", error);
    }
  }

  /**
   * Otimiza chunks para o estilo da Livia (mensagens curtas e naturais)
   */
  _optimizeChunksForLivia(chunks) {
    const optimized = [];

    chunks.forEach((chunk) => {
      // Quebrar em frases
      const sentences = chunk
        .split(/[.!?]\s+/)
        .filter((s) => s.trim().length > 0);

      // Agrupar em blocos de 1-2 frases
      let currentBlock = "";
      for (const sentence of sentences) {
        if (currentBlock.length + sentence.length < 120) {
          currentBlock += (currentBlock ? ". " : "") + sentence;
        } else {
          if (currentBlock) {
            optimized.push(currentBlock.trim() + ".");
          }
          currentBlock = sentence;
        }
      }

      if (currentBlock) {
        optimized.push(currentBlock.trim() + ".");
      }
    });

    return optimized.length > 0 ? optimized : chunks;
  }

  /**
   * Verifica se deve fazer check-in diário
   */
  async shouldDoDailyCheckIn(userId) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const hour = new Date().getHours();

      // Verificar se já fez check-in hoje
      const { data: checkIn } = await supabase
        .from("daily_check_ins")
        .select("*")
        .eq("user_id", userId)
        .eq("check_in_date", today)
        .single();

      // Se não fez e é horário de check-in (20h)
      return !checkIn && hour >= 20;
    } catch (error) {
      logger.error("Erro ao verificar check-in:", error);
      return false;
    }
  }

  /**
   * Gera mensagem de check-in diário
   */
  async generateDailyCheckIn(userId) {
    try {
      const userMemory = await this.memoryManager.getUserMemory(userId);
      const name = userMemory.nickname || userMemory.name || "querido(a)";

      const messages = [
        `${name}, antes de encerrar o dia:`,
        "Como foi seu dia hoje no geral?",
        "Teve algo que te ajudou ou piorou os sintomas? Me conta. ❤️",
      ];

      return {
        text: messages.join("\n"),
        chunks: messages,
        type: "daily_checkin",
      };
    } catch (error) {
      logger.error("Erro ao gerar check-in:", error);
      return {
        text: "Como foi seu dia hoje?",
        chunks: ["Como foi seu dia hoje?"],
        type: "daily_checkin",
      };
    }
  }
}

module.exports = LiviaAgent;
