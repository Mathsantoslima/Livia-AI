import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

interface WhatsAppRestartRequest {
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
    const { instanceName } = (await req.json()) as WhatsAppRestartRequest;

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

    // Atualizar o estado da instância para reiniciando
    await supabase
      .from("whatsapp_instances")
      .update({
        state: "RESTARTING",
        lastRestart: new Date().toISOString(),
      })
      .eq("instanceName", instanceName);

    try {
      // Reiniciar a instância usando a Evolution API
      await axiod.post(
        `${evolutionApiUrl}/instance/restart/${instanceName}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey,
          },
        }
      );

      // Aguardar um breve período para o reinício ser processado
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verificar o status da instância após o reinício
      const statusResponse = await axiod.get(
        `${evolutionApiUrl}/instance/connectionState/${instanceName}`,
        {
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey,
          },
        }
      );

      const isConnected = statusResponse.data.state === "open";
      const finalState = isConnected ? "CONNECTED" : "DISCONNECTED";

      // Atualizar o estado final no banco de dados
      await supabase
        .from("whatsapp_instances")
        .update({
          state: finalState,
          connected: isConnected,
          lastRestart: new Date().toISOString(),
        })
        .eq("instanceName", instanceName);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Instância reiniciada com sucesso",
          state: finalState,
          connected: isConnected,
          rawState: statusResponse.data.state,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (apiError) {
      console.error("Erro na API do Evolution:", apiError);

      // Em caso de erro, definir estado como desconectado
      await supabase
        .from("whatsapp_instances")
        .update({
          state: "ERROR",
          connected: false,
          lastRestart: new Date().toISOString(),
        })
        .eq("instanceName", instanceName);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Erro ao reiniciar instância",
          error: apiError.response?.data || apiError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro ao reiniciar WhatsApp:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno ao reiniciar WhatsApp",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
