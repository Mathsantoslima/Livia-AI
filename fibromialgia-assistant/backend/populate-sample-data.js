require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUxODkxNywiZXhwIjoyMDYzMDk0OTE3fQ.AMyBX-NBR2VBA2yZIIUXLKhBxPjRM4u0CjaAlgtQsAY";

const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Dados de exemplo
const sampleUsers = [
  {
    id: "96ee40cf-9428-402e-8eef-802fc950f445",
    name: "Maria Silva",
    phone: "5511947439705",
    status: "active",
    primeiro_contato: "2025-05-15T10:30:00Z",
    ultimo_contato: "2025-05-30T18:45:00Z",
    nivel_engajamento: 0.85,
  },
  {
    id: "a1b2c3d4-5678-9012-3456-789012345678",
    name: "Ana Santos",
    phone: "5511987654321",
    status: "active",
    primeiro_contato: "2025-05-10T14:20:00Z",
    ultimo_contato: "2025-05-30T16:30:00Z",
    nivel_engajamento: 0.72,
  },
  {
    id: "b2c3d4e5-6789-0123-4567-890123456789",
    name: "João Oliveira",
    phone: "5511123456789",
    status: "inactive",
    primeiro_contato: "2025-05-05T09:15:00Z",
    ultimo_contato: "2025-05-25T12:00:00Z",
    nivel_engajamento: 0.45,
  },
];

const sampleMessages = [
  {
    user_id: "96ee40cf-9428-402e-8eef-802fc950f445",
    tipo: "user",
    mensagem: "Oi Livia, estou sentindo muita dor hoje",
    timestamp: "2025-05-30T18:45:00Z",
    classificacao_sentimento: "negative",
    categoria: "dor",
  },
  {
    user_id: "96ee40cf-9428-402e-8eef-802fc950f445",
    tipo: "livia",
    mensagem:
      "Olá Maria! Sinto muito que você esteja com dor. Em uma escala de 1 a 10, como você classificaria sua dor hoje?",
    timestamp: "2025-05-30T18:46:00Z",
    classificacao_sentimento: "neutral",
    categoria: "suporte",
  },
  {
    user_id: "a1b2c3d4-5678-9012-3456-789012345678",
    tipo: "user",
    mensagem: "Bom dia! Hoje estou me sentindo melhor",
    timestamp: "2025-05-30T16:30:00Z",
    classificacao_sentimento: "positive",
    categoria: "humor",
  },
];

const sampleCheckins = [
  {
    user_id: "96ee40cf-9428-402e-8eef-802fc950f445",
    data: "2025-05-30",
    nivel_dor: 7,
    nivel_humor: 3,
    nivel_energia: 2,
    qualidade_sono: 3,
    sintomas: ["dor_articular", "fadiga", "rigidez_matinal"],
    trigger: "mudança_tempo",
    observacoes: "Dia difícil, muita dor nas articulações",
  },
  {
    user_id: "a1b2c3d4-5678-9012-3456-789012345678",
    data: "2025-05-30",
    nivel_dor: 4,
    nivel_humor: 4,
    nivel_energia: 4,
    qualidade_sono: 4,
    sintomas: ["dor_leve"],
    observacoes: "Dia melhor que ontem",
  },
];

const samplePatterns = [
  {
    user_id: "96ee40cf-9428-402e-8eef-802fc950f445",
    tipo_padrao: "temporal",
    descricao: "Aumento da dor durante mudanças climáticas",
    relevancia: 0.9,
    ativo: true,
    ultima_ocorrencia: "2025-05-30T18:45:00Z",
    dados_suporte: { frequencia: "alta", correlacao: 0.85 },
  },
  {
    user_id: "a1b2c3d4-5678-9012-3456-789012345678",
    tipo_padrao: "comportamental",
    descricao: "Melhora dos sintomas com exercícios leves",
    relevancia: 0.75,
    ativo: true,
    ultima_ocorrencia: "2025-05-29T10:00:00Z",
    dados_suporte: { frequencia: "media", correlacao: 0.7 },
  },
];

