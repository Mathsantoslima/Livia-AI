// =====================================================
// INTEGRAÇÃO COMPLETA DO SISTEMA - TABELAS UNIFICADAS
// Atualiza todas as referências para as novas tabelas
// =====================================================

const fs = require("fs");
const path = require("path");

// Mapeamento das tabelas antigas para as novas
const TABELA_MAPPING = {
  // Tabelas principais
  users: "users_livia",
  conversations: "conversations_livia",
  daily_reports: "daily_reports_livia",
  suggestions: "suggestions_livia",
  patterns: "patterns_livia",
  reminders: "reminders_livia",
  insights: "insights_livia",

  // Tabelas que se mantêm
  educational_content: "educational_content",
  exercises: "exercises",

  // Tabelas antigas para remover das referências
  user_complete_history: "users_livia", // migrado
  user_stats: "users_livia", // migrado
  conversation_history: "conversations_livia", // migrado
  message_logs: "conversations_livia", // migrado
  messages: "conversations_livia", // migrado
};

// Arquivos que devem ser atualizados
const ARQUIVOS_PARA_ATUALIZAR = [
  // Backend
  "fibromialgia-assistant/backend/src/config/supabase.js",
  "fibromialgia-assistant/backend/src/models/userModel.js",
  "fibromialgia-assistant/backend/src/services/userService.js",
  "fibromialgia-assistant/backend/src/services/adminService.js",
  "fibromialgia-assistant/backend/src/services/statsService.js",
  "fibromialgia-assistant/backend/src/services/notificationService.js",
  "fibromialgia-assistant/backend/src/services/interactionService.js",
  "fibromialgia-assistant/backend/src/services/intelligenceService.js",
  "fibromialgia-assistant/backend/src/services/monitoringService.js",
  "fibromialgia-assistant/backend/src/controllers/webhookController.js",
  "fibromialgia-assistant/backend/src/routes/userRoutes.js",

  // Admin Panel
  "fibromialgia-assistant/admin-panel/src/services/supabaseService.js",
  "fibromialgia-assistant/admin-panel/src/pages/Users.js",

  // Assistente WhatsApp (arquivos raiz)
  "assistente-livia.js",
  "assistente-livia-comportamento.js",
  "sistema-completo-ai.js",
  "sistema-integrado-whatsapp.js",
  "baileys-whatsapp-server.js",
  "webhook-evolution-real.js",
];

function atualizarReferenciasTabelas(conteudo) {
  let conteudoAtualizado = conteudo;

  // Atualizar referências .from("tabela_antiga") para .from("tabela_nova")
  for (const [tabelaAntiga, tabelaNova] of Object.entries(TABELA_MAPPING)) {
    // Padrões para capturar diferentes formatos
    const padroes = [
      new RegExp(`\\.from\\(["']${tabelaAntiga}["']\\)`, "g"),
      new RegExp(`\\.from\\(['"]${tabelaAntiga}['"]\\)`, "g"),
      new RegExp(`from\\(["']${tabelaAntiga}["']\\)`, "g"),
      new RegExp(`from\\(['"]${tabelaAntiga}['"]\\)`, "g"),
    ];

    for (const padrao of padroes) {
      conteudoAtualizado = conteudoAtualizado.replace(
        padrao,
        `.from("${tabelaNova}")`
      );
    }
  }

  return conteudoAtualizado;
}

function atualizarConfigSupabase(conteudo) {
  // Atualizar o teste de conexão no config do Supabase
  return conteudo.replace('.from("users")', '.from("users_livia")');
}

function criarBackupArquivo(caminhoArquivo) {
  const backup = `${caminhoArquivo}.backup.${Date.now()}`;
  if (fs.existsSync(caminhoArquivo)) {
    fs.copyFileSync(caminhoArquivo, backup);
    console.log(`   📦 Backup criado: ${backup}`);
  }
}

