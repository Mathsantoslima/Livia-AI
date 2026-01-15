// =========================================
// SISTEMA COMPLETO: BAILEYS + EVOLUTION + AI
// WhatsApp + OpenAI + Claude + Webhook
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
const axios = require("axios");

// ==============================================
// CONFIGURAÇÕES
// ==============================================

const PORT = 8080;
const SESSION_DIR = "./sessions";

// Supabase
const supabaseUrl = "https://dbwrpdxwfqqbsngijrle.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações das APIs de IA - usando as chaves do arquivo .env (OBRIGATÓRIO)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!OPENAI_API_KEY || !CLAUDE_API_KEY) {
  console.error("❌ ERRO: Configure OPENAI_API_KEY e CLAUDE_API_KEY no arquivo .env");
  process.exit(1);
}

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

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    whatsapp: connectionStatus,
    timestamp: new Date().toISOString(),
    ai_services: {
      openai: !!OPENAI_API_KEY,
      claude: !!CLAUDE_API_KEY,
    },
  });
});

// Status do WhatsApp
app.get("/status", (req, res) => {
  res.json({
    status: connectionStatus,
    phone: phoneNumber,
    qr_available: !!qrCode,
    last_qr: lastQrTime,
    connected: connectionStatus === "connected",
  });
});

// Obter QR Code
app.get("/qr", async (req, res) => {
  try {
    if (connectionStatus === "connected") {
      return res.json({
        success: false,
        message: `WhatsApp já conectado no número ${phoneNumber}`,
        connected: true,
        phone: phoneNumber,
      });
    }

    if (qrCode) {
      res.json({
        success: true,
        qr: qrCode,
        message: "QR Code disponível",
        timestamp: lastQrTime,
      });
    } else {
      res.json({
        success: false,
        message: "QR Code não disponível. Iniciando conexão...",
        status: connectionStatus,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao obter QR Code",
      error: error.message,
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

    // Limpar sessões
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    connectionStatus = "disconnected";
    phoneNumber = null;
    qrCode = null;
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

// Webhook Evolution API
app.post("/webhook/evolution", async (req, res) => {
  try {
    console.log(
      "📨 [EVOLUTION] Webhook recebido:",
      JSON.stringify(req.body, null, 2)
    );

    const { event, data } = req.body;

    if (event === "messages.upsert" && data?.messages) {
      for (const message of data.messages) {
        await processarMensagemEvolution(message);
      }
    }

    res.json({ success: true, message: "Webhook processado" });
  } catch (error) {
    console.error("❌ Erro no webhook Evolution:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar webhook",
      error: error.message,
    });
  }
});

// Enviar mensagem
app.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!sock || connectionStatus !== "connected") {
      return res.status(400).json({
        success: false,
        message: "WhatsApp não conectado",
      });
    }

    const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });

    console.log(`📤 Mensagem enviada para ${phone}: ${message}`);

    res.json({
      success: true,
      message: "Mensagem enviada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao enviar mensagem",
      error: error.message,
    });
  }
});

