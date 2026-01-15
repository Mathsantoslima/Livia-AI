/**
 * =========================================
 * SERVIÇO DE ONBOARDING E MAPEAMENTO DE PERFIL
 * =========================================
 *
 * Quando um usuário novo envia mensagem pela primeira vez,
 * o agente deve mapear e perguntar informações para criar o perfil completo
 */

const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const contextMemory = require("./contextMemory");

class UserOnboarding {
  /**
   * Verifica se o usuário precisa de onboarding
   * @param {string} userId - ID do usuário (phone)
   * @returns {Promise<Object>} { needsOnboarding: boolean, currentStep: string, profile: Object }
   */
  async checkOnboardingStatus(userId) {
    try {
      // Normalizar phone (remover caracteres não numéricos)
      const normalizedPhone = userId.replace(/[^\d]/g, "");

      logger.info(
        `[Onboarding] Verificando status para userId: ${userId} (normalizado: ${normalizedPhone})`
      );

      // Buscar usuário pelo phone (userId é o phone)
      const { data: user, error } = await supabase
        .from("users_livia")
        .select("*")
        .eq("phone", normalizedPhone)
        .single();

      logger.info(`[Onboarding] Resultado da busca:`, {
        found: !!user,
        error: error?.code,
        userId: normalizedPhone,
      });

      if (error && error.code === "PGRST116") {
        // Usuário não existe - precisa criar e fazer onboarding
        logger.info(
          `[Onboarding] Usuário ${normalizedPhone} não encontrado - precisa de onboarding`
        );
        return {
          needsOnboarding: true,
          currentStep: "welcome",
          profile: null,
          isNewUser: true,
        };
      }

      if (error && error.code !== "PGRST116") {
        // Erro diferente de "não encontrado" - logar mas ainda tentar onboarding
        logger.error("[Onboarding] Erro ao buscar usuário:", error);
        logger.warn(
          "[Onboarding] Erro não crítico, assumindo que precisa de onboarding"
        );
        // Se houver erro mas não for "não encontrado", assumir que precisa de onboarding
        // IMPORTANTE: Retornar currentStep como null para que o sistema detecte primeira mensagem pela mensagem em si
        return {
          needsOnboarding: true,
          currentStep: null, // null = não sabemos, deixar sistema detectar pela mensagem
          profile: null,
          isNewUser: true,
          error: error.message,
        };
      }

      // Verificar se o perfil está completo
      const profileComplete = this._isProfileComplete(user);

      logger.info(`[Onboarding] Perfil do usuário ${normalizedPhone}:`, {
        hasName: !!(user.name || user.nickname),
        hasRoutine: !!(
          user.daily_routine && Object.keys(user.daily_routine).length > 0
        ),
        hasHabits: !!(user.habits && Object.keys(user.habits).length > 0),
        onboardingCompleted: user.onboarding_completed,
        profileComplete: profileComplete,
      });

      if (!profileComplete) {
        // Perfil incompleto - precisa continuar onboarding
        // PRIORIDADE: usar onboarding_step do banco se existir (reflete o fluxo real)
        // FALLBACK: calcular baseado nos dados faltantes
        let currentStep = user.onboarding_step;

        if (!currentStep) {
          // Se não há step salvo, calcular baseado nos dados
          currentStep = this._getNextOnboardingStep(user);
        }

        logger.info(
          `[Onboarding] Usuário ${normalizedPhone} precisa continuar onboarding. ` +
            `Step do banco: ${
              user.onboarding_step
            }, Calculado: ${this._getNextOnboardingStep(
              user
            )}, Usando: ${currentStep}`
        );
        return {
          needsOnboarding: true,
          currentStep: currentStep,
          profile: user,
          isNewUser: false,
        };
      }

      // Perfil completo
      logger.info(
        `[Onboarding] Usuário ${normalizedPhone} tem perfil completo - não precisa de onboarding`
      );
      return {
        needsOnboarding: false,
        currentStep: null,
        profile: user,
        isNewUser: false,
      };
    } catch (error) {
      logger.error("[Onboarding] Erro ao verificar status:", error);
      // Em caso de erro, assumir que precisa de onboarding para segurança
      return {
        needsOnboarding: true,
        currentStep: "welcome",
        profile: null,
        error: error.message,
      };
    }
  }

