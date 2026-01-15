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
      // IMPORTANTE: Verificar mesmo se a mensagem for áudio
      // O áudio já foi transcrito antes de chegar aqui, então message contém o texto transcrito
      const onboardingStatus = await userOnboarding.checkOnboardingStatus(
        normalizedUserId
      );

      logger.info(`[Livia] Status de onboarding:`, {
        needsOnboarding: onboardingStatus.needsOnboarding,
        currentStep: onboardingStatus.currentStep,
        isNewUser: onboardingStatus.isNewUser,
        hasProfile: !!onboardingStatus.profile,
        hasError: !!onboardingStatus.error,
        messageType: context.mediaType || "text",
        hasProcessedContent: !!message && message.length > 0,
        messagePreview: message ? message.substring(0, 50) : "vazio",
        fullStatus: JSON.stringify(onboardingStatus).substring(0, 200),
      });

      // FORÇAR ONBOARDING se necessário - garantir que sempre execute
      // CRITICAL: Se não tem perfil OU precisa de onboarding OU houve erro → FORÇAR
      const shouldDoOnboarding =
        onboardingStatus.needsOnboarding === true ||
        onboardingStatus.error || // Se houve erro, fazer onboarding
        !onboardingStatus.profile || // Se não tem perfil, fazer onboarding
        onboardingStatus.currentStep; // Se tem passo definido, fazer onboarding

      logger.info(`[Livia] Deve fazer onboarding? ${shouldDoOnboarding}`, {
        needsOnboarding: onboardingStatus.needsOnboarding,
        hasError: !!onboardingStatus.error,
        hasProfile: !!onboardingStatus.profile,
        hasStep: !!onboardingStatus.currentStep,
      });

      if (shouldDoOnboarding) {
        logger.info(
          `[Livia] Usuário ${normalizedUserId} precisa de onboarding. Passo: ${
            onboardingStatus.currentStep || "welcome"
          }, motivo: ${
            onboardingStatus.needsOnboarding
              ? "needsOnboarding=true"
              : onboardingStatus.error
              ? "erro na verificação"
              : "sem perfil"
          }`
        );

        // Garantir que sempre há um passo definido
        const currentStep = onboardingStatus.currentStep || "welcome";

        // Se é mensagem de onboarding, processar resposta
        // Lógica:
        // - Se currentStep é "welcome" E é novo usuário (sem perfil) → primeira mensagem, enviar welcome
        // - Se currentStep é "welcome" mas já tem perfil → usuário está respondendo após welcome, tratar como "name"
        // - Se currentStep NÃO é "welcome" → usuário está respondendo a uma pergunta específica
        //
        // IMPORTANTE: Verificar se já existe conversa anterior para detectar se welcome já foi enviado
        const hasPreviousConversation = await this._hasPreviousConversation(
          normalizedUserId
        );
        const isFirstMessage =
          currentStep === "welcome" &&
          !onboardingStatus.profile &&
          !hasPreviousConversation;
        const isOnboardingResponse = !isFirstMessage;

        logger.info(
          `[Livia] É resposta de onboarding? ${isOnboardingResponse}, passo atual: ${currentStep}, é primeira mensagem: ${isFirstMessage}, tem perfil: ${!!onboardingStatus.profile}, tem conversa anterior: ${hasPreviousConversation}`
        );

        if (isOnboardingResponse) {
          // Determinar qual passo processar
          // CRITICAL: Se currentStep é "welcome" mas já tem conversa anterior, significa que está respondendo após welcome → processar como "name"
          // Isso evita loop quando usuário responde após welcome mas ainda não tem perfil salvo
          const stepToProcess =
            currentStep === "welcome" && (onboardingStatus.profile || hasPreviousConversation)
              ? "name"
              : currentStep === "welcome" 
              ? "name" // Se currentStep é welcome mas não é primeira mensagem, sempre processar como name
              : currentStep;

          logger.info(
            `[Livia] Processando resposta do passo: ${stepToProcess} (currentStep era: ${currentStep})`
          );

          // Atualizar perfil com a resposta
          await userOnboarding.updateUserProfile(
            normalizedUserId,
            stepToProcess,
            message
          );

          // Verificar próximo passo
          const nextStatus = await userOnboarding.checkOnboardingStatus(
            normalizedUserId
          );

          logger.info(
            `[Livia] Após atualizar perfil, próximo passo: ${nextStatus.currentStep}, ainda precisa onboarding: ${nextStatus.needsOnboarding}`
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
            const nextQuestionData = userOnboarding.getOnboardingQuestion(
              nextStatus.currentStep,
              nextStatus.profile?.name,
              nextStatus.profile?.nickname
            );

            // Verificar se retornou chunks ou texto simples
            let nextQuestion;
            let nextQuestionChunks;

            if (nextQuestionData && nextQuestionData.chunks) {
              nextQuestionChunks = nextQuestionData.chunks;
              nextQuestion = nextQuestionChunks.join("\n\n");
            } else {
              nextQuestion = nextQuestionData || "Próxima pergunta...";
              nextQuestionChunks = [nextQuestion];
            }

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
              chunks: nextQuestionChunks,
              type: "onboarding",
              onboardingStep: nextStatus.currentStep,
            };
          } else {
            // Onboarding completo
            await userOnboarding.completeOnboarding(normalizedUserId);
            const completionMessageData = userOnboarding.getOnboardingQuestion(
              "symptoms",
              nextStatus.profile?.name,
              nextStatus.profile?.nickname
            );

            // Verificar se retornou chunks ou texto simples
            let completionMessage;
            let completionChunks;

            if (completionMessageData && completionMessageData.chunks) {
              completionChunks = completionMessageData.chunks;
              completionMessage = completionChunks.join("\n\n");
            } else {
              completionMessage =
                completionMessageData || "Onboarding completo!";
              completionChunks = [completionMessage];
            }

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
              chunks: completionChunks,
              type: "onboarding_complete",
            };
          }
        } else {
          // Primeira mensagem - iniciar onboarding
          logger.info(
            `[Livia] Iniciando onboarding para usuário ${normalizedUserId}`
          );

          const welcomeMessageData = userOnboarding.getOnboardingQuestion(
            currentStep,
            onboardingStatus.profile?.name,
            onboardingStatus.profile?.nickname
          );

          // Verificar se retornou chunks ou texto simples
          let welcomeMessage;
          let welcomeChunks;

          if (welcomeMessageData && welcomeMessageData.chunks) {
            // Mensagem em blocos
            welcomeChunks = welcomeMessageData.chunks;
            welcomeMessage = welcomeChunks.join("\n\n");
          } else {
            // Mensagem simples (fallback)
            welcomeMessage =
              welcomeMessageData || "Olá! Vamos começar? Qual é o seu nome?";
            welcomeChunks = [welcomeMessage];
          }

          // Salvar mensagem completa de onboarding no histórico
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
            chunks: welcomeChunks,
            type: "onboarding",
            onboardingStep: currentStep,
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
      logger.info(
        `[Livia] Chamando AgentBase.processMessage para ${normalizedUserId}`
      );

      const response = await super.processMessage(
        normalizedUserId,
        message,
        context
      );

      logger.info(`[Livia] Resposta recebida do AgentBase:`, {
        hasText: !!response?.text,
        textLength: response?.text?.length || 0,
        hasChunks: !!response?.chunks,
        chunksCount: response?.chunks?.length || 0,
        type: response?.type,
      });

      if (!response || !response.text) {
        logger.error(
          "[Livia] Resposta do AgentBase está vazia ou inválida:",
          response
        );
        return {
          text: "Desculpe, tive um problema ao processar sua mensagem. Pode repetir?",
          chunks: [
            "Desculpe, tive um problema ao processar sua mensagem. Pode repetir?",
          ],
          type: "error",
        };
      }

      // Pós-processamento específico da Livia
      response.chunks = this._optimizeChunksForLivia(
        response.chunks || [response.text]
      );

      logger.info(
        `[Livia] Resposta final preparada: ${response.text.substring(0, 50)}...`
      );
      return response;
    } catch (error) {
      logger.error("[Livia] Erro ao processar mensagem:", error);
      logger.error("[Livia] Stack trace:", error.stack);

      // Retornar resposta de erro ao invés de lançar exceção
      return {
        text: "Desculpe, tive um problema técnico. Pode repetir?",
        chunks: ["Desculpe, tive um problema técnico. Pode repetir?"],
        type: "error",
        error: error.message,
      };
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
   * Verifica se usuário já tem conversa anterior (para detectar se welcome já foi enviado)
   */
  async _hasPreviousConversation(userId) {
    try {
      const normalizedPhone = userId.replace(/[^\d]/g, "");

      // Buscar usuário pelo phone
      const { data: user } = await supabase
        .from("users_livia")
        .select("id")
        .eq("phone", normalizedPhone)
        .single();

      if (!user) {
        return false;
      }

      // Verificar se há mensagens anteriores do assistente
      // O campo pode ser 'sender' ou 'message_type' dependendo da estrutura da tabela
      const { data: messages } = await supabase
        .from("conversations_livia")
        .select("id")
        .eq("user_id", user.id)
        .or("sender.eq.assistant,message_type.eq.assistant")
        .limit(1);

      return messages && messages.length > 0;
    } catch (error) {
      logger.warn("[Livia] Erro ao verificar conversa anterior:", error);
      return false; // Em caso de erro, assumir que não tem conversa anterior
    }
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
