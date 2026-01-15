import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

interface WhatsAppDisconnectRequest {
  instanceName: string;
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
    const { instanceName } = (await req.json()) as WhatsAppDisconnectRequest;

    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: "Nome da instância é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar se a instância existe
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

    try {
      // Desconectar a instância usando a Evolution API
      await axiod.delete(`${evolutionApiUrl}/instance/logout/${instanceName}`, {
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionApiKey,
        },
      });

      // Atualizar o estado da instância no banco de dados
      const { error: updateError } = await supabase
        .from("whatsapp_instances")
        .update({
          state: "DISCONNECTED",
          connected: false,
          lastDisconnection: new Date().toISOString(),
        })
        .eq("instanceName", instanceName);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar status da instância" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Instância desconectada com sucesso",
          state: "DISCONNECTED",
          connected: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (apiError) {
      console.error("Erro na API do Evolution:", apiError);

      // Mesmo se houver erro na API, marcar como desconectado no banco de dados
      await supabase
        .from("whatsapp_instances")
        .update({
          state: "ERROR",
          connected: false,
          lastDisconnection: new Date().toISOString(),
        })
        .eq("instanceName", instanceName);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Erro ao desconectar instância",
          error: apiError.response?.data || apiError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro ao desconectar WhatsApp:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno ao desconectar WhatsApp",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
