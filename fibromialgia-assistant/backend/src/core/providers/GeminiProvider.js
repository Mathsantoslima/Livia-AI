/**
 * =========================================
 * GEMINI PROVIDER - GOOGLE GEMINI API
 * =========================================
 */

const BaseProvider = require("./BaseProvider");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../utils/logger");

class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: "Gemini",
      apiKey: config.apiKey || process.env.GOOGLE_AI_API_KEY,
      model: config.model || process.env.GEMINI_MODEL || "gemini-1.5-flash-latest", // Usar flash-latest (versão estável)
      ...config,
    });

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    // Criar instância do modelo (sem generationConfig no construtor)
    this.modelInstance = null; // Será criado quando necessário
  }

  /**
   * Prepara mensagens para formato Gemini
   */
  prepareMessages(systemPrompt, messages) {
    // Gemini não tem system message separado, então incluímos no início
    let fullPrompt = systemPrompt + "\n\nCONVERSA:\n";

    // Converter histórico para texto
    const conversationText = messages
      .map((msg) => {
        const role = msg.role === "user" ? "Usuário" : "Assistente";
        return `${role}: ${msg.content}`;
      })
      .join("\n");

    return fullPrompt + conversationText;
  }

  /**
   * Gera resposta usando Gemini
   */
  async generate(systemPrompt, messages, options = {}) {
    try {
      const {
        temperature = 0.7,
        maxTokens = 1000,
        topP = 0.95,
        topK = 40,
      } = options;

      // Preparar prompt completo
      const fullPrompt = this.prepareMessages(systemPrompt, messages);

      // Criar instância do modelo se não existir
      if (!this.modelInstance) {
        this.modelInstance = this.genAI.getGenerativeModel({ 
          model: this.model 
        });
      }

      // Configuração de geração
      const generationConfig = {
        temperature,
        topP,
        topK,
        maxOutputTokens: maxTokens,
      };

      // Gerar conteúdo (formato correto da API)
      const result = await this.modelInstance.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();

      return {
        text: text.trim(),
        provider: "gemini",
        model: this.config.model,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        raw: response,
      };
    } catch (error) {
      logger.error("[Gemini] Erro ao gerar resposta:", error);
      throw error;
    }
  }

  /**
   * Obtém informações do provider
   */
  getInfo() {
    return {
      ...super.getInfo(),
      provider: "gemini",
      api: "Google Generative AI",
    };
  }
}

module.exports = GeminiProvider;
