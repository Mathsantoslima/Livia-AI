// =========================================
// COMPORTAMENTO DA LIVIA - FIBROMIALGIA
// Lógica conversacional e personalização
// =========================================

const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

// Configuração Supabase
const supabaseUrl = "https://dbwrpdxwfqqbsngijrle.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações IA
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sua-chave-openai-aqui";
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "sua-chave-claude-aqui";

// ==============================================
// GERENCIAMENTO DE USUÁRIO
// ==============================================

async function obterOuCriarUsuario(telefone) {
  try {
    console.log(`👤 Buscando usuário: ${telefone}`);

    // Buscar usuário existente
    const { data: usuario, error } = await supabase
      .from("users_livia")
      .select("*")
      .eq("phone", telefone)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("❌ Erro ao buscar usuário:", error);
      return null;
    }

    if (usuario) {
      console.log(`✅ Usuário encontrado: ${usuario.name || "Sem nome"}`);

      // Atualizar última interação
      await supabase
        .from("users_livia")
        .update({
          last_interaction: new Date().toISOString(),
          status: "active",
        })
        .eq("id", usuario.id);

      return usuario;
    }

    // Criar novo usuário
    console.log(`🆕 Criando novo usuário: ${telefone}`);
    const { data: novoUsuario, error: errorCriar } = await supabase
      .from("users_livia")
      .insert({
        phone: telefone,
        created_at: new Date().toISOString(),
        last_interaction: new Date().toISOString(),
        status: "active",
      })
      .select("*")
      .single();

    if (errorCriar) {
      console.error("❌ Erro ao criar usuário:", errorCriar);
      return null;
    }

    console.log(`✅ Novo usuário criado: ${novoUsuario.id}`);
    return novoUsuario;
  } catch (error) {
    console.error("❌ Erro no gerenciamento de usuário:", error);
    return null;
  }
}

// ==============================================
// ANÁLISE DE CONTEXTO
// ==============================================

async function analisarContextoConversa(telefone, mensagem) {
  try {
    // Buscar últimas 10 mensagens do usuário para contexto
    const { data: historicoRecente, error } = await supabase
      .from("conversations_livia")
      .select("*")
      .eq("phone", telefone)
      .order("sent_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Erro ao buscar histórico:", error);
      return { stage: "unknown", context: {} };
    }

    // Determinar estágio da conversa
    let stage = "onboarding"; // padrão para novos usuários
    let context = {};

    if (historicoRecente && historicoRecente.length > 0) {
      const ultimaMensagem = historicoRecente[0];

      // Se já tem mensagens, determinar contexto
      if (ultimaMensagem.conversation_stage) {
        stage = ultimaMensagem.conversation_stage;
      } else {
        stage = "general_conversation";
      }

      // Verificar se precisa do nome
      const temNome = historicoRecente.some(
        (msg) =>
          msg.conversation_stage === "onboarding_complete" ||
          msg.conversation_stage === "has_name"
      );

      if (!temNome) {
        stage = "collecting_name";
      }
    }

    // Analisar intenção da mensagem atual
    const intent = determinarIntencao(mensagem);
    const emotions = detectarEmocoes(mensagem);
    const symptoms = extrairSintomas(mensagem);

    context = {
      intent,
      emotions,
      symptoms,
      historicoRecente: historicoRecente || [],
    };

    console.log(`🧠 Contexto analisado: stage=${stage}, intent=${intent}`);

    return { stage, context };
  } catch (error) {
    console.error("❌ Erro na análise de contexto:", error);
    return { stage: "unknown", context: {} };
  }
}

function determinarIntencao(mensagem) {
  const texto = mensagem.toLowerCase();

  // Intenções principais
  if (
    texto.includes("dor") ||
    texto.includes("doendo") ||
    texto.includes("machuca")
  ) {
    return "relato_sintoma";
  }

  if (
    texto.includes("ajuda") ||
    texto.includes("não sei") ||
    texto.includes("como")
  ) {
    return "pedido_ajuda";
  }

  if (
    texto.includes("obrigad") ||
    texto.includes("valeu") ||
    texto.includes("muito bom")
  ) {
    return "agradecimento";
  }

  if (
    texto.includes("oi") ||
    texto.includes("olá") ||
    texto.includes("bom dia")
  ) {
    return "cumprimento";
  }

  // Resposta a pergunta específica (verificar contexto)
  if (texto.includes("sim") || texto.includes("não") || texto.match(/\d+/)) {
    return "resposta_pergunta";
  }

  return "conversa_geral";
}

