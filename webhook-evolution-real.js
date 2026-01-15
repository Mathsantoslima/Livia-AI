/**
 * WEBHOOK PARA EVOLUTION API - DADOS 100% REAIS
 * Sistema completo para capturar e analisar dados reais do WhatsApp
 */

const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const cors = require("cors");

// Configuração do Supabase (DADOS REAIS)
const supabaseUrl = "https://dbwrpdxwfqqbsngijrle.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M";

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

// ==============================================
// ANÁLISE DE SENTIMENTO REAL EM PORTUGUÊS
// ==============================================

const analisesSentimento = {
  // Palavras positivas relacionadas à fibromialgia
  positivas: [
    "melhor",
    "bem",
    "ótimo",
    "bom",
    "feliz",
    "alegre",
    "consegui",
    "melhorou",
    "aliviou",
    "dormindo",
    "descansada",
    "tranquila",
    "conseguindo",
    "aliviada",
    "energia",
    "força",
    "otimista",
    "esperança",
    "grata",
    "obrigada",
    "ajudou",
    "funciona",
  ],

  // Palavras negativas relacionadas à fibromialgia
  negativas: [
    "dor",
    "mal",
    "pior",
    "ruim",
    "triste",
    "difícil",
    "cansada",
    "doendo",
    "dolorido",
    "terrível",
    "horrível",
    "insuportável",
    "exausta",
    "fadiga",
    "deprimida",
    "desanimada",
    "angustiada",
    "não aguento",
    "sofrendo",
    "chorar",
    "desespero",
    "ansiedade",
  ],

  // Sintomas específicos da fibromialgia
  sintomas: [
    "fibromialgia",
    "articular",
    "muscular",
    "rigidez",
    "formigamento",
    "queimação",
    "pontadas",
    "latejando",
    "tensão",
    "contratura",
    "insônia",
    "sono",
    "cansaço",
    "memória",
    "concentração",
    "névoa",
  ],
};

function analisarSentimento(texto) {
  const textoLower = texto.toLowerCase();
  let scorePositivo = 0;
  let scoreNegativo = 0;
  let sintomas = [];
  let categoria = "conversa";

  // Contar palavras positivas
  analisesSentimento.positivas.forEach((palavra) => {
    if (textoLower.includes(palavra)) {
      scorePositivo++;
    }
  });

  // Contar palavras negativas
  analisesSentimento.negativas.forEach((palavra) => {
    if (textoLower.includes(palavra)) {
      scoreNegativo++;
    }
  });

  // Detectar sintomas mencionados
  analisesSentimento.sintomas.forEach((sintoma) => {
    if (textoLower.includes(sintoma)) {
      sintomas.push(sintoma);
      categoria = "sintoma";
    }
  });

  // Detectar categorias específicas
  if (textoLower.includes("check") || textoLower.includes("como está")) {
    categoria = "checkin";
  } else if (
    textoLower.includes("exercício") ||
    textoLower.includes("alongamento")
  ) {
    categoria = "exercicio";
  } else if (
    textoLower.includes("medicação") ||
    textoLower.includes("remédio")
  ) {
    categoria = "medicacao";
  }

  // Determinar sentimento
  let sentimento = "neutral";
  if (scorePositivo > scoreNegativo) {
    sentimento = "positive";
  } else if (scoreNegativo > scorePositivo) {
    sentimento = "negative";
  }

  return {
    sentimento,
    categoria,
    sintomas,
    scorePositivo,
    scoreNegativo,
  };
}

// ==============================================
// PROCESSAMENTO DE WEBHOOKS DA EVOLUTION API
// ==============================================

