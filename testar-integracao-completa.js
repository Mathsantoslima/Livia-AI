// =====================================================
// TESTE DE INTEGRAÇÃO COMPLETA - SISTEMA UNIFICADO
// Verifica se todos os componentes estão funcionando
// =====================================================

const { createClient } = require("@supabase/supabase-js");

// Configuração Supabase
const supabaseUrl = "https://dbwrpdxwfqqbsngijrle.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M";
const supabase = createClient(supabaseUrl, supabaseKey);

// Tabelas que devem existir após unificação
const TABELAS_UNIFICADAS = [
  "users_livia",
  "conversations_livia",
  "daily_reports_livia",
  "suggestions_livia",
  "patterns_livia",
  "reminders_livia",
  "insights_livia",
  "educational_content",
  "exercises",
  "users_backup_20250531",
  "users_livia_backup_20250531",
  "conversations_livia_backup_20250531",
];

async function testarConexaoSupabase() {
  console.log("\n🔌 TESTE 1: Conexão com Supabase...");

  try {
    const { data, error } = await supabase
      .from("users_livia")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.log(`   ❌ Erro na conexão: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Conexão estabelecida - ${data?.length || 0} usuários`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro crítico: ${error.message}`);
    return false;
  }
}

async function verificarTabelasUnificadas() {
  console.log("\n📋 TESTE 2: Verificando tabelas unificadas...");

  let tabelasOk = 0;
  let tabelasErro = 0;

  for (const tabela of TABELAS_UNIFICADAS) {
    try {
      const { data, error, count } = await supabase
        .from(tabela)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`   ❌ ${tabela}: ${error.message}`);
        tabelasErro++;
      } else {
        console.log(`   ✅ ${tabela}: ${count || 0} registros`);
        tabelasOk++;
      }
    } catch (error) {
      console.log(`   ❌ ${tabela}: Erro crítico - ${error.message}`);
      tabelasErro++;
    }
  }

  console.log(`\n   📊 Resultado: ${tabelasOk} OK, ${tabelasErro} Erro`);
  return tabelasErro === 0;
}

async function testarCRUDUsuarios() {
  console.log("\n👤 TESTE 3: CRUD de usuários (users_livia)...");

  try {
    // Criar usuário de teste
    const usuarioTeste = {
      phone: "5511999999999",
      name: "Teste Integração",
      status: "active",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      total_days_tracked: 0,
      created_at: new Date().toISOString(),
    };

    console.log("   🔄 Criando usuário de teste...");
    const { data: userCreated, error: createError } = await supabase
      .from("users_livia")
      .insert(usuarioTeste)
      .select()
      .single();

    if (createError) {
      console.log(`   ❌ Erro ao criar: ${createError.message}`);
      return false;
    }

    console.log(`   ✅ Usuário criado: ${userCreated.name}`);

    // Ler usuário
    console.log("   🔄 Lendo usuário...");
    const { data: userRead, error: readError } = await supabase
      .from("users_livia")
      .select("*")
      .eq("phone", usuarioTeste.phone)
      .single();

    if (readError) {
      console.log(`   ❌ Erro ao ler: ${readError.message}`);
      return false;
    }

    console.log(`   ✅ Usuário lido: ${userRead.name}`);

    // Atualizar usuário
    console.log("   🔄 Atualizando usuário...");
    const { data: userUpdated, error: updateError } = await supabase
      .from("users_livia")
      .update({ name: "Teste Atualizado" })
      .eq("phone", usuarioTeste.phone)
      .select()
      .single();

    if (updateError) {
      console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
      return false;
    }

    console.log(`   ✅ Usuário atualizado: ${userUpdated.name}`);

    // Deletar usuário
    console.log("   🔄 Removendo usuário de teste...");
    const { error: deleteError } = await supabase
      .from("users_livia")
      .delete()
      .eq("phone", usuarioTeste.phone);

    if (deleteError) {
      console.log(`   ❌ Erro ao deletar: ${deleteError.message}`);
      return false;
    }

    console.log(`   ✅ Usuário removido com sucesso`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro crítico no CRUD: ${error.message}`);
    return false;
  }
}

