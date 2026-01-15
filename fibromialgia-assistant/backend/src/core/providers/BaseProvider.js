/**
 * =========================================
 * BASE PROVIDER - INTERFACE PARA PROVIDERS DE IA
 * =========================================
 * 
 * Interface base para todos os providers de IA
 * Permite trocar entre Gemini, ChatGPT, Claude, etc.
 */

const logger = require("../../utils/logger");

class BaseProvider {
  constructor(config = {}) {
    this.name = config.name || "BaseProvider";
    this.apiKey = config.apiKey || null;
    this.model = config.model || null;
    this.config = config;
    
    if (!this.apiKey) {
      throw new Error(`${this.name}: API key não configurada`);
    }
  }

  /**
   * Gera resposta do modelo
   * @param {string} systemPrompt - Prompt do sistema
   * @param {Array} messages - Histórico de mensagens
   * @param {Object} options - Opções adicionais (temperature, maxTokens, etc)
   * @returns {Promise<Object>} Resposta do modelo
   */
  async generate(systemPrompt, messages, options = {}) {
    throw new Error("generate() deve ser implementado pela classe filha");
  }

  /**
   * Prepara mensagens para o formato do provider
   * @param {string} systemPrompt - Prompt do sistema
   * @param {Array} messages - Histórico de mensagens
   * @returns {Array} Mensagens formatadas
   */
  prepareMessages(systemPrompt, messages) {
    throw new Error("prepareMessages() deve ser implementado pela classe filha");
  }

  /**
   * Valida configuração do provider
   * @returns {boolean} true se válido
   */
  validate() {
    return !!this.apiKey && !!this.model;
  }

  /**
   * Testa conexão com o provider
   * @returns {Promise<boolean>} true se funcionando
   */
  async testConnection() {
    try {
      const testMessage = "Responda apenas: OK";
      const response = await this.generate("Você é um assistente.", [
        { role: "user", content: testMessage },
      ]);
      return !!response.text;
    } catch (error) {
      logger.error(`[${this.name}] Erro no teste de conexão:`, error);
      return false;
    }
  }

  /**
   * Obtém informações do provider
   * @returns {Object} Informações do provider
   */
  getInfo() {
    return {
      name: this.name,
      model: this.model,
      configured: this.validate(),
    };
  }
}

module.exports = BaseProvider;
