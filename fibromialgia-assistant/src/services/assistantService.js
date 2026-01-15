/**
 * Serviço do Assistente Virtual para Fibromialgia
 * Responsável pelo processamento de mensagens, intenções e respostas do assistente
 */

const axios = require("axios");
const config = require("../config");
const { createClient } = require("@supabase/supabase-js");

// Inicializa cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class AssistantService {
  /**
   * Processa mensagem recebida e retorna uma resposta apropriada
   * @param {string} from - Número de telefone de quem enviou a mensagem
   * @param {string} message - Texto da mensagem
   * @returns {Promise<string>} - Resposta do assistente
   */
  async processMessage(from, message) {
    try {
      // Registra a mensagem recebida no banco de dados
      await this.saveIncomingMessage(from, message);

      // Identificar o paciente ou registrar um novo
      const patient = await this.identifyPatient(from);

      // Processa a intenção da mensagem
      const intent = await this.identifyIntent(message);

      // Gera resposta baseada na intenção
      const response = await this.generateResponse(intent, patient, message);

      // Registra resposta no banco de dados
      await this.saveOutgoingMessage(from, response);

      return response;
    } catch (error) {
      console.error("Erro no processamento da mensagem:", error);
      return "Desculpe, estou com dificuldades para processar sua mensagem agora. Por favor, tente novamente em alguns instantes.";
    }
  }

  /**
   * Registra mensagem recebida no banco de dados
   * @param {string} from - Número de telefone do remetente
   * @param {string} message - Conteúdo da mensagem
   */
  async saveIncomingMessage(from, message) {
    try {
      await supabase.from("whatsapp_messages").insert({
        phone: from,
        message: message,
        instanceName: "primary", // TODO: tornar dinâmico se houver múltiplas instâncias
        direction: "INBOUND",
        status: "RECEIVED",
      });
    } catch (error) {
      console.error("Erro ao salvar mensagem recebida:", error);
      // Continua o fluxo mesmo com erro de persistência
    }
  }

  /**
   * Registra mensagem enviada no banco de dados
   * @param {string} to - Número de telefone do destinatário
   * @param {string} message - Conteúdo da mensagem
   */
  async saveOutgoingMessage(to, message) {
    try {
      await supabase.from("whatsapp_messages").insert({
        phone: to,
        message: message,
        instanceName: "primary", // TODO: tornar dinâmico
        direction: "OUTBOUND",
        status: "SENT",
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao salvar mensagem enviada:", error);
      // Continua o fluxo mesmo com erro de persistência
    }
  }

  /**
   * Identifica ou registra um paciente com base no número de telefone
   * @param {string} phone - Número de telefone
   * @returns {Promise<Object>} - Dados do paciente
   */
  async identifyPatient(phone) {
    try {
      // Busca paciente existente
      const { data: existingPatient, error } = await supabase
        .from("patients")
        .select("*")
        .eq("phone", phone)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (existingPatient) {
        return existingPatient;
      }

      // Registra novo paciente
      const { data: newPatient, error: insertError } = await supabase
        .from("patients")
        .insert({
          phone: phone,
          name: null, // Será atualizado durante o onboarding
          status: "new",
          onboarding_completed: false,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return newPatient;
    } catch (error) {
      console.error("Erro ao identificar/registrar paciente:", error);
      // Retornar um objeto padrão para não quebrar o fluxo
      return { phone: phone, status: "unknown" };
    }
  }

  /**
   * Identifica a intenção da mensagem do usuário
   * @param {string} message - Texto da mensagem
   * @returns {Promise<string>} - Intenção identificada
   */
  async identifyIntent(message) {
    // Implementação simples baseada em palavras-chave
    const msg = message.toLowerCase();

    if (msg.includes("ajuda") || msg.includes("help")) {
      return "help";
    } else if (msg.includes("dor") || msg.includes("doendo")) {
      return "pain_report";
    } else if (
      msg.includes("remédio") ||
      msg.includes("medicamento") ||
      msg.includes("medicação")
    ) {
      return "medication";
    } else if (msg.includes("exercício") || msg.includes("exercicios")) {
      return "exercises";
    } else if (msg.includes("sono") || msg.includes("dormir")) {
      return "sleep";
    } else if (
      msg.includes("olá") ||
      msg.includes("oi") ||
      msg.includes("bom dia") ||
      msg.includes("boa tarde") ||
      msg.includes("boa noite")
    ) {
      return "greeting";
    }

    // Intenção padrão se não reconhecer nenhuma específica
    return "unknown";
  }

  /**
   * Gera resposta com base na intenção identificada e dados do paciente
   * @param {string} intent - Intenção identificada
   * @param {Object} patient - Dados do paciente
   * @param {string} message - Mensagem original do usuário
   * @returns {Promise<string>} - Resposta gerada
   */
  async generateResponse(intent, patient, message) {
    // Verifica se o paciente ainda não completou o onboarding
    if (patient.onboarding_completed === false) {
      return this.handleOnboarding(patient, message);
    }

    // Respostas baseadas na intenção
    switch (intent) {
      case "greeting":
        return `Olá ${
          patient.name || ""
        }! Como está se sentindo hoje? Estou aqui para ajudar com seu acompanhamento para fibromialgia.`;

      case "help":
        return `Posso ajudar você a monitorar sua dor, lembrar de medicamentos, sugerir exercícios e fornecer informações sobre fibromialgia. O que você precisa hoje?`;

      case "pain_report":
        return `Entendi que você está com dor. Em uma escala de 0 a 10, qual é a intensidade da sua dor no momento? E em qual parte do corpo está sentindo dor?`;

      case "medication":
        return `Sobre sua medicação, gostaria de registrar um novo medicamento, ver os medicamentos atuais, ou receber um lembrete?`;

      case "exercises":
        return `Exercícios leves podem ajudar no tratamento da fibromialgia. Posso recomendar alguns exercícios de alongamento ou respiração. Você gostaria disso?`;

      case "sleep":
        return `O sono é fundamental para pessoas com fibromialgia. Como está sua qualidade de sono ultimamente? Tem dificuldades para dormir?`;

      default:
        return `Obrigado pela sua mensagem. Em que posso ajudar com seu tratamento para fibromialgia hoje?`;
    }
  }

  /**
   * Gerencia o processo de onboarding de novos pacientes
   * @param {Object} patient - Dados do paciente
   * @param {string} message - Mensagem recebida
   * @returns {string} - Resposta para o paciente
   */
  async handleOnboarding(patient, message) {
    // Se for a primeira interação (status new)
    if (patient.status === "new" || patient.status === "unknown") {
      // Atualizar status para primeira etapa do onboarding
      try {
        await supabase
          .from("patients")
          .update({ status: "onboarding_name" })
          .eq("phone", patient.phone);
      } catch (error) {
        console.error("Erro ao atualizar status do paciente:", error);
      }

      return `Olá! Eu sou o Assistente Virtual para Fibromialgia. Estou aqui para ajudar com seu acompanhamento. Como você gostaria de ser chamado(a)?`;
    }

    // Coleta o nome do paciente
    else if (patient.status === "onboarding_name") {
      const name = message.trim();

      try {
        await supabase
          .from("patients")
          .update({
            name: name,
            status: "onboarding_confirm",
          })
          .eq("phone", patient.phone);
      } catch (error) {
        console.error("Erro ao atualizar nome do paciente:", error);
      }

      return `Muito prazer, ${name}! Você foi diagnosticado(a) com fibromialgia? Por favor, responda com "Sim" ou "Não".`;
    }

    // Confirma diagnóstico
    else if (patient.status === "onboarding_confirm") {
      const response = message.toLowerCase();
      let nextStatus = "active";
      let hasDiagnosis = false;

      if (response.includes("sim") || response === "s") {
        hasDiagnosis = true;
        nextStatus = "onboarding_pain";
      }

      try {
        await supabase
          .from("patients")
          .update({
            has_diagnosis: hasDiagnosis,
            status: nextStatus,
          })
          .eq("phone", patient.phone);
      } catch (error) {
        console.error("Erro ao atualizar diagnóstico do paciente:", error);
      }

      if (hasDiagnosis) {
        return `Obrigado pela informação. Em uma escala de 0 a 10, como você classificaria sua dor hoje?`;
      } else {
        // Completar onboarding se não tiver diagnóstico
        try {
          await supabase
            .from("patients")
            .update({
              onboarding_completed: true,
            })
            .eq("phone", patient.phone);
        } catch (error) {
          console.error("Erro ao finalizar onboarding:", error);
        }

        return `Entendi. Mesmo sem diagnóstico formal, posso fornecer informações sobre fibromialgia e práticas de bem-estar. Se tiver dúvidas, é só perguntar!`;
      }
    }

    // Registra nível de dor inicial
    else if (patient.status === "onboarding_pain") {
      let painLevel = parseInt(message.trim());
      if (isNaN(painLevel)) {
        painLevel = null;
      }

      try {
        await supabase
          .from("patients")
          .update({
            current_pain_level: painLevel,
            status: "active",
            onboarding_completed: true,
          })
          .eq("phone", patient.phone);
      } catch (error) {
        console.error("Erro ao registrar nível de dor:", error);
      }

      return `Obrigado por compartilhar essa informação. Agora estou pronto para ajudar você com seu acompanhamento. Posso fornecer informações sobre manejo de dor, exercícios, sono e muito mais. Como posso ajudar hoje?`;
    }

    // Fallback para qualquer outro estado
    return `Olá! Como posso ajudar com seu tratamento para fibromialgia hoje?`;
  }

  /**
   * Envia uma mensagem pelo WhatsApp
   * @param {string} to - Número de telefone do destinatário
   * @param {string} message - Mensagem a ser enviada
   * @returns {Promise<boolean>} - Sucesso do envio
   */
  async sendMessage(to, message) {
    try {
      // Usar a API do WhatsApp configurada
      const response = await axios.post(
        `${config.whatsapp.apiUrl}/send`,
        { to, message },
        {
          headers: {
            "x-api-key": config.whatsapp.apiKey,
          },
        }
      );

      return response.data && response.data.status === "success";
    } catch (error) {
      console.error("Erro ao enviar mensagem via WhatsApp:", error);
      return false;
    }
  }
}

module.exports = new AssistantService();