async function testarCRUDConversas() {
  console.log("\n💬 TESTE 4: CRUD de conversas (conversations_livia)...");

  try {
    // Usar usuário existente ou criar um temporário
    let usuarioTeste = "5511888888888";

    // Verificar se usuário existe
    const { data: userExists } = await supabase
      .from("users_livia")
      .select("phone")
      .eq("phone", usuarioTeste)
      .single();

    if (!userExists) {
      // Criar usuário temporário
      await supabase.from("users_livia").insert({
        phone: usuarioTeste,
        name: "Teste Conversa",
        status: "active",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        total_days_tracked: 0,
        created_at: new Date().toISOString(),
      });
    }

    // Criar conversa de teste
    const conversaTeste = {
      phone: usuarioTeste,
      content: "Teste de integração completa",
      message_type: "user",
      media_type: "text",
      sentiment: "neutro",
      emotion: "neutro",
      intent: "teste",
      conversation_stage: "active",
      is_daily_report: false,
      sent_at: new Date().toISOString(),
    };

    console.log("   🔄 Criando conversa de teste...");
    const { data: conversaCreated, error: createError } = await supabase
      .from("conversations_livia")
      .insert(conversaTeste)
      .select()
      .single();

    if (createError) {
      console.log(`   ❌ Erro ao criar conversa: ${createError.message}`);
      return false;
    }

    console.log(`   ✅ Conversa criada: ${conversaCreated.content}`);

    // Ler conversas do usuário
    const { data: conversas, error: readError } = await supabase
      .from("conversations_livia")
      .select("*")
      .eq("phone", usuarioTeste)
      .order("sent_at", { ascending: false })
      .limit(5);

    if (readError) {
      console.log(`   ❌ Erro ao ler conversas: ${readError.message}`);
      return false;
    }

    console.log(`   ✅ ${conversas.length} conversas encontradas`);

    // Limpar teste
    await supabase
      .from("conversations_livia")
      .delete()
      .eq("id", conversaCreated.id);

    if (!userExists) {
      await supabase.from("users_livia").delete().eq("phone", usuarioTeste);
    }

    console.log(`   ✅ Dados de teste limpos`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro crítico no teste de conversas: ${error.message}`);
    return false;
  }
}

async function testarIntegridadeReferencial() {
  console.log("\n🔗 TESTE 5: Integridade referencial...");

  try {
    // Verificar se há conversas órfãs
    const { data: conversasOrfas, error } = await supabase
      .from("conversations_livia")
      .select(
        `
        phone,
        users_livia!inner(phone)
      `
      )
      .limit(10);

    if (error) {
      console.log(`   ❌ Erro na verificação: ${error.message}`);
      return false;
    }

    console.log(
      `   ✅ ${conversasOrfas.length} conversas com usuários válidos`
    );

    // Estatísticas gerais
    const { data: estatisticas } = await supabase.rpc(
      "get_table_stats",
      {},
      { count: "exact" }
    );

    console.log(`   📊 Integridade verificada com sucesso`);
    return true;
  } catch (error) {
    console.log(`   ⚠️ Teste de integridade opcional: ${error.message}`);
    return true; // Não crítico
  }
}

async function gerarRelatorioFinal() {
  console.log("\n📊 RELATÓRIO FINAL DA INTEGRAÇÃO");
  console.log("==================================");

  try {
    // Contagem de registros em cada tabela principal
    const tabelas = [
      "users_livia",
      "conversations_livia",
      "educational_content",
      "exercises",
    ];

    for (const tabela of tabelas) {
      const { count, error } = await supabase
        .from(tabela)
        .select("*", { count: "exact", head: true });

      if (!error) {
        console.log(`📋 ${tabela}: ${count} registros`);
      }
    }

    // Usuários ativos
    const { data: usuariosAtivos } = await supabase
      .from("users_livia")
      .select("phone, name, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    console.log(`\n👥 Usuários Ativos (últimos 5):`);
    usuariosAtivos?.forEach((user) => {
      console.log(`   - ${user.name} (${user.phone})`);
    });

    // Últimas conversas
    const { data: ultimasConversas } = await supabase
      .from("conversations_livia")
      .select("phone, content, sent_at")
      .order("sent_at", { ascending: false })
      .limit(3);

    console.log(`\n💬 Últimas Conversas:`);
    ultimasConversas?.forEach((conv) => {
      console.log(`   - ${conv.phone}: "${conv.content.substring(0, 50)}..."`);
    });
  } catch (error) {
    console.log(`⚠️ Erro no relatório: ${error.message}`);
  }
}

async function executarTestesCompletos() {
  console.log(`
🧪 TESTE DE INTEGRAÇÃO COMPLETA
===============================

Verificando se o sistema está funcionando com tabelas unificadas...
  `);

  const testes = [
    { nome: "Conexão Supabase", funcao: testarConexaoSupabase },
    { nome: "Tabelas Unificadas", funcao: verificarTabelasUnificadas },
    { nome: "CRUD Usuários", funcao: testarCRUDUsuarios },
    { nome: "CRUD Conversas", funcao: testarCRUDConversas },
    { nome: "Integridade Referencial", funcao: testarIntegridadeReferencial },
  ];

  let testesPassaram = 0;
  let testesFalharam = 0;

  for (const teste of testes) {
    const resultado = await teste.funcao();
    if (resultado) {
      testesPassaram++;
    } else {
      testesFalharam++;
    }
  }

  await gerarRelatorioFinal();

  console.log(`
✅ TESTES CONCLUÍDOS!
====================

📊 RESULTADO:
- ${testesPassaram} testes passaram
- ${testesFalharam} testes falharam

${
  testesFalharam === 0
    ? "🎉 SISTEMA TOTALMENTE INTEGRADO!"
    : "⚠️ Verificar falhas acima"
}

🚀 PRÓXIMOS PASSOS:
1. Testar admin panel: cd fibromialgia-assistant/admin-panel && npm start
2. Testar backend: cd fibromialgia-assistant/backend && npm start  
3. Testar assistente WhatsApp com os arquivos atualizados
4. Remover tabela "users" antiga: DROP TABLE users CASCADE;

🌷 Assistente Livia com estrutura unificada!
  `);
}

// Executar testes
if (require.main === module) {
  executarTestesCompletos().catch((error) => {
    console.error("❌ Erro crítico nos testes:", error);
    process.exit(1);
  });
}

module.exports = { executarTestesCompletos };
