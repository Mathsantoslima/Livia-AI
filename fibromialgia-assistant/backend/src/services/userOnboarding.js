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
        return {
          needsOnboarding: true,
          currentStep: "welcome",
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
        const currentStep = this._getNextOnboardingStep(user);
        logger.info(
          `[Onboarding] Usuário ${normalizedPhone} precisa continuar onboarding. Próximo passo: ${currentStep}`
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
      return {
        needsOnboarding: false,
        currentStep: null,
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

      // Buscar usuário existente
      const { data: existingUser } = await supabase
        .from("users_livia")
        .select("*")
        .eq("phone", normalizedPhone)
        .single();

      const updateData = {
        phone: normalizedPhone,
        updated_at: new Date().toISOString(),
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

      return { success: true, user: updatedUser };
    } catch (error) {
      logger.error("[Onboarding] Erro ao atualizar perfil:", error);
      throw error;
    }
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
    const greetings = userNickname
      ? `Olá, ${userNickname}!`
      : userName
      ? `Olá, ${userName}!`
      : "Olá!";

    switch (step) {
      case "welcome":
        // Retornar mensagem em blocos para envio sequencial
        return {
          chunks: [
            `${greetings}\n\nMeu nome é Livia 🌷`,
            `Sou sua assistente virtual especializada em fibromialgia. Estou aqui para te acompanhar todos os dias, entender sua rotina, seus sintomas e te ajudar a encontrar padrões que possam melhorar seu bem-estar.`,
            `✨ Como posso te ajudar:\n• Acompanhar como você está se sentindo\n• Identificar padrões entre sua rotina e sintomas\n• Fazer previsões sobre seus dias (com base no que aprendi sobre você)\n• Enviar mensagens diárias às 8h da manhã com insights personalizados\n• Te ajudar a entender o que pode estar influenciando seus sintomas`,
            `💬 Você pode me enviar:\n• Texto: me conte como está se sentindo\n• Áudio: fale comigo naturalmente\n• Imagens: compartilhe algo relevante\n• Documentos: relatórios médicos, anotações`,
            `⚠️ Importante: Eu NÃO faço diagnósticos, NÃO prescrevo medicamentos e NÃO substituo consultas médicas. Sou uma companheira que entende fibromialgia e está presente todos os dias.`,
            `Vamos começar? Antes de tudo, qual é o seu nome? 😊`,
          ],
          isChunked: true,
        };

      case "name":
        return {
          chunks: [
            `${greetings}\n\nPrazer em conhecê-lo(a)! 👋`,
            `E como você prefere ser chamado(a)? (pode ser um apelido, diminutivo ou o próprio nome)`,
          ],
          isChunked: true,
        };

      case "nickname":
        return {
          chunks: [
            `${greetings}\n\nPerfeito! Vou te chamar assim então. 😊`,
            `Para personalizar melhor nossa conversa, me conte:\n- Quantos anos você tem?\n- Qual seu gênero?`,
          ],
          isChunked: true,
        };

      case "basic_info":
        return `Entendi! Obrigada por compartilhar. 💙\n\nAgora, me fale sobre seu sono:\n- Quantas horas você costuma dormir por noite?\n- Como você avalia a qualidade do seu sono? (bom, médio, ruim)`;

      case "sleep_habits":
        return `Obrigada! 📝\n\nE sobre seu trabalho:\n- Você trabalha? Quantas horas por dia?\n- Como você avalia o nível de estresse no trabalho? (baixo, médio, alto)`;

      case "work_habits":
        return `Perfeito! ✨\n\nMe conte sobre sua rotina diária:\n- Que horas você costuma acordar e dormir?\n- Você faz alguma atividade física? Qual e com que frequência?`;

      case "daily_routine":
        return `Ótimo! Já estou conhecendo você melhor. 🎯\n\nPor último, me conte:\n- Quais são os principais sintomas de fibromialgia que você sente? (ex: dor, fadiga, problemas de sono)\n- Há algo que você percebe que piora seus sintomas? (gatilhos)`;

      case "symptoms":
        return {
          chunks: [
            `Perfeito! Agora já tenho um perfil completo sobre você. 🎉`,
            `Vou usar essas informações para:\n• Entender melhor seus padrões\n• Fazer previsões sobre seus dias\n• Dar sugestões personalizadas\n• Te enviar mensagens diárias às 8h da manhã com insights`,
            `💡 Dica: Quanto mais você me contar sobre seu dia a dia, melhor eu consigo te ajudar a identificar o que funciona ou não para você.`,
            `Agora pode me contar como você está se sentindo hoje? Ou se preferir, pode me enviar um áudio, uma imagem ou qualquer coisa que quiser compartilhar! 😊`,
          ],
          isChunked: true,
        };

      default:
        return "Obrigada pelas informações! Como posso ajudar você hoje?";
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
