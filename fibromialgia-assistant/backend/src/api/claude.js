const Anthropic = require("@anthropic-ai/sdk");
const { config } = require("../config");
const logger = require("../utils/logger");

// Verificar as configurações da Claude
if (!config.claude.apiKey) {
  logger.error(
    "Chave da API Claude não configurada! Verifique as variáveis de ambiente."
  );
}

// Configurar o cliente da API Claude (Anthropic)
const anthropic = new Anthropic({
  apiKey: config.claude.apiKey,
});

/**
 * Utilitário para interações com a API da Anthropic (Claude)
 */
class ClaudeService {
  /**
   * Gera uma resposta do modelo Claude
   * @param {Array} messages - Mensagens no formato de conversação
   * @param {Object} options - Opções para a geração de texto
   * @returns {Promise<Object>} - Resposta gerada
   */
  static async generateMessage(messages, options = {}) {
    try {
      const {
        model = config.claude.modelVersion || "claude-3-opus-20240229",
        temperature = config.assistant.defaultTemperature,
        maxTokens = 4000,
        topP = null,
        topK = null,
        systemPrompt = null,
      } = options;

      // Converter mensagens para o formato do Claude, se necessário
      const formattedMessages = messages
        .map((msg) => {
          if (msg.role === "system") {
            // Ignorar mensagens de sistema, pois usaremos o systemPrompt
            return null;
          } else if (msg.role === "user") {
            return { role: "user", content: msg.content };
          } else if (msg.role === "assistant") {
            return { role: "assistant", content: msg.content };
          } else {
            // Converter outros papéis para mensagens do usuário com prefixo
            return { role: "user", content: `[${msg.role}]: ${msg.content}` };
          }
        })
        .filter(Boolean);

      // Definir o prompt do sistema (se fornecido)
      const system = systemPrompt || this._findSystemMessage(messages);

      // Configuração da requisição
      const requestOptions = {
        model,
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
        system: system,
      };

      // Adicionar opções adicionais, se fornecidas
      if (topP) requestOptions.top_p = topP;
      if (topK) requestOptions.top_k = topK;

      // Fazer a chamada à API
      const response = await anthropic.messages.create(requestOptions);

      return {
        text: response.content[0].text,
        message: {
          role: "assistant",
          content: response.content[0].text,
        },
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      logger.error("Erro ao gerar mensagem com Claude:", error);
      throw error;
    }
  }

  /**
   * Busca a mensagem do sistema em um array de mensagens
   * @param {Array} messages - Array de mensagens de conversação
   * @returns {string|null} - Conteúdo da mensagem do sistema ou null
   */
  static _findSystemMessage(messages) {
    const systemMessage = messages.find((msg) => msg.role === "system");
    return systemMessage ? systemMessage.content : null;
  }

  /**
   * Analisa o texto do paciente e gera uma resposta empática
   * @param {string} patientText - Texto do paciente
   * @returns {Promise<Object>} - Resposta empática
   */
  static async generateEmpatheticResponse(patientText) {
    try {
      const systemPrompt = `
        Você é um assistente especializado em fibromialgia, treinado para fornecer respostas empáticas
        e informativas para pacientes. Siga estas diretrizes:
        
        1. Mostre sempre empatia e compreensão pelos sintomas e experiências do paciente
        2. Forneça informações baseadas em evidências científicas atualizadas
        3. Nunca sugira diagnósticos ou substituições de tratamentos médicos
        4. Use linguagem acessível, respeitosa e encorajadora
        5. Mantenha respostas concisas, diretas e focadas na pergunta
        6. Encoraje o autogerenciamento da condição dentro dos limites médicos
        7. Enfatize a importância de consultar profissionais de saúde
        
        Responda em português do Brasil, com um tom conversacional e acolhedor.
      `;

      const messages = [{ role: "user", content: patientText }];

      const response = await this.generateMessage(messages, {
        model: "claude-3-opus-20240229",
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt,
      });

      return {
        response: response.text,
        messageObject: response.message,
      };
    } catch (error) {
      logger.error("Erro ao gerar resposta empática:", error);
      throw error;
    }
  }

  /**
   * Analisa os sintomas do paciente e gera recomendações personalizadas
   * @param {Object} patientData - Dados do paciente
   * @returns {Promise<Object>} - Recomendações personalizadas
   */
  static async analyzeSymptoms(patientData) {
    try {
      const {
        currentSymptoms,
        painLevel,
        medications,
        recentActivities,
        sleepQuality,
        mood,
        previousTreatments,
      } = patientData;

      // Formatar os dados do paciente em texto
      const patientSummary = JSON.stringify({
        sintomas_atuais: currentSymptoms,
        nivel_dor: painLevel,
        medicacoes: medications,
        atividades_recentes: recentActivities,
        qualidade_sono: sleepQuality,
        humor: mood,
        tratamentos_anteriores: previousTreatments,
      });

      const systemPrompt = `
        Você é um especialista em fibromialgia. Analise os dados do paciente e forneça:
        
        1. Uma análise breve dos sintomas reportados
        2. Possíveis fatores desencadeantes com base nos dados
        3. Recomendações específicas e personalizadas para alívio dos sintomas
        4. Sugestões de monitoramento e próximos passos
        
        Responda em formato JSON com as propriedades:
        - "analise": string com a análise dos sintomas
        - "fatoresDesencadeantes": array de possíveis gatilhos
        - "recomendacoes": array de recomendações personalizadas
        - "proximosPassos": array de sugestões para monitoramento
        
        Lembre-se que estas recomendações não substituem orientações médicas.
      `;

      const messages = [
        { role: "user", content: `Dados do paciente: ${patientSummary}` },
      ];

      const response = await this.generateMessage(messages, {
        model: "claude-3-opus-20240229",
        temperature: 0.4,
        maxTokens: 2000,
        systemPrompt,
      });

      // Tentar extrair objeto JSON da resposta
      try {
        let jsonResponse;
        const content = response.text;

        // Verificar se a resposta é um JSON válido ou se precisa de extração
        if (content.includes("{") && content.includes("}")) {
          const jsonStr = content.substring(
            content.indexOf("{"),
            content.lastIndexOf("}") + 1
          );
          jsonResponse = JSON.parse(jsonStr);
        } else {
          jsonResponse = {
            error: "Formato de resposta inválido",
            raw: content,
          };
        }

        return jsonResponse;
      } catch (parseError) {
        logger.error("Erro ao analisar resposta JSON:", parseError);
        return {
          analise: "Não foi possível analisar completamente os sintomas.",
          fatoresDesencadeantes: [],
          recomendacoes: ["Consulte seu médico para uma avaliação adequada."],
          proximosPassos: [
            "Mantenha um diário de sintomas",
            "Siga as orientações médicas",
          ],
        };
      }
    } catch (error) {
      logger.error("Erro ao analisar sintomas:", error);
      throw error;
    }
  }

  /**
   * Gera conteúdo educativo sobre fibromialgia
   * @param {string} topic - Tópico específico sobre fibromialgia
   * @returns {Promise<Object>} - Conteúdo educativo
   */
  static async generateEducationalContent(topic) {
    try {
      const systemPrompt = `
        Você é um educador especializado em fibromialgia. Forneça informação educativa,
        precisa e baseada em evidências sobre o tópico solicitado. O conteúdo deve ser:
        
        1. Cientificamente preciso e atualizado
        2. Acessível para pacientes sem formação médica
        3. Informativo sem ser excessivamente técnico
        4. Estruturado de forma clara e organizada
        5. Focado em capacitar o paciente com conhecimento
        
        Limite sua resposta a informações relevantes para o tópico solicitado.
        Inclua referências a consensos médicos atuais quando apropriado.
      `;

      const messages = [
        {
          role: "user",
          content: `Por favor, forneça informações educativas sobre o seguinte aspecto da fibromialgia: "${topic}"`,
        },
      ];

      const response = await this.generateMessage(messages, {
        model: "claude-3-opus-20240229",
        temperature: 0.3,
        maxTokens: 3000,
        systemPrompt,
      });

      return {
        content: response.text,
        topic,
      };
    } catch (error) {
      logger.error("Erro ao gerar conteúdo educativo:", error);
      throw error;
    }
  }
}

module.exports = { anthropic, ClaudeService };