function detectarEmocoes(mensagem) {
  const texto = mensagem.toLowerCase();
  let emocoes = [];

  // Palavras indicativas de emoções
  const mapeamentoEmocoes = {
    tristeza: ["triste", "deprimid", "chateado", "melancol", "chorand"],
    ansiedade: ["ansios", "nervos", "preocupado", "angustiad", "tenso"],
    raiva: ["raiva", "irritado", "bravo", "furioso", "ódio"],
    alegria: ["feliz", "alegre", "contente", "animado", "bem"],
    medo: ["medo", "assustado", "apreensivo", "receoso"],
    frustração: ["frustrado", "desanimado", "desestimulado", "cansado de"],
    esperança: ["espero", "melhor", "vai passar", "confiante"],
  };

  for (const [emocao, palavras] of Object.entries(mapeamentoEmocoes)) {
    if (palavras.some((palavra) => texto.includes(palavra))) {
      emocoes.push(emocao);
    }
  }

  return emocoes.length > 0 ? emocoes : ["neutro"];
}

function extrairSintomas(mensagem) {
  const texto = mensagem.toLowerCase();
  let sintomas = [];

  // Sintomas comuns da fibromialgia
  const sintomasConhecidos = {
    dor: ["dor", "doendo", "machuca", "latejando"],
    fadiga: ["cansado", "fadiga", "exausto", "sem energia", "fraco"],
    sono: [
      "não durmo",
      "insônia",
      "sono ruim",
      "acordei",
      "não consegui dormir",
    ],
    rigidez: ["rígido", "enrijecido", "duro", "travado"],
    formigamento: ["formiga", "dormência", "adormecido"],
    dor_cabeca: ["dor de cabeça", "enxaqueca", "cabeça doendo"],
    humor: ["irritado", "deprimido", "ansioso", "nervoso"],
    concentracao: ["não consigo focar", "esquecimento", "concentração"],
    digestivos: ["barriga", "estômago", "intestino", "náusea"],
  };

  for (const [sintoma, palavras] of Object.entries(sintomasConhecidos)) {
    if (palavras.some((palavra) => texto.includes(palavra))) {
      sintomas.push(sintoma);
    }
  }

  return sintomas;
}

// ==============================================
// GERAÇÃO DE RESPOSTAS CONTEXTUAIS
// ==============================================

async function gerarRespostaContextual(usuario, mensagem, contexto) {
  try {
    const { stage, context } = contexto;
    console.log(`💬 Gerando resposta para stage: ${stage}`);

    // Fluxo baseado no estágio da conversa
    switch (stage) {
      case "onboarding":
        return await respostaOnboarding(usuario, mensagem, context);

      case "collecting_name":
        return await respostaColetarNome(usuario, mensagem, context);

      case "daily_checkin":
        return await respostaDailyCheckin(usuario, mensagem, context);

      case "general_conversation":
        return await respostaGeralContextual(usuario, mensagem, context);

      default:
        return await respostaGeralContextual(usuario, mensagem, context);
    }
  } catch (error) {
    console.error("❌ Erro ao gerar resposta:", error);
    return [
      "Desculpe, estou com dificuldades técnicas no momento.",
      "Tente novamente em alguns minutos.",
    ];
  }
}

async function respostaOnboarding(usuario, mensagem, context) {
  // Primeira mensagem - apresentação da Livia
  const respostas = [
    "Oi! Eu sou a Livia 🌷",
    "Sou assistente no dia a dia com a fibromialgia.",
    "Antes da gente começar, posso saber seu nome?",
  ];

  // Salvar contexto
  await salvarMensagem(usuario.phone, mensagem, "user", "onboarding", context);

  for (let i = 0; i < respostas.length; i++) {
    await salvarMensagem(
      usuario.phone,
      respostas[i],
      "assistant",
      "collecting_name",
      {}
    );
  }

  return respostas;
}

