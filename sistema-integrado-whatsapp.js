// =========================================
// SISTEMA INTEGRADO WHATSAPP
// Baileys (QR Code) + Evolution API (Webhook)
// =========================================

const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const { createClient } = require("@supabase/supabase-js");
const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

// ==============================================
// CONFIGURAÇÕES
// ==============================================

const PORT = 8080;
const SESSION_DIR = "./sessions";

// Supabase
const supabaseUrl = "https://dbwrpdxwfqqbsngijrle.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3NDIyNTYsImV4cCI6MjA0ODMxODI1Nn0.TI4v6AOMPHVFrOZ2FHvdnJw6j6JqQ1vH6bfFq2w-9-4";
const supabase = createClient(supabaseUrl, supabaseKey);

// Estados globais
let sock = null;
let qrCode = null;
let connectionStatus = "disconnected";
let phoneNumber = null;
let lastQrTime = null;

// ==============================================
// SERVIDOR EXPRESS
// ==============================================

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================================
// ENDPOINTS BAILEYS (QR CODE)
// ==============================================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    service: "Sistema Integrado WhatsApp",
    baileys: connectionStatus,
    qr_available: !!qrCode,
    phone: phoneNumber,
    timestamp: new Date().toISOString(),
  });
});

// Status da conexão
app.get("/status", (req, res) => {
  res.json({
    status: connectionStatus,
    qr_available: !!qrCode,
    phone: phoneNumber,
    last_qr: lastQrTime,
    connected: connectionStatus === "connected",
  });
});

// Obter QR Code
app.get("/qr", (req, res) => {
  if (qrCode) {
    res.json({
      success: true,
      qr: qrCode,
      status: connectionStatus,
      timestamp: lastQrTime,
    });
  } else {
    res.json({
      success: false,
      message: "QR Code não disponível",
      status: connectionStatus,
    });
  }
});

// Conectar WhatsApp
app.post("/connect", async (req, res) => {
  try {
    if (connectionStatus === "connected") {
      return res.json({
        success: false,
        message: "WhatsApp já está conectado",
        phone: phoneNumber,
      });
    }

    await iniciarBaileys();

    res.json({
      success: true,
      message: "Iniciando conexão...",
      status: connectionStatus,
    });
  } catch (error) {
    console.error("❌ Erro ao conectar:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao iniciar conexão",
      error: error.message,
    });
  }
});

// Desconectar WhatsApp
app.post("/logout", async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }

    // Limpar sessão
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }

    connectionStatus = "disconnected";
    qrCode = null;
    phoneNumber = null;
    sock = null;

    res.json({
      success: true,
      message: "WhatsApp desconectado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao desconectar:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao desconectar",
      error: error.message,
    });
  }
});

// ==============================================
// ENDPOINTS EVOLUTION API (WEBHOOK)
// ==============================================

