// =========================================
// ASSISTENTE LIVIA - FIBROMIALGIA
// Sistema personalizado com IA contextual
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
const axios = require("axios");
const cron = require("node-cron");

// Importar módulo de comportamento da Livia
const {
  obterOuCriarUsuario,
  analisarContextoConversa,
  gerarRespostaContextual,
  salvarMensagem,
} = require("./assistente-livia-comportamento");

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

// Configurações das APIs de IA
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sua-chave-openai-aqui";
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "sua-chave-claude-aqui";

// Estados globais
let sock = null;
let qrCode = null;
let connectionStatus = "disconnected";
let phoneNumber = null;

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
    assistant: "Livia",
    whatsapp: connectionStatus,
    timestamp: new Date().toISOString(),
  });
});

// Status do WhatsApp
app.get("/status", (req, res) => {
  res.json({
    status: connectionStatus,
    phone: phoneNumber,
    qr_available: !!qrCode,
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

// Webhook Evolution API
app.post("/webhook/evolution", async (req, res) => {
  try {
    console.log("📨 [EVOLUTION] Webhook recebido");

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

// Estatísticas da Livia
app.get("/api/stats/livia", async (req, res) => {
  try {
    const stats = await gerarEstatisticasLivia();
    res.json(stats);
  } catch (error) {
    console.error("❌ Erro ao gerar estatísticas:", error);
    res.status(500).json({ error: "Erro ao gerar estatísticas" });
  }
});

// ==============================================
// SISTEMA BAILEYS
// ==============================================

async function iniciarBaileys() {
  try {
    console.log("🔄 Iniciando Livia - Baileys...");

    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

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

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: customLogger,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📱 QR Code gerado para Livia!");
        try {
          qrCode = await QRCode.toDataURL(qr);
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
        console.log("✅ 🌷 Livia conectada com sucesso!");
        connectionStatus = "connected";
        qrCode = null;

        const info = sock.user;
        if (info) {
          phoneNumber = info.id.split(":")[0];
          console.log(`📱 Livia ativa no número: ${phoneNumber}`);
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);

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

async function processarMensagemBaileys(message) {
  try {
    if (!message.key || !message.message) return;

    const isFromUser = !message.key.fromMe;
    const telefone = message.key.remoteJid?.replace("@s.whatsapp.net", "");

    // Ignorar grupos e chamadas
    if (
      telefone?.includes("@g.us") ||
      telefone?.includes("@broadcast") ||
      !isFromUser
    ) {
      return;
    }

    const messageText = extrairTextoMensagem(message);
    if (!messageText) return;

    console.log(
      `🌷 [LIVIA-BAILEYS] Nova mensagem: ${telefone} - "${messageText}"`
    );

    await processarMensagemLivia(telefone, messageText, "baileys");
  } catch (error) {
    console.error("❌ Erro ao processar mensagem Baileys:", error);
  }
}

async function processarMensagemEvolution(message) {
  try {
    const telefone = message.key?.remoteJid?.replace("@s.whatsapp.net", "");

    // Ignorar grupos e chamadas
    if (telefone?.includes("@g.us") || telefone?.includes("@broadcast")) {
      return;
    }

    const messageText = extrairTextoMensagem(message);
    const isFromUser = !message.key?.fromMe;

    if (!messageText || !isFromUser) return;

    console.log(
      `🌷 [LIVIA-EVOLUTION] Nova mensagem: ${telefone} - "${messageText}"`
    );

    await processarMensagemLivia(telefone, messageText, "evolution");
  } catch (error) {
    console.error("❌ Erro ao processar mensagem Evolution:", error);
  }
}

function extrairTextoMensagem(message) {
  // Suporte a diferentes tipos de mensagem
  const messageContent = message.message;

  if (messageContent?.conversation) {
    return messageContent.conversation;
  }

  if (messageContent?.extendedTextMessage?.text) {
    return messageContent.extendedTextMessage.text;
  }

  if (messageContent?.imageMessage?.caption) {
    return messageContent.imageMessage.caption;
  }

  if (messageContent?.videoMessage?.caption) {
    return messageContent.videoMessage.caption;
  }

  // Para áudio, será implementado transcrição futuramente
  if (messageContent?.audioMessage) {
    return "[Mensagem de áudio recebida]";
  }

  // Para imagem sem legenda
  if (messageContent?.imageMessage) {
    return "[Imagem recebida]";
  }

  return null;
}

// ==============================================
// LÓGICA PRINCIPAL DA LIVIA
// ==============================================

async function processarMensagemLivia(telefone, messageText, fonte) {
  try {
    console.log(`🧠 [LIVIA] Processando: ${telefone} - "${messageText}"`);

    // 1. Obter ou criar usuário
    const usuario = await obterOuCriarUsuario(telefone);
    if (!usuario) {
      console.error("❌ Falha ao obter usuário");
      return;
    }

    // 2. Analisar contexto da conversa
    const contexto = await analisarContextoConversa(telefone, messageText);

    // 3. Gerar resposta contextual
    const respostas = await gerarRespostaContextual(
      usuario,
      messageText,
      contexto
    );

    // 4. Enviar respostas com delay natural
    if (respostas && respostas.length > 0) {
      await enviarRespostasComDelay(telefone, respostas);
    }

    console.log(`✅ [LIVIA] Processamento concluído para ${telefone}`);
  } catch (error) {
    console.error("❌ [LIVIA] Erro no processamento:", error);

    // Resposta de emergência
    try {
      await enviarMensagem(
        telefone,
        "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns minutos."
      );
    } catch (emergencyError) {
      console.error("❌ Erro na resposta de emergência:", emergencyError);
    }
  }
}

async function enviarRespostasComDelay(telefone, respostas) {
  try {
    for (let i = 0; i < respostas.length; i++) {
      const resposta = respostas[i];

      // Simular tempo de digitação (mais humano)
      const delayDigitacao = Math.min(resposta.length * 30, 2000); // Max 2s
      const delayEntreMensagens = i > 0 ? 800 : 0; // Delay entre mensagens

      await new Promise((resolve) =>
        setTimeout(resolve, delayEntreMensagens + delayDigitacao)
      );

      await enviarMensagem(telefone, resposta);

      console.log(`💬 [LIVIA] Enviado para ${telefone}: ${resposta}`);
    }
  } catch (error) {
    console.error("❌ Erro ao enviar respostas:", error);
  }
}

async function enviarMensagem(telefone, mensagem) {
  try {
    if (!sock || connectionStatus !== "connected") {
      console.error("❌ WhatsApp não conectado");
      return false;
    }

    const jid = telefone.includes("@")
      ? telefone
      : `${telefone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: mensagem });

    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error);
    return false;
  }
}

// ==============================================
// SISTEMA DE LEMBRETES DIÁRIOS
// ==============================================

// Agendar check-in diário às 20h
cron.schedule("0 20 * * *", async () => {
  console.log("⏰ [LIVIA] Executando check-in diário automático...");
  await executarCheckinDiario();
});

// Agendar sugestões matinais às 8h
cron.schedule("0 8 * * *", async () => {
  console.log("🌅 [LIVIA] Enviando sugestões matinais...");
  await enviarSugestoesMatinais();
});

async function executarCheckinDiario() {
  try {
    // Buscar usuários ativos
    const { data: usuariosAtivos, error } = await supabase
      .from("users_livia")
      .select("*")
      .eq("status", "active")
      .not("name", "is", null);

    if (error) {
      console.error("❌ Erro ao buscar usuários:", error);
      return;
    }

    console.log(
      `👥 [LIVIA] Enviando check-in para ${
        usuariosAtivos?.length || 0
      } usuários`
    );

    for (const usuario of usuariosAtivos || []) {
      try {
        const nome = usuario.name || usuario.nickname || "querido(a)";
        const mensagem = `${nome}, antes de encerrar o dia:\nComo foi seu dia hoje no geral?\nTeve algo que te ajudou ou piorou os sintomas? Me conta. ❤️`;

        await enviarMensagem(usuario.phone, mensagem);

        // Marcar como enviado
        await salvarMensagem(
          usuario.phone,
          mensagem,
          "assistant",
          "daily_checkin",
          {
            type: "daily_checkin_automatic",
            sent_at: new Date().toISOString(),
          }
        );

        // Delay entre usuários
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(
          `❌ Erro ao enviar check-in para ${usuario.phone}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("❌ Erro no check-in diário:", error);
  }
}

async function enviarSugestoesMatinais() {
  try {
    // Buscar usuários com relatórios do dia anterior
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const dataOntem = ontem.toISOString().split("T")[0];

    const { data: relatoriosOntem, error } = await supabase
      .from("daily_reports_livia")
      .select(
        `
        *,
        users_livia (name, nickname, phone)
      `
      )
      .eq("report_date", dataOntem);

    if (error) {
      console.error("❌ Erro ao buscar relatórios:", error);
      return;
    }

    console.log(
      `🌅 [LIVIA] Enviando sugestões para ${
        relatoriosOntem?.length || 0
      } usuários`
    );

    for (const relatorio of relatoriosOntem || []) {
      try {
        const usuario = relatorio.users_livia;
        const nome = usuario.name || usuario.nickname || "querido(a)";

        // Gerar sugestões baseadas no relatório
        const sugestoes = await gerarSugestoesPersonalizadas(relatorio);

        if (sugestoes.length > 0) {
          const mensagemMatinal = [`Bom dia, ${nome}! ☀️`, ...sugestoes];

          await enviarRespostasComDelay(usuario.phone, mensagemMatinal);
        }

        // Delay entre usuários
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(
          `❌ Erro ao enviar sugestões para ${relatorio.users_livia?.phone}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("❌ Erro nas sugestões matinais:", error);
  }
}

async function gerarSugestoesPersonalizadas(relatorio) {
  const sugestoes = [];

  // Sugestões baseadas na dor
  if (relatorio.pain_level >= 7) {
    sugestoes.push("Percebi que ontem a dor estava bem intensa.");
    sugestoes.push(
      "Que tal tentar um banho morno hoje? Pode ajudar a relaxar os músculos 🛁"
    );
  } else if (relatorio.pain_level >= 4) {
    sugestoes.push(
      "Como a dor estava moderada ontem, que tal alguns alongamentos leves hoje?"
    );
  }

  // Sugestões baseadas no sono
  if (relatorio.sleep_quality <= 4) {
    sugestoes.push("Vi que o sono não foi dos melhores ontem.");
    sugestoes.push(
      "Tenta evitar telas 1h antes de dormir hoje. Vai fazer diferença! 😴"
    );
  }

  // Sugestões baseadas na energia
  if (relatorio.energy_level <= 3) {
    sugestoes.push("Como a energia estava baixa, hoje vamos com calma.");
    sugestoes.push(
      "Uma caminhada de 5 minutos já pode ajudar. Sem pressão! 💜"
    );
  }

  // Sempre incluir algo positivo
  sugestoes.push(
    "Lembra: você é mais forte do que imagina. Tô aqui contigo! 🌷"
  );

  return sugestoes;
}

// ==============================================
// ESTATÍSTICAS
// ==============================================

async function gerarEstatisticasLivia() {
  try {
    const hoje = new Date().toISOString().split("T")[0];

    // Estatísticas básicas
    const { data: usuarios } = await supabase.from("users_livia").select("*");

    const { data: conversas } = await supabase
      .from("conversations_livia")
      .select("*")
      .gte("sent_at", `${hoje}T00:00:00`);

    const totalUsuarios = usuarios?.length || 0;
    const usuariosComNome = usuarios?.filter((u) => u.name).length || 0;
    const conversasHoje = conversas?.length || 0;
    const mensagensUsuarios =
      conversas?.filter((c) => c.message_type === "user").length || 0;

    return {
      total_usuarios: totalUsuarios,
      usuarios_com_nome: usuariosComNome,
      conversas_hoje: conversasHoje,
      mensagens_usuarios_hoje: mensagensUsuarios,
      whatsapp_status: connectionStatus,
      whatsapp_numero: phoneNumber,
      assistente: "Livia 🌷",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao gerar estatísticas:", error);
    return {
      error: "Erro ao gerar estatísticas",
      timestamp: new Date().toISOString(),
    };
  }
}

// ==============================================
// INICIALIZAÇÃO
// ==============================================

app.listen(PORT, () => {
  console.log(`
🌷 ASSISTENTE LIVIA PARA FIBROMIALGIA
====================================

📡 Servidor: http://localhost:${PORT}
📱 QR Code: http://localhost:${PORT}/qr
🔗 Evolution Webhook: http://localhost:${PORT}/webhook/evolution
📊 Stats Livia: http://localhost:${PORT}/api/stats/livia
💚 Health: http://localhost:${PORT}/health

🎯 FUNCIONALIDADES ATIVAS:
✅ Onboarding personalizado (pergunta nome)
✅ Conversas contextuais com histórico
✅ Mensagens em blocos pequenos e naturais
✅ Análise de sintomas e emoções
✅ Ritual diário automático (20h)
✅ Sugestões matinais personalizadas (8h)
✅ Ignorar grupos e chamadas
✅ Aprendizado individual + coletivo
✅ Suporte texto, áudio e imagem

🧠 PERSONALIDADE:
💜 Empática, carinhosa e natural
🌷 Especializada em fibromialgia
🤝 Escuta ativa e contextualizada
🚫 Não diagnostica nem prescreve
📚 Baseada em evidências científicas

🔄 Iniciando Livia automaticamente...
  `);

  // Iniciar Baileys automaticamente
  iniciarBaileys();
});