app.post("/webhook/evolution", async (req, res) => {
  try {
    console.log(
      "🔄 Webhook Evolution recebido:",
      JSON.stringify(req.body, null, 2)
    );

    const webhookData = req.body;

    // Verificar se é mensagem válida
    if (
      !webhookData.data ||
      !webhookData.data.key ||
      !webhookData.data.message
    ) {
      console.log("❌ Webhook ignorado - dados incompletos");
      return res
        .status(200)
        .json({ status: "ignored", reason: "incomplete_data" });
    }

    const messageData = webhookData.data;
    const messageKey = messageData.key;
    const message = messageData.message;

    // Extrair informações da mensagem
    const telefone = messageKey.remoteJid?.replace("@s.whatsapp.net", "") || "";
    const isFromUser = !messageKey.fromMe;
    const messageText =
      message.conversation || message.extendedTextMessage?.text || "";

    // Ignorar mensagens vazias ou de grupo
    if (!messageText || telefone.includes("@g.us")) {
      console.log("❌ Mensagem ignorada - vazia ou de grupo");
      return res
        .status(200)
        .json({ status: "ignored", reason: "empty_or_group" });
    }

    console.log(`📱 Processando mensagem real:
      Telefone: ${telefone}
      De usuário: ${isFromUser}
      Texto: "${messageText}"`);

    // 1. BUSCAR OU CRIAR USUÁRIO REAL
    let { data: usuario, error: userError } = await supabase
      .from("users_livia")
      .select("*")
      .eq("phone", telefone)
      .single();

    if (userError && userError.code === "PGRST116") {
      // Usuário não existe, criar novo
      const { data: novoUsuario, error: createError } = await supabase
        .from("users_livia")
        .insert({
          phone: telefone,
          primeiro_contato: new Date().toISOString(),
          ultimo_contato: new Date().toISOString(),
          status: "active",
          nivel_engajamento: 0.1,
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Erro ao criar usuário:", createError);
        throw createError;
      }

      usuario = novoUsuario;
      console.log(`✅ Novo usuário criado: ${usuario.id}`);
    } else if (userError) {
      throw userError;
    }

    // 2. ANÁLISE DE SENTIMENTO E CATEGORIZAÇÃO
    const analise = analisarSentimento(messageText);

    // 3. SALVAR MENSAGEM REAL NO BANCO
    const { data: mensagem, error: messageError } = await supabase
      .from("conversations_livia")
      .insert({
        user_id: usuario.id,
        content: messageText,
        is_from_user: isFromUser,
        classificacao_sentimento: analise.sentimento,
        categoria: analise.categoria,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError) {
      console.error("❌ Erro ao salvar mensagem:", messageError);
      throw messageError;
    }

    console.log(`✅ Mensagem salva com sentimento: ${analise.sentimento}`);

    // 4. ATUALIZAR ÚLTIMO CONTATO DO USUÁRIO
    if (isFromUser) {
      await supabase
        .from("users_livia")
        .update({
          ultimo_contato: new Date().toISOString(),
          nivel_engajamento: Math.min(
            1.0,
            (usuario.nivel_engajamento || 0) + 0.05
          ),
        })
        .eq("id", usuario.id);
    }

    // 5. LOG DE ENGAJAMENTO REAL
    await supabase.from("engagement_logs").insert({
      user_id: usuario.id,
      evento: isFromUser ? "mensagem_usuario" : "mensagem_livia",
      timestamp: new Date().toISOString(),
      detalhes: {
        sentimento: analise.sentimento,
        categoria: analise.categoria,
        sintomas: analise.sintomas,
        texto_length: messageText.length,
      },
    });

    // 6. DETECTAR PADRÕES AUTOMÁTICOS (se for mensagem de usuário com sintomas)
    if (isFromUser && analise.sintomas.length > 0) {
      await detectarPadroes(usuario.id, analise);
    }

    console.log("✅ Webhook processado com sucesso");

    return res.status(200).json({
      status: "success",
      user_id: usuario.id,
      message_id: mensagem.id,
      sentimento: analise.sentimento,
      categoria: analise.categoria,
      sintomas_detectados: analise.sintomas.length,
    });
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// ==============================================
// DETECÇÃO AUTOMÁTICA DE PADRÕES
// ==============================================

async function detectarPadroes(userId, analise) {
  try {
    // Verificar se já existe padrão similar
    const { data: padraoExistente } = await supabase
      .from("patterns_detected")
      .select("*")
      .eq("user_id", userId)
      .eq("tipo_padrao", "sintoma_temporal")
      .eq("ativo", true)
      .single();

    if (!padraoExistente) {
      // Criar novo padrão
      await supabase.from("patterns_detected").insert({
        user_id: userId,
        tipo_padrao: "sintoma_temporal",
        descricao: `Relatos frequentes de ${analise.sintomas.join(", ")}`,
        relevancia: analise.sintomas.length * 0.2,
        ativo: true,
        ultima_ocorrencia: new Date().toISOString(),
        dados_suporte: {
          sintomas: analise.sintomas,
          sentimento: analise.sentimento,
        },
      });

      console.log(`🔍 Novo padrão detectado para usuário ${userId}`);
    } else {
      // Atualizar padrão existente
      await supabase
        .from("patterns_detected")
        .update({
          ultima_ocorrencia: new Date().toISOString(),
          relevancia: Math.min(1.0, padraoExistente.relevancia + 0.1),
        })
        .eq("id", padraoExistente.id);
    }
  } catch (error) {
    console.error("❌ Erro ao detectar padrões:", error);
  }
}

// ==============================================
// ENDPOINT PARA ESTATÍSTICAS REAIS
// ==============================================

app.get("/api/stats/real", async (req, res) => {
  try {
    // Buscar estatísticas reais do banco
    const { data: usuarios } = await supabase
      .from("users_livia")
      .select("id, status, nivel_engajamento, primeiro_contato");

    const { data: mensagens } = await supabase
      .from("conversations_livia")
      .select("created_at, is_from_user, classificacao_sentimento")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const { data: padroes } = await supabase
      .from("patterns_detected")
      .select("*")
      .eq("ativo", true);

    const stats = {
      usuarios_totais: usuarios?.length || 0,
      usuarios_ativos:
        usuarios?.filter((u) => u.status === "active").length || 0,
      mensagens_hoje: mensagens?.length || 0,
      mensagens_usuarios_hoje:
        mensagens?.filter((m) => m.is_from_user).length || 0,
      padroes_ativos: padroes?.length || 0,
      engajamento_medio:
        usuarios?.length > 0
          ? usuarios.reduce((acc, u) => acc + (u.nivel_engajamento || 0), 0) /
            usuarios.length
          : 0,
      sentimentos_hoje: {
        positive:
          mensagens?.filter((m) => m.classificacao_sentimento === "positive")
            .length || 0,
        negative:
          mensagens?.filter((m) => m.classificacao_sentimento === "negative")
            .length || 0,
        neutral:
          mensagens?.filter((m) => m.classificacao_sentimento === "neutral")
            .length || 0,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Estatísticas reais geradas:", stats);

    res.json(stats);
  } catch (error) {
    console.error("❌ Erro ao gerar estatísticas:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// ENDPOINTS PARA TESTE E MONITORAMENTO
// ==============================================

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    message: "Webhook Evolution API - Dados Reais",
  });
});

app.get("/api/test-connection", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users_livia")
      .select("count")
      .limit(1);

    if (error) throw error;

    res.json({
      status: "connected",
      supabase: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// ==============================================
// INICIALIZAÇÃO DO SERVIDOR
// ==============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
🚀 Webhook Evolution API - Dados Reais
📡 Servidor rodando na porta ${PORT}
🔗 Webhook URL: http://localhost:${PORT}/webhook/evolution
📊 Stats: http://localhost:${PORT}/api/stats/real
💚 Health: http://localhost:${PORT}/health

✅ Configurado para capturar dados 100% reais da Evolution API
📱 Telefones serão automaticamente registrados como usuários
🧠 Análise de sentimento automática em português
🔍 Detecção de padrões em tempo real
  `);
});

module.exports = app;