// Webhook da Evolution API
app.post("/webhook/evolution", async (req, res) => {
  try {
    console.log(
      "📡 Webhook Evolution recebido:",
      JSON.stringify(req.body, null, 2)
    );

    const { data, event } = req.body;

    // Processar diferentes tipos de eventos
    if (event === "messages.upsert") {
      await processarMensagemEvolution(data);
    } else if (event === "connection.update") {
      await processarConexaoEvolution(data);
    }

    res.json({ success: true, message: "Webhook processado" });
  } catch (error) {
    console.error("❌ Erro no webhook Evolution:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check da Evolution API
app.get("/webhook/health", (req, res) => {
  res.json({
    status: "online",
    service: "Evolution API Webhook",
    timestamp: new Date().toISOString(),
  });
});

// ==============================================
// ENDPOINTS DE ESTATÍSTICAS
// ==============================================

app.get("/api/stats/real", async (req, res) => {
  try {
    const stats = await gerarEstatisticasReais();
    res.json(stats);
  } catch (error) {
    console.error("❌ Erro ao gerar estatísticas:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// FUNCÕES BAILEYS
// ==============================================

async function iniciarBaileys() {
  try {
    console.log("🔄 Iniciando conexão Baileys...");

    // Criar diretório de sessões se não existir
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    // Configurar autenticação multi-arquivo
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    // Criar logger customizado completo
    const customLogger = {
      level: "silent",
      info: () => {},
      error: () => {},
      debug: () => {},
      warn: () => {},
      trace: () => {},
      fatal: () => {},
      child: () => customLogger,
    };

    // Criar socket do WhatsApp com logger customizado
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: customLogger,
    });

    // Evento: QR Code gerado
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📱 QR Code gerado!");
        try {
          qrCode = await QRCode.toDataURL(qr);
          lastQrTime = new Date();
          connectionStatus = "qr";
          console.log("✅ QR Code convertido para base64");
        } catch (error) {
          console.error("❌ Erro ao gerar QR Code:", error);
        }
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;
        console.log("🔌 Conexão fechada. Reconectar?", shouldReconnect);

        if (shouldReconnect) {
          connectionStatus = "reconnecting";
          setTimeout(() => iniciarBaileys(), 3000);
        } else {
          connectionStatus = "disconnected";
          qrCode = null;
          phoneNumber = null;
        }
      } else if (connection === "open") {
        console.log("✅ WhatsApp conectado com sucesso!");
        connectionStatus = "connected";
        qrCode = null;

        // Obter número do telefone
        const info = sock.user;
        if (info) {
          phoneNumber = info.id.split(":")[0];
          console.log(`📱 Número conectado: ${phoneNumber}`);
        }
      }
    });

    // Evento: credenciais atualizadas
    sock.ev.on("creds.update", saveCreds);

    // Evento: nova mensagem (Baileys)
    sock.ev.on("messages.upsert", async (m) => {
      const messages = m.messages;
      for (const message of messages) {
        try {
          await processarMensagemBaileys(message);
        } catch (error) {
          console.error("❌ Erro ao processar mensagem Baileys:", error);
        }
      }
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar Baileys:", error);
    connectionStatus = "error";
    setTimeout(() => iniciarBaileys(), 5000);
  }
}

// ==============================================
// PROCESSAMENTO DE MENSAGENS
// ==============================================

// Processar mensagem do Baileys
async function processarMensagemBaileys(message) {
  try {
    if (!message.key || !message.message) return;

    const isFromUser = !message.key.fromMe;
    const telefone = message.key.remoteJid?.replace("@s.whatsapp.net", "");
    const messageText =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";

    if (!messageText || telefone.includes("@g.us")) return;

    console.log(`📱 [BAILEYS] Nova mensagem: ${telefone} - "${messageText}"`);

    await processarMensagemComum(telefone, messageText, isFromUser, "baileys");
  } catch (error) {
    console.error("❌ Erro ao processar mensagem Baileys:", error);
  }
}

// Processar mensagem da Evolution API
async function processarMensagemEvolution(data) {
  try {
    if (!data || !data.messages) return;

    for (const message of data.messages) {
      const telefone = message.key?.remoteJid?.replace("@s.whatsapp.net", "");
      const messageText =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        "";
      const isFromUser = !message.key?.fromMe;

      if (!messageText || telefone.includes("@g.us")) continue;

      console.log(
        `📡 [EVOLUTION] Nova mensagem: ${telefone} - "${messageText}"`
      );

      await processarMensagemComum(
        telefone,
        messageText,
        isFromUser,
        "evolution"
      );
    }
  } catch (error) {
    console.error("❌ Erro ao processar mensagem Evolution:", error);
  }
}

// Função comum para processar mensagens
async function processarMensagemComum(
  telefone,
  messageText,
  isFromUser,
  fonte
) {
  try {
    // 1. BUSCAR OU CRIAR USUÁRIO
    let { data: usuario, error: userError } = await supabase
      .from("users_livia")
      .select("*")
      .eq("phone", telefone)
      .single();

    if (userError && userError.code === "PGRST116") {
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
        return;
      }

      usuario = novoUsuario;
      console.log(`✅ Novo usuário criado: ${usuario.id}`);
    }

    // 2. ANÁLISE DE SENTIMENTO
    const analise = analisarSentimento(messageText);

    // 3. SALVAR MENSAGEM
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
      return;
    }

    console.log(
      `✅ [${fonte.toUpperCase()}] Mensagem salva: ${analise.sentimento}`
    );

    // 4. ATUALIZAR ENGAJAMENTO
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

    // 5. LOG DE ENGAJAMENTO
    await supabase.from("engagement_logs").insert({
      user_id: usuario.id,
      evento: isFromUser ? "mensagem_usuario" : "mensagem_livia",
      timestamp: new Date().toISOString(),
      detalhes: {
        sentimento: analise.sentimento,
        categoria: analise.categoria,
        sintomas: analise.sintomas,
        fonte: fonte,
        texto_length: messageText.length,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao processar mensagem comum:", error);
  }
}

// ==============================================
// ANÁLISE DE SENTIMENTO
// ==============================================

function analisarSentimento(texto) {
  const textoLower = texto.toLowerCase();

  // Palavras para diferentes sentimentos
  const palavrasPositivas = [
    "obrigado",
    "obrigada",
    "melhor",
    "bem",
    "ótimo",
    "bom",
    "feliz",
    "alegre",
    "gratidão",
  ];
  const palavrasNegativas = [
    "dor",
    "ruim",
    "mal",
    "pior",
    "triste",
    "cansado",
    "cansada",
    "doendo",
    "machuca",
  ];
  const sintomasFibromialgia = [
    "dor",
    "fadiga",
    "cansaço",
    "insônia",
    "rigidez",
    "formigamento",
    "dor muscular",
  ];

  let scorePositivo = 0;
  let scoreNegativo = 0;
  let sintomasDetectados = [];

  // Contar palavras positivas e negativas
  palavrasPositivas.forEach((palavra) => {
    if (textoLower.includes(palavra)) scorePositivo++;
  });

  palavrasNegativas.forEach((palavra) => {
    if (textoLower.includes(palavra)) scoreNegativo++;
  });

  // Detectar sintomas
  sintomasFibromialgia.forEach((sintoma) => {
    if (textoLower.includes(sintoma)) {
      sintomasDetectados.push(sintoma);
    }
  });

  // Determinar sentimento
  let sentimento = "neutral";
  if (scorePositivo > scoreNegativo) sentimento = "positive";
  else if (scoreNegativo > scorePositivo) sentimento = "negative";

  return {
    sentimento,
    categoria: sintomasDetectados.length > 0 ? "saude" : "geral",
    sintomas: sintomasDetectados,
    score: { positivo: scorePositivo, negativo: scoreNegativo },
  };
}

// ==============================================
// ESTATÍSTICAS
// ==============================================

async function gerarEstatisticasReais() {
  try {
    const hoje = new Date().toISOString().split("T")[0];

    // Contar usuários
    const { count: usuariosTotais } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true });

    // Contar mensagens de hoje
    const { count: mensagensHoje } = await supabase
      .from("conversations_livia")
      .select("*", { count: "exact", head: true })
      .gte("created_at", hoje);

    // Engajamento médio
    const { data: engajamento } = await supabase
      .from("users_livia")
      .select("nivel_engajamento");

    const engajamentoMedio =
      engajamento.length > 0
        ? engajamento.reduce((sum, u) => sum + (u.nivel_engajamento || 0), 0) /
          engajamento.length
        : 0;

    return {
      usuarios_totais: usuariosTotais || 0,
      mensagens_hoje: mensagensHoje || 0,
      engajamento_medio: Number(engajamentoMedio.toFixed(2)),
      sistema: {
        baileys_status: connectionStatus,
        baileys_connected: connectionStatus === "connected",
        phone_number: phoneNumber,
        qr_available: !!qrCode,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao gerar estatísticas:", error);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// ==============================================
// INICIALIZAÇÃO
// ==============================================

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
🚀 SISTEMA INTEGRADO WHATSAPP INICIADO
=====================================

📡 Servidor: http://localhost:${PORT}
📱 Baileys QR: http://localhost:${PORT}/qr
🔗 Evolution Webhook: http://localhost:${PORT}/webhook/evolution
📊 Stats: http://localhost:${PORT}/api/stats/real
💚 Health: http://localhost:${PORT}/health

🎯 FUNCIONALIDADES:
✅ QR Code via Baileys no admin panel
✅ Webhook da Evolution API
✅ Processamento de mensagens em tempo real
✅ Análise de sentimento automática
✅ Dados 100% reais no Supabase

🔄 Iniciando Baileys automaticamente...
  `);

  // Iniciar Baileys automaticamente
  iniciarBaileys();
});

module.exports = app;