// Estatísticas reais
app.get("/api/stats/real", async (req, res) => {
  try {
    const stats = await gerarEstatisticasReais();
    res.json(stats);
  } catch (error) {
    console.error("❌ Erro ao gerar estatísticas:", error);
    res.status(500).json({ error: "Erro ao gerar estatísticas" });
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
// PROCESSAMENTO DE MENSAGENS COM IA
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

    if (!messageText || telefone.includes("@g.us") || !isFromUser) return;

    console.log(`📱 [BAILEYS] Nova mensagem: ${telefone} - "${messageText}"`);

    await processarMensagemComIA(telefone, messageText, "baileys");
  } catch (error) {
    console.error("❌ Erro ao processar mensagem Baileys:", error);
  }
}

// Processar mensagem da Evolution API
async function processarMensagemEvolution(message) {
  try {
    const telefone = message.key?.remoteJid?.replace("@s.whatsapp.net", "");
    const messageText =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";
    const isFromUser = !message.key?.fromMe;

    if (!messageText || telefone?.includes("@g.us") || !isFromUser) return;

    console.log(`📱 [EVOLUTION] Nova mensagem: ${telefone} - "${messageText}"`);

    await processarMensagemComIA(telefone, messageText, "evolution");
  } catch (error) {
    console.error("❌ Erro ao processar mensagem Evolution:", error);
  }
}

// Processamento principal com IA
async function processarMensagemComIA(telefone, messageText, fonte) {
  try {
    // 1. Registrar usuário no Supabase
    await registrarUsuario(telefone);

    // 2. Salvar mensagem recebida
    await salvarMensagem(telefone, messageText, false, fonte);

    // 3. Analisar sentimento
    const sentimento = analisarSentimento(messageText);

    // 4. Determinar qual IA usar baseado no conteúdo
    const tipoIA = determinarTipoIA(messageText);

    // 5. Gerar resposta com IA
    const resposta = await gerarRespostaIA(messageText, telefone, tipoIA);

    // 6. Enviar resposta
    if (resposta && sock && connectionStatus === "connected") {
      const jid = `${telefone}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: resposta });

      // 7. Salvar resposta enviada
      await salvarMensagem(telefone, resposta, true, `${fonte}_ai_${tipoIA}`);

      console.log(
        `🤖 [${tipoIA.toUpperCase()}] Resposta enviada para ${telefone}: ${resposta.substring(
          0,
          100
        )}...`
      );
    }

    // 8. Atualizar estatísticas
    await atualizarEstatisticas(telefone, sentimento);
  } catch (error) {
    console.error("❌ Erro no processamento com IA:", error);
  }
}

// Determinar qual IA usar
function determinarTipoIA(messageText) {
  const texto = messageText.toLowerCase();

  // Usar Claude para questões médicas e emocionais
  if (
    texto.includes("dor") ||
    texto.includes("medicamento") ||
    texto.includes("sintoma") ||
    texto.includes("fibromialgia") ||
    texto.includes("tristeza") ||
    texto.includes("ansiedade") ||
    texto.includes("depressão") ||
    texto.includes("médico")
  ) {
    return "claude";
  }

  // Usar OpenAI para questões gerais e técnicas
  return "openai";
}

// Gerar resposta com OpenAI
async function gerarRespostaOpenAI(messageText, telefone) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Você é Lívia, uma assistente virtual especializada em fibromialgia e bem-estar. 
                     Responda de forma empática, acolhedora e profissional. 
                     Mantenha as respostas concisas (máximo 2 parágrafos).
                     Se for questão médica, sempre recomende consultar um profissional.`,
          },
          {
            role: "user",
            content: messageText,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ Erro OpenAI:", error.response?.data || error.message);
    return "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns minutos.";
  }
}

// Gerar resposta com Claude
async function gerarRespostaClaude(messageText, telefone) {
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-sonnet-20240229",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Você é Lívia, uma assistente virtual especializada em fibromialgia e apoio emocional. 
                     Responda de forma empática e acolhedora a esta mensagem: "${messageText}"
                     
                     Mantenha a resposta concisa (máximo 2 parágrafos) e sempre recomende acompanhamento médico para questões de saúde.`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
      }
    );

    return response.data.content[0].text.trim();
  } catch (error) {
    console.error("❌ Erro Claude:", error.response?.data || error.message);
    return "Estou aqui para te ajudar. No momento estou com dificuldades técnicas, mas em breve estarei funcionando normalmente.";
  }
}

// Gerar resposta usando a IA apropriada
async function gerarRespostaIA(messageText, telefone, tipoIA) {
  if (tipoIA === "claude") {
    return await gerarRespostaClaude(messageText, telefone);
  } else {
    return await gerarRespostaOpenAI(messageText, telefone);
  }
}

// ==============================================
// FUNÇÕES DE BANCO DE DADOS
// ==============================================

async function registrarUsuario(telefone) {
  try {
    const { data, error } = await supabase.from("users_livia").upsert(
      {
        phone: telefone,
        name: `Usuário ${telefone}`,
        last_interaction: new Date().toISOString(),
        status: "active",
      },
      {
        onConflict: "phone",
      }
    );

    if (error && error.code !== "23505") {
      console.error("❌ Erro ao registrar usuário:", error);
    }
  } catch (error) {
    console.error("❌ Erro ao registrar usuário:", error);
  }
}

async function salvarMensagem(telefone, conteudo, isFromBot, fonte) {
  try {
    // Analisar sentimento
    const sentimento = analisarSentimento(conteudo);

    const { data, error } = await supabase.from("conversations_livia").insert({
      user_id: telefone, // Vamos usar o telefone como user_id temporariamente
      content: conteudo,
      message_type: isFromBot ? "assistant" : "user",
      classificacao_sentimento: sentimento,
      categoria: fonte,
      metadata: {
        fonte: fonte,
        ai_model: isFromBot ? fonte.split("_")[2] : null,
      },
      sent_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ Erro ao salvar mensagem:", error);
    }
  } catch (error) {
    console.error("❌ Erro ao salvar mensagem:", error);
  }
}

// Análise de sentimento simples
function analisarSentimento(texto) {
  const textoLower = texto.toLowerCase();

  const positivas = [
    "obrigado",
    "feliz",
    "bom",
    "ótimo",
    "excelente",
    "amor",
    "alegria",
    "gratidão",
    "melhor",
  ];
  const negativas = [
    "dor",
    "triste",
    "ruim",
    "péssimo",
    "terrível",
    "ódio",
    "raiva",
    "depressão",
    "ansiedade",
    "problema",
  ];

  let scorePositivo = 0;
  let scoreNegativo = 0;

  positivas.forEach((palavra) => {
    if (textoLower.includes(palavra)) scorePositivo++;
  });

  negativas.forEach((palavra) => {
    if (textoLower.includes(palavra)) scoreNegativo++;
  });

  if (scorePositivo > scoreNegativo) return "positive";
  if (scoreNegativo > scorePositivo) return "negative";
  return "neutral";
}

async function atualizarEstatisticas(telefone, sentimento) {
  try {
    // Atualizar última interação do usuário
    await supabase
      .from("users_livia")
      .update({
        last_interaction: new Date().toISOString(),
        status: "active",
      })
      .eq("phone", telefone);
  } catch (error) {
    console.error("❌ Erro ao atualizar estatísticas:", error);
  }
}

async function gerarEstatisticasReais() {
  try {
    const hoje = new Date().toISOString().split("T")[0];

    // Buscar estatísticas do Supabase
    const { data: usuarios } = await supabase.from("users_livia").select("*");

    const { data: mensagensHoje } = await supabase
      .from("conversations_livia")
      .select("*")
      .gte("sent_at", `${hoje}T00:00:00`);

    const totalUsuarios = usuarios?.length || 0;
    const usuariosAtivos =
      usuarios?.filter(
        (u) =>
          new Date(u.last_interaction) >
          new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

    const mensagensUsuariosHoje =
      mensagensHoje?.filter((m) => m.message_type === "user").length || 0;
    const totalMensagensHoje = mensagensHoje?.length || 0;

    // Análise de sentimentos
    const sentimentos = mensagensHoje?.reduce(
      (acc, msg) => {
        if (msg.message_type === "user" && msg.classificacao_sentimento) {
          acc[msg.classificacao_sentimento] =
            (acc[msg.classificacao_sentimento] || 0) + 1;
        }
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    ) || { positive: 0, negative: 0, neutral: 0 };

    return {
      usuarios_totais: totalUsuarios,
      usuarios_ativos: usuariosAtivos,
      mensagens_hoje: totalMensagensHoje,
      mensagens_usuarios_hoje: mensagensUsuariosHoje,
      sentimentos_hoje: sentimentos,
      engajamento_medio:
        totalUsuarios > 0
          ? ((mensagensUsuariosHoje / totalUsuarios) * 100).toFixed(1)
          : 0,
      whatsapp_status: connectionStatus,
      whatsapp_numero: phoneNumber,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao gerar estatísticas:", error);
    return {
      usuarios_totais: 0,
      usuarios_ativos: 0,
      mensagens_hoje: 0,
      mensagens_usuarios_hoje: 0,
      sentimentos_hoje: { positive: 0, negative: 0, neutral: 0 },
      engajamento_medio: 0,
      whatsapp_status: connectionStatus,
      whatsapp_numero: phoneNumber,
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
🚀 SISTEMA COMPLETO AI + WHATSAPP INICIADO
==========================================

📡 Servidor: http://localhost:${PORT}
📱 Baileys QR: http://localhost:${PORT}/qr
🔗 Evolution Webhook: http://localhost:${PORT}/webhook/evolution
📊 Stats: http://localhost:${PORT}/api/stats/real
💚 Health: http://localhost:${PORT}/health

🤖 INTEGRAÇÃO AI:
${OPENAI_API_KEY ? "✅" : "❌"} OpenAI GPT-4
${CLAUDE_API_KEY ? "✅" : "❌"} Claude 3 Sonnet

🎯 FUNCIONALIDADES:
✅ QR Code automático no admin panel
✅ Webhook da Evolution API
✅ Respostas automáticas com IA
✅ Análise de sentimento em português
✅ Dados 100% reais no Supabase
✅ Processamento inteligente de mensagens

🔄 Iniciando Baileys automaticamente...
  `);

  // Iniciar Baileys automaticamente
  iniciarBaileys();
});