  /**
   * Verifica se o perfil está completo
   */
  _isProfileComplete(user) {
    if (!user) {
      logger.warn("[Onboarding] _isProfileComplete: usuário é null/undefined");
      return false;
    }

    // Verificar se onboarding foi marcado como completo (prioridade)
    if (user.onboarding_completed === true) {
      logger.info("[Onboarding] Perfil completo: onboarding_completed = true");
      return true; // Se foi marcado como completo, considerar completo
    }

    // Se onboarding_completed é explicitamente false, não está completo
    if (user.onboarding_completed === false) {
      logger.info(
        "[Onboarding] Perfil incompleto: onboarding_completed = false"
      );
      return false;
    }

    // Verificar campos essenciais
    const hasName = !!(user.name || user.nickname);
    const hasNickname = !!user.nickname;
    const hasBasicInfo = !!(user.age || user.gender);

    // Verificar se tem rotina básica ou hábitos
    const hasRoutine =
      user.daily_routine && Object.keys(user.daily_routine).length > 0;
    const hasHabits = user.habits && Object.keys(user.habits).length > 0;
    const hasSleepHabits =
      user.habits?.sleep && Object.keys(user.habits.sleep).length > 0;
    const hasWorkHabits =
      user.habits?.work && Object.keys(user.habits.work).length > 0;
    const hasSymptoms = user.main_symptoms && user.main_symptoms.length > 0;

    logger.info("[Onboarding] Verificando perfil completo:", {
      hasName,
      hasNickname,
      hasBasicInfo,
      hasRoutine,
      hasHabits,
      hasSleepHabits,
      hasWorkHabits,
      hasSymptoms,
      onboardingCompleted: user.onboarding_completed,
    });

    // Perfil completo precisa ter: nome, nickname, info básica, hábitos (sono E trabalho), rotina E sintomas
    const isComplete =
      hasName &&
      hasNickname &&
      hasBasicInfo &&
      hasSleepHabits &&
      hasWorkHabits &&
      hasRoutine &&
      hasSymptoms;

    logger.info(
      `[Onboarding] Perfil ${isComplete ? "COMPLETO" : "INCOMPLETO"}`
    );
    return isComplete;
  }

  /**
   * Determina o próximo passo do onboarding
   */
  _getNextOnboardingStep(user) {
    if (!user.name) {
      return "name";
    }
    if (!user.nickname) {
      return "nickname";
    }
    if (!user.age && !user.gender) {
      return "basic_info";
    }
    if (!user.habits || !user.habits.sleep) {
      return "sleep_habits";
    }
    if (!user.habits || !user.habits.work) {
      return "work_habits";
    }
    if (!user.daily_routine || Object.keys(user.daily_routine).length === 0) {
      return "daily_routine";
    }
    if (!user.main_symptoms || user.main_symptoms.length === 0) {
      return "symptoms";
    }
    return "complete";
  }

