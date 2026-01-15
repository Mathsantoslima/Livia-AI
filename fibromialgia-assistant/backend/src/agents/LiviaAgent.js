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
const contextMemory = require("../services/contextMemory");

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
          model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5-2025092",
        },
      },

      // Provider preferido (opcional, deixe null para usar estratégia automática)
      preferredProvider: config.preferredProvider || null,

      // Estratégia de seleção: "fallback" (padrão), "round-robin", "best-performance"
      providerStrategy: config.providerStrategy || "fallback",

      // Ordem de fallback
      fallbackOrder: config.fallbackOrder || ["gemini", "chatgpt", "claude"],

      // Persona HUMANIZADA - Livia como amiga real (conforme plano Fase 1)
      persona: `Você é a Livia, uma amiga que entende profundamente fibromialgia.

REGRAS DE OURO:
1. NUNCA comece com "Olá" ou "Oi" se o usuário já disse isso
2. SEMPRE conecte sua resposta ao que o usuário acabou de dizer
3. Use frases CURTAS e QUEBRADAS (como mensagens de WhatsApp reais)
4. Demonstre que LEMBRA do que foi conversado antes
5. Seja ESPECÍFICA, não genérica
6. EVITE: "entendo", "compreendo", "fico feliz", "estou aqui"
7. PREFIRA: reagir naturalmente, fazer perguntas específicas

CONTEXTO DO USUÁRIO:
{contextPrompt}

IMPORTANTE: Sua resposta deve parecer uma continuação natural da conversa, não um novo atendimento. O usuário deve sentir que você LEMBRA dele.`,

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

      // Regras de conversa HUMANIZADAS
      conversationRules: [
        "REGRA 1: Se o usuário disse 'Oi', NÃO responda 'Olá!' - reaja de forma diferente",
        "REGRA 2: SEMPRE mencione algo da conversa anterior ou do perfil do usuário",
        "REGRA 3: Máximo 2 frases por bloco de mensagem",
        "REGRA 4: PROIBIDO usar: 'entendo', 'compreendo', 'fico feliz', 'estou aqui'",
        "REGRA 5: Use o nome/apelido do usuário naturalmente (não force)",
        "REGRA 6: Faça perguntas ESPECÍFICAS baseadas no contexto",
        "REGRA 7: Se o usuário mencionou dor, pergunte ONDE ou QUANDO",
        "REGRA 8: Se o usuário mencionou trabalho, pergunte sobre o tipo de trabalho",
        "REGRA 9: Relacione sintomas com rotina quando possível",
        "REGRA 10: Seja preditiva ('Com base no que você me contou...')",
        "REGRA 11: NUNCA repita perguntas já feitas",
        "REGRA 12: Reaja naturalmente ao que a pessoa compartilha",
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

        // SOLUÇÃO DEFINITIVA ANTI-LOOP: Detectar primeira mensagem pela mensagem em si
        // Se a mensagem é um cumprimento genérico ("Oi", "Olá") E não há perfil, é primeira mensagem
        // Caso contrário, é uma resposta ao onboarding
        const normalizedMessage = message.trim().toLowerCase();
        const isGenericGreeting =
          /^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hi)$/i.test(
            normalizedMessage
          );
        const hasProfile = !!onboardingStatus.profile;
        // Se currentStep é null (erro no banco) ou "welcome", pode ser primeira mensagem
        const canBeFirstMessage = !currentStep || currentStep === "welcome";
        // É primeira mensagem se: é cumprimento genérico E não tem perfil E pode ser primeira mensagem
        const isFirstMessage =
          isGenericGreeting && !hasProfile && canBeFirstMessage;

        // Se NÃO é primeira mensagem, é uma resposta ao onboarding
        const isOnboardingResponse = !isFirstMessage;

        logger.info(
          `[Livia] Processando onboarding. currentStep: ${currentStep}, isGenericGreeting: ${isGenericGreeting}, hasProfile: ${hasProfile}, isFirstMessage: ${isFirstMessage}, isOnboardingResponse: ${isOnboardingResponse}`
        );

        if (isOnboardingResponse) {
          // Determinar qual passo processar
          let stepToProcess = currentStep;

          // CRITICAL: Se currentStep é "welcome" mas NÃO é primeira mensagem, usuário está respondendo → SEMPRE processar como "name"
          if (currentStep === "welcome" && !isFirstMessage) {
            stepToProcess = "name";
            logger.info(
              `[Livia] ✅ ANTI-LOOP: currentStep='welcome' mas não é primeira mensagem → processando como 'name'`
            );
          }

          logger.info(
            `[Livia] Processando resposta do passo: ${stepToProcess} (currentStep era: ${currentStep})`
          );

          // Atualizar perfil com a resposta
          try {
            logger.info(
              `[Livia] Chamando updateUserProfile para ${normalizedUserId}, passo: ${stepToProcess}, resposta: ${message.substring(
                0,
                50
              )}...`
            );
            await userOnboarding.updateUserProfile(
              normalizedUserId,
              stepToProcess,
              message
            );
            logger.info(
              `[Livia] updateUserProfile concluído com sucesso para ${normalizedUserId}`
            );
          } catch (updateError) {
            logger.error(
              `[Livia] ERRO ao atualizar perfil do usuário ${normalizedUserId}:`,
              updateError
            );
            logger.error(`[Livia] Stack trace do erro:`, updateError.stack);
            // Continuar mesmo com erro, tentar verificar próximo passo
          }

          // Verificar próximo passo
          let nextStatus;
          try {
            logger.info(
              `[Livia] Verificando próximo passo após atualizar perfil para ${normalizedUserId}`
            );
            nextStatus = await userOnboarding.checkOnboardingStatus(
              normalizedUserId
            );

            logger.info(
              `[Livia] Após atualizar perfil, próximo passo: ${nextStatus.currentStep}, ainda precisa onboarding: ${nextStatus.needsOnboarding}`
            );
          } catch (statusError) {
            logger.error(
              `[Livia] ERRO ao verificar próximo passo para ${normalizedUserId}:`,
              statusError
            );
            logger.error(`[Livia] Stack trace:`, statusError.stack);
            // Se falhar, assumir que ainda precisa onboarding e continuar no mesmo passo
            nextStatus = {
              needsOnboarding: true,
              currentStep:
                stepToProcess === "name" ? "nickname" : stepToProcess,
              profile: onboardingStatus.profile,
            };
          }

          // Garantir que nextStatus sempre tem um valor válido
          if (!nextStatus) {
            logger.error(
              `[Livia] CRÍTICO: nextStatus é undefined para ${normalizedUserId}. Usando fallback.`
            );
            nextStatus = {
              needsOnboarding: true,
              currentStep: stepToProcess === "name" ? "nickname" : "name",
              profile: onboardingStatus.profile || {},
            };
          }

          // CRITICAL: Garantir que currentStep nunca seja null/undefined quando needsOnboarding é true
          if (nextStatus.needsOnboarding && !nextStatus.currentStep) {
            logger.error(
              `[Livia] CRÍTICO: needsOnboarding=true mas currentStep é ${nextStatus.currentStep} para ${normalizedUserId}. Corrigindo.`
            );
            // Calcular próximo step baseado no step processado
            const calculatedNextStep =
              this._calculateNextStepFromCurrent(stepToProcess);
            nextStatus.currentStep = calculatedNextStep;
            logger.info(
              `[Livia] currentStep corrigido para: ${calculatedNextStep}`
            );
          }

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
            // #region agent log
            logger.info(
              `[DEBUG-H3-H4] ANTES getOnboardingQuestion: nextStatus.currentStep=${nextStatus.currentStep}, profileName=${nextStatus.profile?.name}, profileNickname=${nextStatus.profile?.nickname}, stepToProcess=${stepToProcess}`
            );
            // #endregion
            // Ainda há mais perguntas
            // CRITICAL: Usar preferred_name primeiro (nome que o usuário PREFERE ser chamado)
            const preferredName = nextStatus.profile?.preferred_name || nextStatus.profile?.nickname || nextStatus.profile?.name;
            const nextQuestionData = userOnboarding.getOnboardingQuestion(
              nextStatus.currentStep,
              nextStatus.profile?.name,
              preferredName // Passar preferred_name como nickname (nome preferido)
            );

            // #region agent log
            logger.info(
              `[DEBUG-H5] APOS getOnboardingQuestion: type=${typeof nextQuestionData}, hasChunks=${!!(
                nextQuestionData && nextQuestionData.chunks
              )}, data=${JSON.stringify(nextQuestionData).substring(0, 200)}`
            );
            // #endregion

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
            // CRITICAL: Usar preferred_name primeiro
            const preferredName = nextStatus.profile?.preferred_name || nextStatus.profile?.nickname || nextStatus.profile?.name;
            const completionMessageData = userOnboarding.getOnboardingQuestion(
              "complete",
              nextStatus.profile?.name,
              preferredName
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
            `[Livia] ✅ Primeira mensagem detectada para usuário ${normalizedUserId} (mensagem: "${message.substring(
              0,
              20
            )}...")`
          );

          // CRITICAL: Usar preferred_name primeiro (se existir)
          const preferredName = onboardingStatus.profile?.preferred_name || onboardingStatus.profile?.nickname;
          const welcomeMessageData = userOnboarding.getOnboardingQuestion(
            "welcome", // Sempre usar "welcome" para primeira mensagem
            onboardingStatus.profile?.name,
            preferredName
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

          // CRITICAL: Marcar onboarding_step = "welcome" no banco ANTES de enviar
          // Isso garante que na próxima mensagem, o sistema saberá que welcome foi enviado
          // e processará a resposta como "name" (evita loop definitivamente)
          try {
            // Buscar ou criar usuário
            const { data: user } = await supabase
              .from("users_livia")
              .select("id")
              .eq("phone", normalizedUserId)
              .single();

            if (user) {
              // Atualizar onboarding_step para "welcome"
              await supabase
                .from("users_livia")
                .update({ onboarding_step: "welcome" })
                .eq("id", user.id);
              logger.info(
                `[Livia] ✅ onboarding_step='welcome' marcado no banco para ${normalizedUserId}`
              );
            } else {
              // Criar usuário com onboarding_step = "welcome"
              await supabase.from("users_livia").insert({
                phone: normalizedUserId,
                onboarding_step: "welcome",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              logger.info(
                `[Livia] ✅ Usuário criado com onboarding_step='welcome' para ${normalizedUserId}`
              );
            }

            // Salvar mensagem de welcome no histórico
            await this._saveOnboardingMessage(
              normalizedUserId,
              welcomeMessage,
              "assistant"
            );
            logger.info(
              `[Livia] Mensagem de welcome salva no banco para ${normalizedUserId}`
            );
          } catch (saveError) {
            logger.error(
              "[Livia] ERRO CRÍTICO ao salvar welcome no banco:",
              saveError
            );
            // Continuar mesmo com erro, mas logar como crítico
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
      // USAR CONTEXTO PRÉ-CARREGADO SE DISPONÍVEL (evita chamadas duplicadas)
      let fullContext = context.preloadedContext;
      let contextSummary = context.preloadedContextSummary;

      if (!fullContext) {
        logger.info(
          `[Livia] Carregando contexto completo para ${normalizedUserId}`
        );
        fullContext = await contextMemory.loadUserContext(normalizedUserId);
        contextSummary = contextMemory.getContextSummary(fullContext);
      } else {
        logger.info(
          `[Livia] Usando contexto pré-carregado para ${normalizedUserId}`
        );
      }

      logger.info(`[Livia] Contexto carregado:`, {
        hasName: contextSummary.hasName,
        name: contextSummary.name,
        isReturningUser: contextSummary.isReturningUser,
        lastInteractionTime: contextSummary.lastInteractionTime,
        memoryCount: contextSummary.memoryCount,
        historyCount: contextSummary.historyCount,
      });

      // Construir prompt de contexto humanizado
      const contextPrompt = contextMemory.buildContextPrompt(fullContext);

      // Carregar memória do MemoryManager também (compatibilidade)
      const userMemory = await this.memoryManager.getUserMemory(
        normalizedUserId
      );

      // PRIORIDADE: Usar histórico do contextMemory (já formatado e humanizado)
      // O histórico já está incluído no contextPrompt, mas também precisamos para o AgentBase
      let conversationContext = [];
      if (fullContext.history && fullContext.history.length > 0) {
        // Converter histórico do contextMemory para formato do AgentBase
        // O AgentBase espera: { role: "user"|"assistant", content: string }
        conversationContext = fullContext.history.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
          timestamp: msg.sent_at,
        }));
        logger.info(
          `[Livia] Usando histórico do contextMemory: ${conversationContext.length} mensagens`
        );
      } else {
        // Fallback para MemoryManager
        conversationContext =
          await this.memoryManager.getConversationContext(normalizedUserId, 10);
        logger.info(
          `[Livia] Usando histórico do MemoryManager: ${conversationContext.length} mensagens`
        );
      }

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

      // Construir contexto completo para o agente
      context.userMemory = userMemory;
      context.conversationContext = conversationContext;
      context.globalInsights = globalMemory.insights;
      context.predictiveContext = predictiveContext;

      // NOVO: Contexto humanizado
      context.fullContext = fullContext;
      context.contextSummary = contextSummary;
      context.contextPrompt = contextPrompt;
      context.userName = contextSummary.name;
      context.isReturningUser = contextSummary.isReturningUser;
      context.lastInteractionTime = contextSummary.lastInteractionTime;

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

      // APÓS A RESPOSTA: Extrair e salvar memórias automaticamente
      try {
        await contextMemory.extractAndSaveMemories(
          normalizedUserId,
          message,
          response.text
        );

        // Extrair níveis de dor, energia e humor da mensagem
        const levels = contextMemory.extractLevels(message);
        if (
          levels.pain_level !== null ||
          levels.energy_level !== null ||
          levels.mood_level !== null
        ) {
          logger.info(`[Livia] Níveis extraídos:`, levels);
        }
      } catch (memError) {
        logger.warn("[Livia] Erro ao extrair memórias:", memError.message);
      }

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
   * Garante que o cache está inicializado (lazy initialization)
   * Necessário porque no Vercel serverless cada requisição pode criar nova instância
   */
  _ensureCacheInitialized() {
    if (!this.welcomeSentCache) {
      this.welcomeSentCache = new Map();
      logger.info("[Livia] Cache de welcome inicializado (lazy)");
    }
  }

  /**
   * Verifica se usuário já tem conversa anterior (para detectar se welcome já foi enviado)
   * PRIMEIRO verifica banco (fonte de verdade), depois cache (otimização)
   * No Vercel serverless, o banco é a única fonte confiável
   */
  async _hasPreviousConversation(userId) {
    const normalizedPhone = userId.replace(/[^\d]/g, "");

    // PRIMEIRO: Verificar no banco (fonte de verdade no serverless)
    // No Vercel, cada requisição cria nova instância, então cache não persiste
    try {
      // Buscar mensagens do assistente pelo phone (não precisa do user_id)
      // Isso funciona mesmo se o usuário ainda não foi criado
      const { data: messages, error } = await supabase
        .from("conversations_livia")
        .select("id, message_type, content")
        .eq("phone", normalizedPhone)
        .eq("message_type", "assistant")
        .order("sent_at", { ascending: false })
        .limit(1);

      if (error && error.code !== "PGRST116") {
        logger.warn(
          `[Livia] Erro ao verificar conversa anterior no banco:`,
          error.message
        );
      }

      if (messages && messages.length > 0) {
        logger.info(
          `[Livia] Welcome já foi enviado (banco): ${normalizedPhone}, mensagens encontradas: ${messages.length}`
        );
        // Adicionar ao cache para otimização (mesmo que não persista)
        this._ensureCacheInitialized();
        this.welcomeSentCache.set(normalizedPhone, Date.now());
        return true;
      }
    } catch (error) {
      logger.warn(
        `[Livia] Erro ao verificar conversa anterior no banco:`,
        error.message
      );
    }

    // SEGUNDO: Verificar cache (otimização, mas não confiável no serverless)
    this._ensureCacheInitialized();
    if (this.welcomeSentCache.has(normalizedPhone)) {
      logger.info(`[Livia] Welcome já foi enviado (cache): ${normalizedPhone}`);
      return true;
    }

    // Se não encontrou no banco nem no cache, assumir que não tem conversa anterior
    logger.info(
      `[Livia] Nenhuma conversa anterior encontrada para ${normalizedPhone}`
    );
    return false;
  }

  /**
   * Marca que welcome foi enviado para um usuário (adiciona ao cache)
   */
  _markWelcomeSent(userId) {
    // Garantir que cache está inicializado (importante no Vercel serverless)
    this._ensureCacheInitialized();

    const normalizedPhone = userId.replace(/[^\d]/g, "");
    this.welcomeSentCache.set(normalizedPhone, Date.now());
    logger.info(
      `[Livia] Welcome marcado como enviado (cache): ${normalizedPhone}`
    );
  }

  /**
   * Salva mensagem de onboarding no histórico
   */
  /**
   * Salva mensagem de onboarding no histórico
   * Usa contextMemory para garantir que seja acessível via getRecentHistory
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
   * Calcula o próximo step baseado no step atual (fallback quando checkOnboardingStatus falha)
   */
  _calculateNextStepFromCurrent(currentStep) {
    const stepOrder = [
      "welcome",
      "name",
      "nickname",
      "basic_info",
      "sleep_habits",
      "work_habits",
      "daily_routine",
      "symptoms",
      "complete",
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex >= stepOrder.length - 1) {
      return "complete";
    }

    return stepOrder[currentIndex + 1];
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
