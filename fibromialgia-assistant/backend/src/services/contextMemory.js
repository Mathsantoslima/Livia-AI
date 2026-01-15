/**
 * Serviço de Memória Contextual
 * Gerencia o contexto e memórias do usuário para respostas humanizadas
 */

const { createClient } = require("@supabase/supabase-js");
const logger = require("../utils/logger");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class ContextMemory {
  /**
   * Carrega o contexto completo do usuário
   * @param {string} phone - Telefone do usuário (normalizado)
   * @returns {Object} Contexto completo
   */
  async loadUserContext(phone) {
    const normalizedPhone = phone.replace(/[^\d]/g, "");
    
    try {
      const [profile, memories, history, lastInteraction] = await Promise.all([
        this.getUserProfile(normalizedPhone),
        this.getActiveMemories(normalizedPhone),
        this.getRecentHistory(normalizedPhone, 10),
        this.getLastInteraction(normalizedPhone),
      ]);

      return {
        phone: normalizedPhone,
        profile,
        memories,
        history,
        lastInteraction,
        hasContext: !!(profile || memories.length > 0 || history.length > 0),
      };
    } catch (error) {
      logger.error("[ContextMemory] Erro ao carregar contexto:", error);
      return {
        phone: normalizedPhone,
        profile: null,
        memories: [],
        history: [],
        lastInteraction: null,
        hasContext: false,
        error: error.message,
      };
    }
  }

  /**
   * Busca o perfil do usuário
   */
  async getUserProfile(phone) {
    try {
      const { data, error } = await supabase
        .from("users_livia")
        .select("*")
        .eq("phone", phone)
        .single();

      if (error && error.code !== "PGRST116") {
        logger.error("[ContextMemory] Erro ao buscar perfil:", error);
      }

      return data || null;
    } catch (error) {
      logger.error("[ContextMemory] Erro ao buscar perfil:", error);
      return null;
    }
  }

  /**
   * Busca memórias ativas do usuário
   */
  async getActiveMemories(phone, limit = 50) {
    try {
      const { data, error } = await supabase
        .from("user_memory_items")
        .select("*")
        .eq("phone", phone)
        .or("valid_to.is.null,valid_to.gte." + new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("[ContextMemory] Erro ao buscar memórias:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error("[ContextMemory] Erro ao buscar memórias:", error);
      return [];
    }
  }

  /**
   * Busca histórico recente de conversas
   */
  async getRecentHistory(phone, limit = 10) {
    try {
      const { data, error } = await supabase
        .from("conversations_livia")
        .select("*")
        .eq("user_id", phone)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("[ContextMemory] Erro ao buscar histórico:", error);
        return [];
      }

      // Inverter para ordem cronológica
      return (data || []).reverse();
    } catch (error) {
      logger.error("[ContextMemory] Erro ao buscar histórico:", error);
      return [];
    }
  }

  /**
   * Busca a última interação do usuário
   */
  async getLastInteraction(phone) {
    try {
      const { data, error } = await supabase
        .from("conversations_livia")
        .select("*")
        .eq("user_id", phone)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        logger.error("[ContextMemory] Erro ao buscar última interação:", error);
      }

      if (!data) return null;

      // Calcular tempo desde última interação
      const lastTime = new Date(data.created_at);
      const now = new Date();
      const diffMs = now - lastTime;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo;
      if (diffMinutes < 5) {
        timeAgo = "agora mesmo";
      } else if (diffMinutes < 60) {
        timeAgo = `há ${diffMinutes} minutos`;
      } else if (diffHours < 24) {
        timeAgo = `há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
      } else if (diffDays === 1) {
        timeAgo = "ontem";
      } else {
        timeAgo = `há ${diffDays} dias`;
      }

      return {
        ...data,
        timeAgo,
        diffMinutes,
        diffHours,
        diffDays,
        isRecent: diffMinutes < 30,
        isSameDay: diffDays === 0,
      };
    } catch (error) {
      logger.error("[ContextMemory] Erro ao buscar última interação:", error);
      return null;
    }
  }

  /**
   * Salva uma memória do usuário
   */
  async saveMemory(phone, key, value, options = {}) {
    const normalizedPhone = phone.replace(/[^\d]/g, "");
    
    try {
      const memoryData = {
        phone: normalizedPhone,
        key,
        value: typeof value === "string" ? value : null,
        value_json: typeof value === "object" ? value : null,
        source: options.source || "conversation",
        confidence: options.confidence || 1.0,
        valid_from: options.validFrom || new Date().toISOString().split("T")[0],
        valid_to: options.validTo || null,
      };

      // Verificar se já existe memória com essa chave
      const { data: existing } = await supabase
        .from("user_memory_items")
        .select("id")
        .eq("phone", normalizedPhone)
        .eq("key", key)
        .is("valid_to", null)
        .single();

      if (existing) {
        // Atualizar memória existente
        const { error } = await supabase
          .from("user_memory_items")
          .update({
            value: memoryData.value,
            value_json: memoryData.value_json,
            confidence: memoryData.confidence,
          })
          .eq("id", existing.id);

        if (error) throw error;
        logger.info(`[ContextMemory] Memória atualizada: ${key}`);
      } else {
        // Criar nova memória
        const { error } = await supabase
          .from("user_memory_items")
          .insert(memoryData);

        if (error) throw error;
        logger.info(`[ContextMemory] Memória salva: ${key}`);
      }

      return { success: true };
    } catch (error) {
      logger.error("[ContextMemory] Erro ao salvar memória:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Salva múltiplas memórias de uma vez
   */
  async saveMemories(phone, memories) {
    const results = await Promise.all(
      memories.map((mem) =>
        this.saveMemory(phone, mem.key, mem.value, mem.options)
      )
    );
    return results;
  }

  /**
   * Extrai e salva memórias automaticamente de uma conversa
   */
  async extractAndSaveMemories(phone, userMessage, assistantResponse) {
    const normalizedPhone = phone.replace(/[^\d]/g, "");
    const memoriesToSave = [];
    const messageLower = userMessage.toLowerCase();

    // Extrair nome
    const nameMatch = userMessage.match(
      /(?:meu nome é|sou|me chamo|eu sou|pode me chamar de)\s+([A-Za-zÀ-ÿ]+)/i
    );
    if (nameMatch) {
      memoriesToSave.push({
        key: "nome_mencionado",
        value: nameMatch[1].trim(),
        options: { source: "auto_extract" },
      });
    }

    // Extrair sintomas mencionados
    const symptoms = this._extractSymptoms(messageLower);
    if (symptoms.length > 0) {
      memoriesToSave.push({
        key: "sintomas_mencionados",
        value: { symptoms, mentioned_at: new Date().toISOString() },
        options: { source: "auto_extract" },
      });

      // Salvar eventos de sintomas individualmente
      for (const symptom of symptoms) {
        await this.saveSymptomEvent(normalizedPhone, symptom);
      }
    }

    // Extrair gatilhos
    const triggers = this._extractTriggers(messageLower);
    if (triggers.length > 0) {
      memoriesToSave.push({
        key: "gatilhos_identificados",
        value: { triggers, mentioned_at: new Date().toISOString() },
        options: { source: "auto_extract" },
      });
    }

    // Extrair rotina/trabalho
    const routine = this._extractRoutine(messageLower);
    if (routine) {
      memoriesToSave.push({
        key: "rotina_mencionada",
        value: routine,
        options: { source: "auto_extract" },
      });
    }

    // Extrair estado emocional
    const emotion = this._extractEmotion(messageLower);
    if (emotion) {
      memoriesToSave.push({
        key: "estado_emocional",
        value: { emotion, mentioned_at: new Date().toISOString() },
        options: { source: "auto_extract" },
      });
    }

    // Salvar todas as memórias
    if (memoriesToSave.length > 0) {
      await this.saveMemories(normalizedPhone, memoriesToSave);
      logger.info(
        `[ContextMemory] Extraídas ${memoriesToSave.length} memórias de ${normalizedPhone}`
      );
    }

    return memoriesToSave;
  }

  /**
   * Salva um evento de sintoma
   */
  async saveSymptomEvent(phone, symptomData) {
    try {
      const { error } = await supabase.from("symptom_events").insert({
        phone,
        symptom_type: symptomData.type || symptomData,
        body_area: symptomData.area || null,
        intensity: symptomData.intensity || null,
        notes: symptomData.notes || null,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error("[ContextMemory] Erro ao salvar evento de sintoma:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extrai sintomas de uma mensagem
   */
  _extractSymptoms(message) {
    const symptoms = [];
    const symptomPatterns = [
      { pattern: /dor|doendo|dói/i, type: "dor" },
      { pattern: /cansa(do|da|ço)|fadiga|exaust/i, type: "fadiga" },
      { pattern: /não (dormi|consegui dormir)|insônia|sono ruim/i, type: "insonia" },
      { pattern: /rigidez|trav(ado|ada)|rígid/i, type: "rigidez" },
      { pattern: /névoa|confus|esquec/i, type: "nevoa_mental" },
      { pattern: /ansie(dade|oso|osa)/i, type: "ansiedade" },
      { pattern: /deprimi|triste|desanim/i, type: "tristeza" },
      { pattern: /formig|dormência/i, type: "formigamento" },
      { pattern: /enxaqueca|cabeça/i, type: "dor_cabeca" },
    ];

    // Partes do corpo
    const bodyAreas = {
      "braço": "braco",
      "perna": "perna",
      "costa": "costas",
      "lombar": "lombar",
      "pescoço": "pescoco",
      "ombro": "ombro",
      "joelho": "joelho",
      "mão": "mao",
      "pé": "pe",
      "corpo todo": "corpo_todo",
    };

    for (const { pattern, type } of symptomPatterns) {
      if (pattern.test(message)) {
        const symptom = { type };

        // Tentar identificar área do corpo
        for (const [area, areaKey] of Object.entries(bodyAreas)) {
          if (message.includes(area)) {
            symptom.area = areaKey;
            break;
          }
        }

        // Tentar identificar intensidade
        const intensityMatch = message.match(/(\d+)\s*(\/10|de 10)?/);
        if (intensityMatch) {
          symptom.intensity = parseInt(intensityMatch[1]);
        } else if (/muito|demais|forte|intens/i.test(message)) {
          symptom.intensity = 8;
        } else if (/pouco|leve|fraco/i.test(message)) {
          symptom.intensity = 3;
        }

        symptoms.push(symptom);
      }
    }

    return symptoms;
  }

  /**
   * Extrai gatilhos de uma mensagem
   */
  _extractTriggers(message) {
    const triggers = [];
    const triggerPatterns = [
      { pattern: /computador|pc|notebook|tela/i, trigger: "trabalho_computador" },
      { pattern: /estresse|estressad/i, trigger: "estresse" },
      { pattern: /dormi (mal|pouco)|não dormi/i, trigger: "sono_ruim" },
      { pattern: /trabalh(ei|o) (muito|demais)/i, trigger: "excesso_trabalho" },
      { pattern: /exercício|academia|caminhada|corri/i, trigger: "atividade_fisica" },
      { pattern: /frio|gelad/i, trigger: "frio" },
      { pattern: /calor|quente/i, trigger: "calor" },
      { pattern: /comi (mal|besteira)|alimentação/i, trigger: "alimentacao_ruim" },
      { pattern: /brig(uei|a)|discussão|conflito/i, trigger: "conflito" },
      { pattern: /ansiedad|nervos/i, trigger: "ansiedade" },
    ];

    for (const { pattern, trigger } of triggerPatterns) {
      if (pattern.test(message)) {
        triggers.push(trigger);
      }
    }

    return triggers;
  }

  /**
   * Extrai informações de rotina de uma mensagem
   */
  _extractRoutine(message) {
    const routine = {};

    // Trabalho
    if (/trabalh/i.test(message)) {
      routine.trabalho = true;
      const hoursMatch = message.match(/(\d+)\s*h(oras?)?/i);
      if (hoursMatch) {
        routine.horas_trabalho = parseInt(hoursMatch[1]);
      }
    }

    // Sono
    if (/dormi|acordei|sono/i.test(message)) {
      routine.menciona_sono = true;
      const sleepMatch = message.match(/dormi\s*(\d+)\s*h/i);
      if (sleepMatch) {
        routine.horas_sono = parseInt(sleepMatch[1]);
      }
    }

    // Exercício
    if (/exercício|academia|caminhad|corri/i.test(message)) {
      routine.exercicio = true;
    }

    return Object.keys(routine).length > 0 ? routine : null;
  }

  /**
   * Extrai estado emocional de uma mensagem
   */
  _extractEmotion(message) {
    const emotions = [
      { pattern: /feliz|bem|ótim|maravilhos/i, emotion: "positivo" },
      { pattern: /triste|mal|horrível|péssim/i, emotion: "negativo" },
      { pattern: /ansiosa?|nervosa?|preocupad/i, emotion: "ansioso" },
      { pattern: /cansad|exaust|esgotad/i, emotion: "esgotado" },
      { pattern: /frustrad|irritad|brav/i, emotion: "frustrado" },
      { pattern: /esperanç|motivad|animad/i, emotion: "esperancoso" },
    ];

    for (const { pattern, emotion } of emotions) {
      if (pattern.test(message)) {
        return emotion;
      }
    }

    return null;
  }

  /**
   * Constrói o prompt de contexto para o agente
   */
  buildContextPrompt(context) {
    const parts = [];

    // Perfil do usuário
    if (context.profile) {
      const name = context.profile.nickname || context.profile.name;
      if (name) {
        parts.push(`👤 USUÁRIO: ${name}`);
      }

      if (context.profile.main_symptoms) {
        parts.push(`📋 Sintomas principais: ${context.profile.main_symptoms}`);
      }

      if (context.profile.habits) {
        const habits = context.profile.habits;
        if (habits.sleep) {
          parts.push(`😴 Sono: ${JSON.stringify(habits.sleep)}`);
        }
        if (habits.work) {
          parts.push(`💼 Trabalho: ${JSON.stringify(habits.work)}`);
        }
      }
    }

    // Última interação
    if (context.lastInteraction) {
      parts.push(`\n⏰ ÚLTIMA CONVERSA: ${context.lastInteraction.timeAgo}`);
      if (context.lastInteraction.content) {
        const lastContent = context.lastInteraction.content.substring(0, 200);
        parts.push(`📝 Último assunto: "${lastContent}..."`);
      }
    }

    // Memórias importantes
    if (context.memories && context.memories.length > 0) {
      parts.push("\n🧠 MEMÓRIAS RELEVANTES:");
      const recentMemories = context.memories.slice(0, 10);
      for (const mem of recentMemories) {
        const value = mem.value || JSON.stringify(mem.value_json);
        parts.push(`- ${mem.key}: ${value}`);
      }
    }

    // Histórico recente
    if (context.history && context.history.length > 0) {
      parts.push("\n💬 HISTÓRICO RECENTE:");
      for (const msg of context.history.slice(-6)) {
        const role = msg.role === "user" ? "Usuário" : "Livia";
        const content = msg.content.substring(0, 100);
        parts.push(`${role}: ${content}${msg.content.length > 100 ? "..." : ""}`);
      }
    }

    return parts.join("\n");
  }

  /**
   * Gera um resumo do contexto para decisões rápidas
   */
  getContextSummary(context) {
    return {
      hasName: !!(context.profile?.name || context.profile?.nickname),
      name: context.profile?.nickname || context.profile?.name || null,
      isNewUser: !context.hasContext,
      isReturningUser: context.lastInteraction && context.lastInteraction.diffDays > 0,
      lastInteractionTime: context.lastInteraction?.timeAgo || null,
      memoryCount: context.memories?.length || 0,
      historyCount: context.history?.length || 0,
      hasSymptoms: context.memories?.some((m) => m.key.includes("sintoma")) || false,
      hasTriggers: context.memories?.some((m) => m.key.includes("gatilho")) || false,
    };
  }
}

module.exports = new ContextMemory();
