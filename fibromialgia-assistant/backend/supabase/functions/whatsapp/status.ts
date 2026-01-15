import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

interface WhatsAppStatusRequest {
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
    const { instanceName } = (await req.json()) as WhatsAppStatusRequest;

    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: "Nome da instância é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar se a instância existe no banco
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

    // Verificar o status da instância na Evolution API
    try {
      const response = await axiod.get(
        `${evolutionApiUrl}/instance/connectionState/${instanceName}`,
        {
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey,
          },
        }
      );

      // Verificar se temos um número associado à instância
      let phoneNumber = instance.number;

      // Se a instância estiver conectada, mas não temos o número, obtemos o perfil
      if (response.data.state === "open" && !phoneNumber) {
        try {
          const profileResponse = await axiod.get(
            `${evolutionApiUrl}/instance/fetchInstances/${instanceName}`,
            {
              headers: {
                "Content-Type": "application/json",
                apikey: evolutionApiKey,
              },
            }
          );

          if (profileResponse.data && profileResponse.data.instance) {
            phoneNumber = profileResponse.data.instance.wuid || null;
          }
        } catch (profileError) {
          console.error("Erro ao obter perfil:", profileError);
        }
      }

      // Mapear o estado da Evolution API para o nosso formato
      const connected = response.data.state === "open";
      const state = connected ? "CONNECTED" : "DISCONNECTED";

      // Atualizar o status da instância no banco de dados
      await supabase
        .from("whatsapp_instances")
        .update({
          state,
          connected,
          number: phoneNumber,
          lastConnection: new Date().toISOString(),
        })
        .eq("instanceName", instanceName);

      return new Response(
        JSON.stringify({
          connected,
          state,
          number: phoneNumber,
          lastConnection: new Date().toISOString(),
          rawState: response.data.state, // Manter o estado original da API para debug
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (apiError) {
      console.error("Erro ao verificar status na Evolution API:", apiError);

      // Se houver erro na API, retornamos o último status conhecido
      return new Response(
        JSON.stringify({
          connected: instance.connected,
          state: instance.state,
          number: instance.number,
          lastConnection: instance.lastConnection,
          error: "Erro ao comunicar com a Evolution API",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro ao verificar status do WhatsApp:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno ao verificar status do WhatsApp",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