  /**
   * Cria ou atualiza usuário com informações do onboarding
   */
  async updateUserProfile(userId, step, answer) {
    try {
      // Normalizar phone
      const normalizedPhone = userId.replace(/[^\d]/g, "");

      logger.info(
        `[Onboarding] Atualizando perfil para userId: ${normalizedPhone}, passo: ${step}`
      );

      // Buscar ou criar usuário
      let existingUser;
      const { data: userData, error: userError } = await supabase
        .from("users_livia")
        .select("*")
        .eq("phone", normalizedPhone)
        .single();

      if (userError && userError.code === "PGRST116") {
        // Usuário não existe, criar novo
        logger.info(
          `[Onboarding] Usuário ${normalizedPhone} não existe, criando novo usuário`
        );
        const { data: newUser, error: createError } = await supabase
          .from("users_livia")
          .insert({
            phone: normalizedPhone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          logger.error("[Onboarding] Erro ao criar usuário:", createError);
          throw createError;
        }

        existingUser = newUser;
      } else if (userError) {
        logger.error("[Onboarding] Erro ao buscar usuário:", userError);
        throw userError;
      } else {
        existingUser = userData;
      }

      const updateData = {
        phone: normalizedPhone,
        updated_at: new Date().toISOString(),
        // CRITICAL: Atualizar onboarding_step para evitar loop
        // Após processar uma resposta, atualizar o step para o próximo
        onboarding_step: this._getNextStepAfter(step),
      };

      // Processar resposta baseado no passo
      switch (step) {
        case "name":
          if (answer) {
            // Tentar extrair nome (pode vir como "meu nome é João" ou só "João")
            const nameMatch = answer.match(
              /(?:meu nome é|sou|me chamo|eu sou)\s+([A-Za-zÀ-ÿ\s]+)/i
            );
            const name = nameMatch ? nameMatch[1].trim() : answer.trim();
            updateData.name = name;
            logger.info(`[Onboarding] Nome extraído: ${name}`);
          }
          break;

        case "nickname":
          if (answer) {
            // Extrair apelido (pode vir como "me chame de X" ou só "X")
            const nicknameMatch = answer.match(
              /(?:me chame de|chame de|pode me chamar de|prefiro|gosto de ser chamado|apelido)\s+([A-Za-zÀ-ÿ\s]+)/i
            );
            const nickname = nicknameMatch
              ? nicknameMatch[1].trim()
              : answer.trim();
            updateData.nickname = nickname;
            logger.info(`[Onboarding] Apelido extraído: ${nickname}`);
          }
          break;

        case "basic_info":
          // Extrair idade e gênero da resposta
          const ageMatch = answer.match(/(\d+)\s*(?:anos|idade)/i);
          if (ageMatch) {
            updateData.age = parseInt(ageMatch[1]);
          }

          if (
            answer.toLowerCase().includes("mulher") ||
            answer.toLowerCase().includes("feminino")
          ) {
            updateData.gender = "feminino";
          } else if (
            answer.toLowerCase().includes("homem") ||
            answer.toLowerCase().includes("masculino")
          ) {
            updateData.gender = "masculino";
          } else if (
            answer.toLowerCase().includes("outro") ||
            answer.toLowerCase().includes("não binário")
          ) {
            updateData.gender = "outro";
          }
          break;

        case "sleep_habits":
          updateData.habits = existingUser?.habits || {};
          const sleepData = this._extractSleepInfo(answer);
          updateData.habits.sleep = {
            ...updateData.habits.sleep,
            ...sleepData,
          };
          break;

        case "work_habits":
          updateData.habits = existingUser?.habits || {};
          const workData = this._extractWorkInfo(answer);
          updateData.habits.work = { ...updateData.habits.work, ...workData };
          break;

        case "daily_routine":
          updateData.daily_routine = existingUser?.daily_routine || {};
          const routineData = this._extractRoutineInfo(answer);
          updateData.daily_routine = {
            ...updateData.daily_routine,
            ...routineData,
          };
          break;

        case "symptoms":
          const symptoms = this._extractSymptoms(answer);
          updateData.main_symptoms = symptoms;
          break;
      }

      // Se usuário não existe, criar
      if (!existingUser) {
        updateData.created_at = new Date().toISOString();
        updateData.primeiro_contato = new Date().toISOString();
        updateData.status = "active";
        updateData.onboarding_completed = false;

        logger.info(`[Onboarding] Criando novo usuário: ${normalizedPhone}`);

        const { data: newUser, error: createError } = await supabase
          .from("users_livia")
          .insert([updateData])
          .select()
          .single();

        if (createError) {
          logger.error("[Onboarding] Erro ao criar usuário:", createError);
          throw createError;
        }

        logger.info(`[Onboarding] Usuário criado com sucesso: ${newUser.id}`);
        return { success: true, user: newUser };
      }

      // Atualizar usuário existente
      logger.info(
        `[Onboarding] Atualizando usuário existente: ${normalizedPhone}`
      );

      const { data: updatedUser, error: updateError } = await supabase
        .from("users_livia")
        .update(updateData)
        .eq("phone", normalizedPhone)
        .select()
        .single();

      if (updateError) {
        logger.error("[Onboarding] Erro ao atualizar usuário:", updateError);
        throw updateError;
      }

      // SALVAR MEMÓRIAS do onboarding para contextMemory
      try {
        await this._saveOnboardingMemories(normalizedPhone, step, updateData);
      } catch (memError) {
        logger.warn("[Onboarding] Erro ao salvar memórias:", memError.message);
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      logger.error("[Onboarding] Erro ao atualizar perfil:", error);
      throw error;
    }
  }

  /**
   * Salva memórias coletadas durante o onboarding
   */
  async _saveOnboardingMemories(phone, step, data) {
    try {
      const memories = [];

      switch (step) {
        case "name":
          if (data.name) {
            memories.push({
              key: "nome_usuario",
              value: data.name,
              options: { source: "onboarding" },
            });
          }
          break;

        case "nickname":
          if (data.nickname) {
            memories.push({
              key: "apelido_preferido",
              value: data.nickname,
              options: { source: "onboarding" },
            });
          }
          break;

        case "basic_info":
          if (data.age) {
            memories.push({
              key: "idade",
              value: String(data.age),
              options: { source: "onboarding" },
            });
          }
          if (data.gender) {
            memories.push({
              key: "genero",
              value: data.gender,
              options: { source: "onboarding" },
            });
          }
          break;

        case "sleep_habits":
          if (data.habits?.sleep) {
            memories.push({
              key: "habitos_sono",
              value: data.habits.sleep,
              options: { source: "onboarding" },
            });
          }
          break;

        case "work_habits":
          if (data.habits?.work) {
            memories.push({
              key: "habitos_trabalho",
              value: data.habits.work,
              options: { source: "onboarding" },
            });
          }
          break;

        case "daily_routine":
          if (data.daily_routine) {
            memories.push({
              key: "rotina_diaria",
              value: data.daily_routine,
              options: { source: "onboarding" },
            });
          }
          break;

        case "symptoms":
          if (data.main_symptoms && data.main_symptoms.length > 0) {
            memories.push({
              key: "sintomas_principais",
              value: { symptoms: data.main_symptoms },
              options: { source: "onboarding" },
            });
          }
          break;
      }

      // Salvar todas as memórias
      if (memories.length > 0) {
        await contextMemory.saveMemories(phone, memories);
        logger.info(
          `[Onboarding] Salvou ${memories.length} memórias para ${phone}`
        );
      }
    } catch (error) {
      logger.error("[Onboarding] Erro ao salvar memórias:", error);
    }
  }

  /**
   * Determina o próximo passo após processar uma resposta
   * @param {string} currentStep - Passo atual
   * @returns {string} Próximo passo
   */
  _getNextStepAfter(step) {
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

    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex === -1 || currentIndex >= stepOrder.length - 1) {
      return "complete";
    }

    return stepOrder[currentIndex + 1];
  }

  /**
   * Marca onboarding como completo
   */
  async completeOnboarding(userId) {
    try {
      const normalizedPhone = userId.replace(/[^\d]/g, "");

      logger.info(
        `[Onboarding] Completando onboarding para: ${normalizedPhone}`
      );

      const { error } = await supabase
        .from("users_livia")
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("phone", normalizedPhone);

      if (error) {
        logger.error("[Onboarding] Erro ao completar onboarding:", error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      logger.error("[Onboarding] Erro ao completar onboarding:", error);
      throw error;
    }
  }

  /**
   * Gera mensagem de pergunta baseada no passo atual
   */
  getOnboardingQuestion(step, userName = null, userNickname = null) {
    // Usar nickname se disponível, senão usar name, senão genérico
    const displayName = userNickname || userName;
    const greetings = displayName ? `${displayName}!` : "";

    logger.info(
      `[Onboarding] getOnboardingQuestion chamada: step=${step}, userName=${userName}, userNickname=${userNickname}`
    );

    switch (step) {
      case "welcome":
        // PRIMEIRO CONTATO: Apresentar Livia e perguntar o nome
        return {
          chunks: [
            `Olá!\n\nMeu nome é Livia 🌷`,
            `Sou sua assistente virtual especializada em fibromialgia. Estou aqui para te acompanhar todos os dias, entender sua rotina, seus sintomas e te ajudar a encontrar padrões que possam melhorar seu bem-estar.`,
            `✨ Como posso te ajudar:\n• Acompanhar como você está se sentindo\n• Identificar padrões entre sua rotina e sintomas\n• Fazer previsões sobre seus dias\n• Enviar mensagens diárias com insights personalizados`,
            `💬 Você pode me enviar texto, áudio, imagens ou documentos.`,
            `⚠️ Importante: Eu NÃO faço diagnósticos e NÃO prescrevo medicamentos. Sou uma companheira que entende fibromialgia.`,
            `Vamos começar? Qual é o seu nome? 😊`,
          ],
          isChunked: true,
        };

      case "name":
        // FALLBACK: Usuário existe mas sem nome (pedir nome sem intro completa)
        return `Olá! 👋 Sou a Livia. Para começarmos, qual é o seu nome?`;

      case "nickname":
        // APÓS RECEBER O NOME: Agradecer e perguntar apelido
        return {
          chunks: [
            `Prazer em te conhecer, ${userName || ""}! 👋`,
            `E como você prefere ser chamado(a)? Pode ser um apelido, diminutivo, ou o próprio nome mesmo.`,
          ],
          isChunked: true,
        };

      case "basic_info":
        // APÓS RECEBER O APELIDO: Confirmar e perguntar idade/gênero
        return {
          chunks: [
            `${displayName}, perfeito! Vou te chamar assim. 😊`,
            `Me conta um pouco mais sobre você:\n- Quantos anos você tem?\n- Qual seu gênero?`,
          ],
          isChunked: true,
        };

      case "sleep_habits":
        // APÓS RECEBER INFO BÁSICA: Perguntar sobre sono
        return `Entendi, ${displayName}! 💙\n\nAgora sobre seu sono:\n- Quantas horas você costuma dormir?\n- Como avalia a qualidade? (bom, médio, ruim)`;

      case "work_habits":
        // APÓS RECEBER SOBRE SONO: Perguntar sobre trabalho
        return `Obrigada! 📝\n\nE sobre seu trabalho, ${displayName}:\n- Você trabalha? Quantas horas por dia?\n- Nível de estresse? (baixo, médio, alto)`;

      case "daily_routine":
        // APÓS RECEBER SOBRE TRABALHO: Perguntar rotina
        return `Perfeito! ✨\n\nMe conta sua rotina:\n- Que horas acorda e dorme?\n- Faz atividade física? Qual?`;

      case "symptoms":
        // APÓS RECEBER ROTINA: Perguntar sintomas
        return `Ótimo, ${displayName}! Já estou te conhecendo melhor. 🎯\n\nPor último:\n- Quais sintomas de fibromialgia você mais sente?\n- Percebe algo que piora seus sintomas? (gatilhos)`;

      case "complete":
        // APÓS RECEBER SINTOMAS: Finalizar onboarding
        return {
          chunks: [
            `${displayName}, agora tenho um perfil completo sobre você! 🎉`,
            `Vou usar essas informações para:\n• Entender seus padrões\n• Fazer previsões sobre seus dias\n• Dar sugestões personalizadas`,
            `💡 Quanto mais você me contar sobre seu dia a dia, melhor consigo te ajudar!`,
            `Como você está se sentindo hoje? 😊`,
          ],
          isChunked: true,
        };

      default:
        // Caso inesperado - continuar conversa normalmente
        logger.warn(`[Onboarding] Step desconhecido: ${step}`);
        return displayName
          ? `${displayName}, como posso te ajudar hoje?`
          : "Como posso te ajudar hoje?";
    }
  }

  /**
   * Extrai informações de sono da resposta
   */
  _extractSleepInfo(answer) {
    const info = {};
    const lowerAnswer = answer.toLowerCase();

    // Horas de sono
    const hoursMatch = answer.match(/(\d+)\s*(?:h|horas)/i);
    if (hoursMatch) {
      info.averageHours = parseInt(hoursMatch[1]);
    }

    // Qualidade
    if (
      lowerAnswer.includes("bom") ||
      lowerAnswer.includes("boa") ||
      lowerAnswer.includes("bem")
    ) {
      info.quality = "good";
    } else if (
      lowerAnswer.includes("ruim") ||
      lowerAnswer.includes("péssimo")
    ) {
      info.quality = "poor";
    } else {
      info.quality = "medium";
    }

    // Consistência
    if (
      lowerAnswer.includes("sempre") ||
      lowerAnswer.includes("todos os dias")
    ) {
      info.consistency = "high";
    } else if (
      lowerAnswer.includes("às vezes") ||
      lowerAnswer.includes("variável")
    ) {
      info.consistency = "low";
    } else {
      info.consistency = "medium";
    }

    return info;
  }

  /**
   * Extrai informações de trabalho da resposta
   */
  _extractWorkInfo(answer) {
    const info = {};
    const lowerAnswer = answer.toLowerCase();

    // Horas de trabalho
    const hoursMatch = answer.match(/(\d+)\s*(?:h|horas)/i);
    if (hoursMatch) {
      info.hoursPerDay = parseInt(hoursMatch[1]);
    }

    // Nível de estresse
    if (lowerAnswer.includes("alto") || lowerAnswer.includes("muito")) {
      info.stressLevel = "high";
    } else if (lowerAnswer.includes("baixo") || lowerAnswer.includes("pouco")) {
      info.stressLevel = "low";
    } else {
      info.stressLevel = "medium";
    }

    // Pausas
    info.breaks =
      lowerAnswer.includes("pausa") || lowerAnswer.includes("descanso");

    return info;
  }

  /**
   * Extrai informações de rotina da resposta
   */
  _extractRoutineInfo(answer) {
    const routine = {};
    const lowerAnswer = answer.toLowerCase();

    // Horário de acordar
    const wakeMatch = answer.match(
      /(?:acordo|acordar|levanto)\s*(?:às|as)?\s*(\d{1,2})[h:]?(\d{2})?/i
    );
    if (wakeMatch) {
      routine.wakeTime = `${wakeMatch[1].padStart(2, "0")}:${
        wakeMatch[2] || "00"
      }`;
    }

    // Horário de dormir
    const sleepMatch = answer.match(
      /(?:durmo|dormir|vou dormir)\s*(?:às|as)?\s*(\d{1,2})[h:]?(\d{2})?/i
    );
    if (sleepMatch) {
      routine.bedtime = `${sleepMatch[1].padStart(2, "0")}:${
        sleepMatch[2] || "00"
      }`;
    }

    // Atividade física
    if (lowerAnswer.includes("caminhada") || lowerAnswer.includes("caminhar")) {
      routine.physicalActivity = { type: "walking", frequency: "daily" };
    } else if (
      lowerAnswer.includes("academia") ||
      lowerAnswer.includes("ginásio")
    ) {
      routine.physicalActivity = { type: "gym", frequency: "weekly" };
    } else if (lowerAnswer.includes("yoga")) {
      routine.physicalActivity = { type: "yoga", frequency: "weekly" };
    } else if (lowerAnswer.includes("não") || lowerAnswer.includes("nenhuma")) {
      routine.physicalActivity = { type: "none", frequency: "rarely" };
    }

    return routine;
  }

  /**
   * Extrai sintomas da resposta
   */
  _extractSymptoms(answer) {
    const symptoms = [];
    const lowerAnswer = answer.toLowerCase();

    const symptomKeywords = {
      dor: ["dor", "dói", "dores", "dolorido"],
      fadiga: ["fadiga", "cansado", "cansaço", "exausto", "sem energia"],
      sono: ["sono", "insônia", "dormir mal", "sono ruim"],
      ansiedade: ["ansiedade", "ansioso", "nervoso"],
      depressão: ["depressão", "deprimido", "triste"],
      rigidez: ["rigidez", "rígido", "travado"],
      memória: ["memória", "esquecimento", "esquecer"],
    };

    Object.entries(symptomKeywords).forEach(([symptom, keywords]) => {
      if (keywords.some((keyword) => lowerAnswer.includes(keyword))) {
        symptoms.push(symptom);
      }
    });

    return symptoms;
  }
}

module.exports = new UserOnboarding();
