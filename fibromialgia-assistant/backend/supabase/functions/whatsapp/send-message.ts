import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

interface WhatsAppSendMessageRequest {
  instanceName: string;
  phone: string;
  message: string;
}

serve(async (req) => {
  try {
    // Criar cliente Supabase com chave de serviço
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter configurações da Evolution API
    const evolutionApiUrl =
      Deno.env.get("EVOLUTION_API_URL") || "http://localhost:8080";
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY") || "";

    // Extrair dados da requisição
    const { instanceName, phone, message } =
      (await req.json()) as WhatsAppSendMessageRequest;

    if (!instanceName || !phone || !message) {
      return new Response(
        JSON.stringify({
          error: "Nome da instância, telefone e mensagem são obrigatórios",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar se a instância existe e está conectada
    const { data: instance, error: instanceError } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("instanceName", instanceName)
      .single();

    if (instanceError || !instance) {
      return new Response(
        JSON.stringify({ error: "Instância não encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!instance.connected || instance.state !== "CONNECTED") {
      return new Response(
        JSON.stringify({ error: "Instância não está conectada" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Formatar número de telefone (remover caracteres não numéricos)
    const formattedPhone = phone.replace(/\D/g, "");

    try {
      // Enviar mensagem através da Evolution API
      const response = await axiod.post(
        `${evolutionApiUrl}/message/text/${instanceName}`,
        {
          number: formattedPhone,
          options: {
            delay: 1200,
            presence: "composing",
          },
          textMessage: {
            text: message,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey,
          },
        }
      );

      // Registrar a mensagem no banco de dados com o status baseado na resposta da API
      const { error: messageError } = await supabase
        .from("whatsapp_messages")
        .insert([
          {
            instanceName,
            phone: formattedPhone,
            message,
            status: response.status === 200 ? "SENT" : "FAILED",
            sentAt: new Date().toISOString(),
            direction: "OUTBOUND",
            response_data: JSON.stringify(response.data),
          },
        ]);

      if (messageError) {
        console.error("Erro ao registrar mensagem:", messageError);
      }

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Mensagem enviada com sucesso",
          details: {
            instanceName,
            phone: formattedPhone,
            timestamp: new Date().toISOString(),
            apiResponse: response.data,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (apiError) {
      console.error("Erro na API do Evolution:", apiError);

      // Registrar a falha de envio no banco de dados
      await supabase.from("whatsapp_messages").insert([
        {
          instanceName,
          phone: formattedPhone,
          message,
          status: "FAILED",
          sentAt: new Date().toISOString(),
          direction: "OUTBOUND",
          error_data: JSON.stringify(
            apiError.response?.data || apiError.message
          ),
        },
      ]);

      return new Response(
        JSON.stringify({
          status: "error",
          message: "Falha ao enviar mensagem através da Evolution API",
          details: apiError.response?.data || apiError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno ao enviar mensagem",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
