/**
 * SERVIDOR BAILEYS - CONEXÃO DIRETA COM WHATSAPP
 * Sistema completo para conectar WhatsApp sem Evolution API
 */

const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

// Configuração do Supabase
const supabaseUrl = "https://dbwrpdxwfqqbsngijrle.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE7NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M";

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

// Configurações globais
let sock = null;
let qrCode = null;
let connectionStatus = "disconnected";
let phoneNumber = null;
let lastQrTime = null;

// Pasta para salvar sessão
const SESSION_DIR = path.join(__dirname, "baileys_auth");

// ==============================================
// ANÁLISE DE SENTIMENTO (REUTILIZADO)
// ==============================================

const analisesSentimento = {
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

  analisesSentimento.positivas.forEach((palavra) => {
    if (textoLower.includes(palavra)) {
      scorePositivo++;
    }
  });

  analisesSentimento.negativas.forEach((palavra) => {
    if (textoLower.includes(palavra)) {
      scoreNegativo++;
    }
  });

  analisesSentimento.sintomas.forEach((sintoma) => {
    if (textoLower.includes(sintoma)) {
      sintomas.push(sintoma);
      categoria = "sintoma";
    }
  });

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
// CONEXÃO BAILEYS
// ==============================================

async function iniciarBaileys() {
  try {
    console.log("🔄 Iniciando conexão Baileys...");

    // Criar pasta de autenticação se não existir
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    // Configurar autenticação multi-arquivo
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    // Criar socket do WhatsApp com logger simples
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // Não imprimir no terminal
      logger: {
        level: "silent", // Usar nível silent para evitar problemas
        child: () => ({
          level: "silent",
          info: () => {},
          error: () => {},
          debug: () => {},
          warn: () => {},
        }),
      },
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

    // Evento: nova mensagem
    sock.ev.on("messages.upsert", async (m) => {
      const messages = m.messages;

      for (const message of messages) {
        try {
          await processarMensagem(message);
        } catch (error) {
          console.error("❌ Erro ao processar mensagem:", error);
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

async function processarMensagem(message) {
  try {
    // Verificar se é mensagem válida
    if (!message.key || !message.message) return;

    const isFromUser = !message.key.fromMe;
    const telefone = message.key.remoteJid?.replace("@s.whatsapp.net", "");
    const messageText =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";

    // Ignorar mensagens vazias ou de grupo
    if (!messageText || telefone.includes("@g.us")) return;

    console.log(`📱 Nova mensagem real:
      De: ${telefone}
      Usuário: ${isFromUser}
      Texto: "${messageText}"`);

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

    console.log(`✅ Mensagem salva com sentimento: ${analise.sentimento}`);

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
        texto_length: messageText.length,
      },
    });

    // 6. DETECTAR PADRÕES
    if (isFromUser && analise.sintomas.length > 0) {
      await detectarPadroes(usuario.id, analise);
    }
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
  }
}

async function detectarPadroes(userId, analise) {
  try {
    const { data: padraoExistente } = await supabase
      .from("patterns_detected")
      .select("*")
      .eq("user_id", userId)
      .eq("tipo_padrao", "sintoma_temporal")
      .eq("ativo", true)
      .single();

    if (!padraoExistente) {
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
    } else {
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
// ENDPOINTS DA API
// ==============================================

// Status da conexão
app.get("/status", (req, res) => {
  res.json({
    status: "success",
    data: {
      connection: connectionStatus,
      phone: phoneNumber,
      hasQr: !!qrCode,
      qrTime: lastQrTime,
      timestamp: new Date().toISOString(),
    },
  });
});

// QR Code
app.get("/qr", (req, res) => {
  if (qrCode) {
    res.json({
      status: "success",
      qr: qrCode,
      timestamp: lastQrTime,
    });
  } else {
    res.json({
      status: "no_qr",
      message:
        connectionStatus === "connected"
          ? "Já conectado"
          : "Aguardando QR Code",
    });
  }
});

// Desconectar
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
    phoneNumber = null;
    qrCode = null;
    sock = null;

    console.log("📱 WhatsApp desconectado");

    res.json({
      status: "success",
      message: "Desconectado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao desconectar:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Reconectar
app.post("/connect", (req, res) => {
  if (connectionStatus === "connected") {
    return res.json({
      status: "already_connected",
      phone: phoneNumber,
    });
  }

  iniciarBaileys();

  res.json({
    status: "connecting",
    message: "Iniciando conexão...",
  });
});

// Enviar mensagem
app.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!sock || connectionStatus !== "connected") {
      return res.status(400).json({
        status: "error",
        message: "WhatsApp não conectado",
      });
    }

    const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: message });

    console.log(`📤 Mensagem enviada para ${phone}: ${message}`);

    res.json({
      status: "success",
      message: "Mensagem enviada",
    });
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Estatísticas reais
app.get("/api/stats/real", async (req, res) => {
  try {
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
      whatsapp: {
        status: connectionStatus,
        phone: phoneNumber,
        connected: connectionStatus === "connected",
      },
      timestamp: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error) {
    console.error("❌ Erro ao gerar estatísticas:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    whatsapp: connectionStatus,
    timestamp: new Date().toISOString(),
  });
});

// ==============================================
// INICIALIZAÇÃO
// ==============================================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`
🚀 Servidor Baileys WhatsApp - Dados Reais
📡 Servidor rodando na porta ${PORT}
📱 Status WhatsApp: ${connectionStatus}
💚 Health: http://localhost:${PORT}/health
📊 Stats: http://localhost:${PORT}/api/stats/real
🔗 QR Code: http://localhost:${PORT}/qr

✅ Configurado para conexão direta com WhatsApp via Baileys
📱 QR Code será exibido no admin panel
🧠 Análise de sentimento automática em português
🔍 Detecção de padrões em tempo real
  `);

  // Iniciar conexão automaticamente
  iniciarBaileys();
});

module.exports = app;