async function integrarSistemaCompleto() {
  console.log(`
🔄 INTEGRAÇÃO COMPLETA DO SISTEMA
==================================

Atualizando todas as referências de tabelas antigas para unificadas...
  `);

  let arquivosAtualizados = 0;
  let erros = 0;

  for (const caminhoRelativo of ARQUIVOS_PARA_ATUALIZAR) {
    const caminhoCompleto = path.join(__dirname, caminhoRelativo);

    try {
      if (!fs.existsSync(caminhoCompleto)) {
        console.log(`   ⚠️ Arquivo não encontrado: ${caminhoRelativo}`);
        continue;
      }

      console.log(`\n🔄 Processando: ${caminhoRelativo}...`);

      // Criar backup
      criarBackupArquivo(caminhoCompleto);

      // Ler conteúdo atual
      const conteudoOriginal = fs.readFileSync(caminhoCompleto, "utf8");

      // Aplicar atualizações
      let conteudoAtualizado = atualizarReferenciasTabelas(conteudoOriginal);

      // Atualizações específicas para config do Supabase
      if (caminhoRelativo.includes("config/supabase.js")) {
        conteudoAtualizado = atualizarConfigSupabase(conteudoAtualizado);
      }

      // Verificar se houve mudanças
      if (conteudoOriginal !== conteudoAtualizado) {
        // Escrever arquivo atualizado
        fs.writeFileSync(caminhoCompleto, conteudoAtualizado, "utf8");
        console.log(`   ✅ Atualizado com sucesso!`);
        arquivosAtualizados++;
      } else {
        console.log(`   ℹ️ Nenhuma atualização necessária`);
      }
    } catch (error) {
      console.log(
        `   ❌ Erro ao processar ${caminhoRelativo}: ${error.message}`
      );
      erros++;
    }
  }

  console.log(`
✅ INTEGRAÇÃO CONCLUÍDA!
========================

📊 RESUMO:
- ${arquivosAtualizados} arquivos atualizados
- ${erros} erros encontrados
- Backups criados para todos os arquivos modificados

🔄 TABELAS ATUALIZADAS:
${Object.entries(TABELA_MAPPING)
  .map(([antiga, nova]) => `- ${antiga} → ${nova}`)
  .join("\n")}

🚀 PRÓXIMOS PASSOS:
1. Teste o admin panel: npm start (na pasta admin-panel)
2. Teste o backend: npm start (na pasta backend)
3. Teste o assistente WhatsApp
4. Remova a tabela "users" antiga após confirmação

🌷 Sistema totalmente integrado com tabelas unificadas!
  `);
}

async function verificarIntegracaoCompleta() {
  console.log(`
🔍 VERIFICAÇÃO DA INTEGRAÇÃO
===========================
  `);

  const arquivosParaVerificar = [
    "fibromialgia-assistant/backend/src/config/supabase.js",
    "fibromialgia-assistant/backend/src/models/userModel.js",
    "fibromialgia-assistant/admin-panel/src/services/supabaseService.js",
  ];

  for (const arquivo of arquivosParaVerificar) {
    const caminhoCompleto = path.join(__dirname, arquivo);

    if (fs.existsSync(caminhoCompleto)) {
      const conteudo = fs.readFileSync(caminhoCompleto, "utf8");

      console.log(`\n📄 ${arquivo}:`);

      // Verificar referências antigas
      const referenciasAntigas = [];
      for (const tabelaAntiga of Object.keys(TABELA_MAPPING)) {
        if (conteudo.includes(`"${tabelaAntiga}"`)) {
          referenciasAntigas.push(tabelaAntiga);
        }
      }

      if (referenciasAntigas.length > 0) {
        console.log(
          `   ⚠️ Referências antigas encontradas: ${referenciasAntigas.join(
            ", "
          )}`
        );
      } else {
        console.log(`   ✅ Todas as referências atualizadas`);
      }
    }
  }
}

// Função para criar arquivo de configuração atualizado
function criarEnvAtualizado() {
  const envContent = `
# =====================================================
# CONFIGURAÇÃO SISTEMA FIBROMIALGIA - TABELAS UNIFICADAS
# =====================================================

# Supabase (Banco Principal)
SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M

# OpenAI
OPENAI_API_KEY=sua_chave_openai

# Claude/Anthropic
ANTHROPIC_API_KEY=sua_chave_anthropic

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave_evolution

# Configurações do Sistema
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# =====================================================
# TABELAS PRINCIPAIS UNIFICADAS:
# - users_livia (usuários principais)
# - conversations_livia (conversas)
# - daily_reports_livia (relatórios)
# - suggestions_livia (sugestões)
# - patterns_livia (padrões)
# - reminders_livia (lembretes)
# - insights_livia (insights)
# - educational_content (conteúdo educacional)
# - exercises (exercícios)
# =====================================================
  `;

  fs.writeFileSync(".env.integrado", envContent.trim());
  console.log(
    "\n📄 Arquivo .env.integrado criado com configurações atualizadas"
  );
}

// Executar integração
if (require.main === module) {
  const comando = process.argv[2];

  if (comando === "verificar") {
    verificarIntegracaoCompleta().catch(console.error);
  } else if (comando === "env") {
    criarEnvAtualizado();
  } else {
    integrarSistemaCompleto().catch(console.error);
  }
}

module.exports = {
  integrarSistemaCompleto,
  verificarIntegracaoCompleta,
  criarEnvAtualizado,
  TABELA_MAPPING,
};