const sampleSuggestions = [
  {
    user_id: "96ee40cf-9428-402e-8eef-802fc950f445",
    tipo_sugestao: "exercicio",
    conteudo:
      "Que tal tentar alguns alongamentos suaves para aliviar a rigidez?",
    data_sugestao: "2025-05-30T19:00:00Z",
    feedback: "aceita",
    efetividade: 0.8,
  },
  {
    user_id: "a1b2c3d4-5678-9012-3456-789012345678",
    tipo_sugestao: "autocuidado",
    conteudo: "Lembre-se de manter sua rotina de relaxamento antes de dormir",
    data_sugestao: "2025-05-30T20:00:00Z",
    feedback: null,
    efetividade: null,
  },
];

const sampleEngagementLogs = [
  {
    user_id: "96ee40cf-9428-402e-8eef-802fc950f445",
    evento: "mensagem_enviada",
    timestamp: "2025-05-30T18:45:00Z",
    detalhes: { tipo: "relato_sintoma" },
  },
  {
    user_id: "96ee40cf-9428-402e-8eef-802fc950f445",
    evento: "checkin_realizado",
    timestamp: "2025-05-30T19:30:00Z",
    detalhes: { completude: 100 },
  },
  {
    user_id: "a1b2c3d4-5678-9012-3456-789012345678",
    evento: "sugestao_aceita",
    timestamp: "2025-05-30T16:35:00Z",
    detalhes: { tipo_sugestao: "exercicio" },
  },
];

async function populateDatabase() {
  try {
    console.log("🚀 Iniciando população do banco com dados de exemplo...");

    // Inserir usuários
    console.log("📝 Inserindo usuários...");
    const { error: usersError } = await supabase
      .from("users")
      .upsert(sampleUsers, { onConflict: "id" });

    if (usersError) {
      console.log("⚠️ Aviso ao inserir usuários:", usersError.message);
    } else {
      console.log("✅ Usuários inseridos com sucesso");
    }

    // Inserir mensagens
    console.log("💬 Inserindo mensagens...");
    const { error: messagesError } = await supabase
      .from("messages")
      .insert(sampleMessages);

    if (messagesError) {
      console.log("⚠️ Aviso ao inserir mensagens:", messagesError.message);
    } else {
      console.log("✅ Mensagens inseridas com sucesso");
    }

    // Inserir check-ins
    console.log("📊 Inserindo check-ins...");
    const { error: checkinsError } = await supabase
      .from("daily_checkins")
      .insert(sampleCheckins);

    if (checkinsError) {
      console.log("⚠️ Aviso ao inserir check-ins:", checkinsError.message);
    } else {
      console.log("✅ Check-ins inseridos com sucesso");
    }

    // Inserir padrões
    console.log("🔍 Inserindo padrões...");
    const { error: patternsError } = await supabase
      .from("patterns_detected")
      .insert(samplePatterns);

    if (patternsError) {
      console.log("⚠️ Aviso ao inserir padrões:", patternsError.message);
    } else {
      console.log("✅ Padrões inseridos com sucesso");
    }

    // Inserir sugestões
    console.log("💡 Inserindo sugestões...");
    const { error: suggestionsError } = await supabase
      .from("livia_suggestions")
      .insert(sampleSuggestions);

    if (suggestionsError) {
      console.log("⚠️ Aviso ao inserir sugestões:", suggestionsError.message);
    } else {
      console.log("✅ Sugestões inseridas com sucesso");
    }

    // Inserir logs de engajamento
    console.log("📈 Inserindo logs de engajamento...");
    const { error: engagementError } = await supabase
      .from("engagement_logs")
      .insert(sampleEngagementLogs);

    if (engagementError) {
      console.log(
        "⚠️ Aviso ao inserir logs de engajamento:",
        engagementError.message
      );
    } else {
      console.log("✅ Logs de engajamento inseridos com sucesso");
    }

    console.log("🎉 População do banco concluída com sucesso!");
    console.log("📊 Dados de exemplo inseridos para testar o painel admin");
  } catch (error) {
    console.error("❌ Erro ao popular banco:", error);
  }
}

// Executar
populateDatabase();
