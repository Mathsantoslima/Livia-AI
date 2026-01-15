import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

interface WhatsAppConnectRequest {
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
    const { instanceName } = (await req.json()) as WhatsAppConnectRequest;

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

    // Se não existir no banco, primeiro verificamos se existe na Evolution API
    if (instanceError || !instance) {
      try {
        // Verificar se a instância existe na Evolution API
        const evolutionResponse = await axiod.get(
          `${evolutionApiUrl}/instance/connectionState/${instanceName}`,
          {
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionApiKey,
            },
          }
        );

        // Se a requisição for bem-sucedida mas a instância não existir, precisamos criá-la
        if (evolutionResponse.status !== 200) {
          // Criar a instância na Evolution API
          await axiod.post(
            `${evolutionApiUrl}/instance/create`,
            {
              instanceName,
              webhook: false,
              qrcode: true,
              status: true,
              mode: "DEFAULT",
            },
            {
              headers: {
                "Content-Type": "application/json",
                apikey: evolutionApiKey,
              },
            }
          );

          // Inserir a instância no banco
          await supabase.from("whatsapp_instances").insert([
            {
              instanceName,
              state: "DISCONNECTED",
              connected: false,
              isPrimary: true,
              lastConnection: new Date().toISOString(),
            },
          ]);
        }
      } catch (apiError) {
        // Se a instância não existir na Evolution API, criamos
        await axiod.post(
          `${evolutionApiUrl}/instance/create`,
          {
            instanceName,
            webhook: false,
            qrcode: true,
            status: true,
            mode: "DEFAULT",
          },
          {
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionApiKey,
            },
          }
        );

        // Inserir a instância no banco
        await supabase.from("whatsapp_instances").insert([
          {
            instanceName,
            state: "DISCONNECTED",
            connected: false,
            isPrimary: true,
            lastConnection: new Date().toISOString(),
          },
        ]);
      }
    }

    // Conectar a instância usando a Evolution API
    const connectResponse = await axiod.post(
      `${evolutionApiUrl}/instance/connect/${instanceName}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionApiKey,
        },
      }
    );

    // Obter o QR code
    const qrResponse = await axiod.get(
      `${evolutionApiUrl}/instance/qrcode/${instanceName}`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionApiKey,
        },
      }
    );

    // Atualizar o estado da instância
    await supabase
      .from("whatsapp_instances")
      .update({
        state: "CONNECTING",
        lastConnection: new Date().toISOString(),
      })
      .eq("instanceName", instanceName);

    return new Response(
      JSON.stringify({
        qrcode: qrResponse.data.qrcode,
        state: "CONNECTING",
        message: "QR code gerado com sucesso. Escaneie com seu WhatsApp.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao conectar WhatsApp:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno ao conectar WhatsApp",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