async function respostaColetarNome(usuario, mensagem, context) {
  // Extrair nome da mensagem
  const nome = extrairNome(mensagem);

  if (nome) {
    // Atualizar usuário com nome
    await supabase
      .from("users_livia")
      .update({
        name: nome,
        nickname: nome,
      })
      .eq("id", usuario.id);

    const respostas = [
      `Que bom te conhecer, ${nome}! 😊`,
      "Tô aqui pra te acompanhar todos os dias, entender sua rotina e juntos criarmos maneiras de te ajudar a se sentir melhor.",
      "Pode contar comigo.",
      "",
      `Como você tá se sentindo hoje, ${nome}?`,
      "Teve alguma dor, cansaço, irritação ou outro sintoma?",
    ];

    // Salvar contexto
    await salvarMensagem(
      usuario.phone,
      mensagem,
      "user",
      "onboarding_complete",
      context
    );

    for (let i = 0; i < respostas.length; i++) {
      if (respostas[i] !== "") {
        await salvarMensagem(
          usuario.phone,
          respostas[i],
          "assistant",
          "general_conversation",
          {}
        );
      }
    }

    return respostas.filter((r) => r !== "");
  } else {
    // Pedir nome novamente
    const respostas = [
      "Pode me dizer seu nome?",
      "Assim posso te chamar do jeito certo 😊",
    ];

    await salvarMensagem(
      usuario.phone,
      mensagem,
      "user",
      "collecting_name",
      context
    );

    for (const resposta of respostas) {
      await salvarMensagem(
        usuario.phone,
        resposta,
        "assistant",
        "collecting_name",
        {}
      );
    }

    return respostas;
  }
}

function extrairNome(mensagem) {
  // Lógica simples para extrair nome
  const texto = mensagem.trim();

  // Remover saudações
  const textoLimpo = texto
    .replace(/^(oi|olá|bom dia|boa tarde|boa noite),?\s*/i, "")
    .replace(/meu nome é\s*/i, "")
    .replace(/me chamo\s*/i, "")
    .replace(/eu sou\s*/i, "")
    .trim();

  // Se tem espaço, pegar primeira palavra (primeiro nome)
  const palavras = textoLimpo.split(" ");
  const primeiroNome = palavras[0];

  // Validar se parece um nome (não muito curto, não números)
  if (
    primeiroNome.length >= 2 &&
    /^[a-záàâãéèêíïóôõöúçñü]+$/i.test(primeiroNome)
  ) {
    return (
      primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()
    );
  }

  return null;
}

async function respostaGeralContextual(usuario, mensagem, context) {
  const nome = usuario.name || usuario.nickname || "querido(a)";

  // Analisar tipo de resposta baseado na intenção
  if (context.intent === "relato_sintoma") {
    return await respostaSintoma(nome, mensagem, context);
  }

  if (context.intent === "pedido_ajuda") {
    return await respostaAjuda(nome, mensagem, context);
  }

  if (context.intent === "agradecimento") {
    return await respostaAgradecimento(nome);
  }

  // Resposta geral com IA
  return await respostaComIA(nome, mensagem, context, usuario);
}

async function respostaSintoma(nome, mensagem, context) {
  const sintomas = context.symptoms || [];
  const emocoes = context.emotions || [];

  let respostas = [];

  if (sintomas.includes("dor")) {
    respostas.push(`Poxa ${nome}, entendo como isso pode incomodar 😕`);
    respostas.push(
      "Você consegue lembrar o que fez hoje que pode ter influenciado isso?"
    );
  } else if (sintomas.includes("fadiga")) {
    respostas.push(`Entendo essa sensação de cansaço, ${nome}.`);
    respostas.push("Como foi seu sono ontem? Conseguiu descansar bem?");
  } else {
    respostas.push(`${nome}, fico preocupada quando você não está bem.`);
    respostas.push("Quer me contar mais sobre como está se sentindo?");
  }

  // Salvar contexto
  await salvarMensagem(
    usuario.phone,
    mensagem,
    "user",
    "general_conversation",
    context
  );

  for (const resposta of respostas) {
    await salvarMensagem(
      usuario.phone,
      resposta,
      "assistant",
      "general_conversation",
      {}
    );
  }

  return respostas;
}

async function respostaAjuda(nome, mensagem, context) {
  const respostas = [
    `Claro que posso te ajudar, ${nome}! 💜`,
    "Me conta exatamente o que você precisa?",
    "Tô aqui pra isso mesmo.",
  ];

  await salvarMensagem(
    usuario.phone,
    mensagem,
    "user",
    "general_conversation",
    context
  );

  for (const resposta of respostas) {
    await salvarMensagem(
      usuario.phone,
      resposta,
      "assistant",
      "general_conversation",
      {}
    );
  }

  return respostas;
}

