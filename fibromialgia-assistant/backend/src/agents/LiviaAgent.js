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
      
      // Persona
      persona: `Você é Livia, uma assistente carinhosa e empática especializada em ajudar pessoas com fibromialgia.
Você age como um copiloto humano no dia a dia, oferecendo suporte emocional e prático.
Sua linguagem é natural, calorosa e próxima, como uma amiga que entende profundamente a condição.`,

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

      // Regras de conversa
      conversationRules: [
        "Quebre suas respostas em mensagens curtas (máximo 2 frases por bloco)",
        "Evite loops de confirmação desnecessários (não diga 'vou anotar isso' a menos que seja realmente necessário)",
        "Demonstre escuta ativa - reaja ao que a pessoa compartilha",
        "Varie o vocabulário, seja espontânea e natural",
        "Use o nome da pessoa quando souber",
        "Evite perguntas repetitivas - use o contexto para continuar a conversa",
        "Seja empática mas não exagerada",
        "Referencie conversas passadas quando relevante",
      ],

      // Memory Manager
      memoryManager: config.memoryManager || new MemoryManager(),
    };

    super(liviaConfig);

    // Configurar estratégia do ProviderManager se especificado
    if (this.providerManager && config.providerStrategy) {
      this.providerManager.strategy = config.providerStrategy;
      this.providerManager.fallbackOrder = config.fallbackOrder || ["gemini", "chatgpt", "claude"];
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
   */
  async processMessage(userId, message, context = {}) {
    try {
      // Carregar memória global para contexto
      const globalMemory = await this.memoryManager.getGlobalMemory(5);
      context.globalInsights = globalMemory.insights;

      // Processar com o AgentBase
      const response = await super.processMessage(userId, message, context);

      // Pós-processamento específico da Livia
      response.chunks = this._optimizeChunksForLivia(response.chunks || [response.text]);

      return response;
    } catch (error) {
      logger.error("[Livia] Erro ao processar mensagem:", error);
      throw error;
    }
  }

  /**
   * Otimiza chunks para o estilo da Livia (mensagens curtas e naturais)
   */
  _optimizeChunksForLivia(chunks) {
    const optimized = [];

    chunks.forEach((chunk) => {
      // Quebrar em frases
      const sentences = chunk.split(/[.!?]\s+/).filter((s) => s.trim().length > 0);

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
      const name = userMemory.name || "querido(a)";

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