async function respostaAgradecimento(nome) {
  const opcoes = [
    [`Fico feliz em poder ajudar, ${nome}! 😊`, "É pra isso que tô aqui."],
    [`De nada, ${nome}! 💜`, "Pode contar comigo sempre."],
    [`Que bom que te ajudei, ${nome}!`, "Qualquer coisa é só falar."],
  ];

  const respostas = opcoes[Math.floor(Math.random() * opcoes.length)];

  for (const resposta of respostas) {
    await salvarMensagem(
      usuario.phone,
      resposta,
      "assistant",
      "general_conversation",
      {}
    );
  }

  return respostas;
}

// ==============================================
// INTEGRAÇÃO COM IA
// ==============================================

async function respostaComIA(nome, mensagem, context, usuario) {
  try {
    // Construir contexto para IA
    const historico = context.historicoRecente || [];
    const contextHistory = historico
      .slice(0, 6) // últimas 6 mensagens
      .reverse()
      .map(
        (msg) =>
          `${msg.message_type === "user" ? nome : "Livia"}: ${msg.content}`
      )
      .join("\n");

    const systemPrompt = `Você é Livia, uma assistente carinhosa especializada em fibromialgia.

PERSONALIDADE:
- Use o nome "${nome}" nas suas respostas
- Seja empática, carinhosa e natural
- Quebre suas respostas em mensagens curtas (máximo 2 frases por bloco)
- Demonstre escuta ativa e reaja ao que a pessoa compartilha
- Varie o vocabulário, seja espontânea
- Aja como uma amiga cuidadosa que entende de fibromialgia

RESTRIÇÕES:
- NUNCA diagnostique condições médicas
- NUNCA prescreva medicamentos
- Sempre sugira acompanhamento médico para questões de saúde

CONTEXTO DA CONVERSA:
${contextHistory}

MENSAGEM ATUAL: ${mensagem}

Responda de forma natural, empática e em blocos curtos. Se detectar sintomas, demonstre preocupação e colete mais informações. Se for algo que precisa de acompanhamento médico, sugira gentilmente.`;

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-sonnet-20240229",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: systemPrompt,
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

    const respostaIA = response.data.content[0].text.trim();

    // Quebrar resposta em blocos
    const blocos = respostaIA
      .split(/\n+/)
      .filter((bloco) => bloco.trim().length > 0)
      .map((bloco) => bloco.trim());

    // Salvar mensagem do usuário e respostas
    await salvarMensagem(
      usuario.phone,
      mensagem,
      "user",
      "general_conversation",
      context
    );

    for (const bloco of blocos) {
      await salvarMensagem(
        usuario.phone,
        bloco,
        "assistant",
        "general_conversation",
        { ai_model: "claude" }
      );
    }

    return blocos;
  } catch (error) {
    console.error("❌ Erro na IA:", error);

    // Fallback para resposta padrão
    const respostaFallback = [
      `${nome}, estou com uma dificuldadezinha técnica agora.`,
      "Mas tô aqui te ouvindo! Me conta mais sobre isso.",
    ];

    await salvarMensagem(
      usuario.phone,
      mensagem,
      "user",
      "general_conversation",
      context
    );

    for (const resposta of respostaFallback) {
      await salvarMensagem(
        usuario.phone,
        resposta,
        "assistant",
        "general_conversation",
        {}
      );
    }

    return respostaFallback;
  }
}

// ==============================================
// PERSISTÊNCIA DE DADOS
// ==============================================

async function salvarMensagem(telefone, conteudo, tipo, stage, context) {
  try {
    const { error } = await supabase.from("conversations_livia").insert({
      phone: telefone,
      content: conteudo,
      message_type: tipo,
      conversation_stage: stage,
      sent_at: new Date().toISOString(),

      // Dados do contexto
      sentiment: context.emotions ? context.emotions[0] : null,
      emotion: context.emotions ? context.emotions.join(",") : null,
      intent: context.intent || null,
      symptoms_mentioned: context.symptoms || [],

      // Metadados
      metadata: {
        ai_model: context.ai_model || null,
        processing_time: Date.now(),
        context: context,
      },
    });

    if (error) {
      console.error("❌ Erro ao salvar mensagem:", error);
    }
  } catch (error) {
    console.error("❌ Erro ao salvar mensagem:", error);
  }
}

// ==============================================
// EXPORTAR MÓDULO
// ==============================================

module.exports = {
  obterOuCriarUsuario,
  analisarContextoConversa,
  gerarRespostaContextual,
  salvarMensagem,
};
