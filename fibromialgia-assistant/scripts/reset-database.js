const { createClient } = require("@supabase/supabase-js");

// Solicitar as credenciais ao usuário
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log(
    "=== Script de limpeza do banco de dados do Fibromialgia Assistant ==="
  );

  // Solicitar credenciais do Supabase
  const supabaseUrl = await promptInput("Informe a URL do Supabase: ");
  const supabaseKey = await promptInput(
    "Informe a chave Service Role do Supabase: "
  );

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ URL e chave do Supabase são obrigatórias!");
    rl.close();
    process.exit(1);
  }

  // Criar cliente do Supabase com a service key para ter permissões completas
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("\nIniciando limpeza do banco de dados...");

  try {
    // Lista de tabelas a serem limpas (exceto users e admins)
    const tables = [
      "messages",
      "conversations",
      "notifications",
      "alerts",
      "predictions",
      "sessions",
      "logs",
      "reports",
      "feedback",
      "stats",
      "scheduled_tasks",
      "user_preferences",
      "patient_data",
      "doctor_data",
      "whatsapp_sessions",
      "whatsapp_messages",
      "patients",
      "doctors",
      "admins_sessions",
      "activity_logs",
      "notification_settings",
      "user_tokens",
      "user_roles",
      "user_settings",
      "user_devices",
    ];

    console.log(`Tentando limpar ${tables.length} tabelas...`);

    // Limpar cada tabela
    for (const table of tables) {
      try {
        console.log(`Limpando tabela: ${table}`);

        // Verificar se a tabela existe
        const { error: checkError } = await supabase
          .from(table)
          .select("count", { count: "exact", head: true });

        if (checkError) {
          if (checkError.code === "PGRST116") {
            console.log(`Tabela '${table}' não existe. Pulando.`);
            continue;
          } else {
            throw checkError;
          }
        }

        // Deletar todos os registros da tabela
        const { error } = await supabase.from(table).delete().gt("id", 0); // Condição para deletar todos os registros

        if (error) throw error;

        console.log(`✅ Tabela '${table}' limpa com sucesso.`);
      } catch (error) {
        console.error(`❌ Erro ao limpar tabela '${table}':`, error.message);
      }
    }

    // Verificar se existe tabela users
    try {
      const { error: userCheckError } = await supabase
        .from("users")
        .select("count", { count: "exact", head: true });

      if (!userCheckError) {
        console.log("Tabela users encontrada. Preservando usuários admin...");

        // Deletar todos os usuários que não são admins
        const { error } = await supabase
          .from("users")
          .delete()
          .neq("role", "admin");

        if (error) throw error;

        // Verificar usuários admin restantes em users
        const { data, error: selectError } = await supabase
          .from("users")
          .select("id, email, role")
          .eq("role", "admin");

        if (selectError) throw selectError;

        console.log(
          `✅ Usuários admin preservados na tabela users (${data.length}):`
        );
        data.forEach((user) => {
          console.log(`   - ID: ${user.id}, Email: ${user.email}`);
        });
      } else {
        console.log("Tabela users não encontrada.");
      }
    } catch (error) {
      console.error(
        "❌ Erro ao verificar ou limpar tabela users:",
        error.message
      );
    }

    // Verificar se existe tabela admins
    try {
      const { error: adminCheckError } = await supabase
        .from("admins")
        .select("count", { count: "exact", head: true });

      if (!adminCheckError) {
        console.log(
          "Tabela admins encontrada. Preservando todos os registros..."
        );

        // Verificar admins restantes
        const { data, error: selectError } = await supabase
          .from("admins")
          .select("id, email, role");

        if (selectError) throw selectError;

        console.log(
          `✅ Administradores preservados na tabela admins (${data.length}):`
        );
        data.forEach((admin) => {
          console.log(`   - ID: ${admin.id}, Email: ${admin.email || "N/A"}`);
        });
      } else {
        console.log("Tabela admins não encontrada.");
      }
    } catch (error) {
      console.error("❌ Erro ao verificar tabela admins:", error.message);
    }

    console.log("✅ Limpeza do banco de dados concluída!");
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Erro durante a limpeza do banco de dados:",
      error.message
    );
    rl.close();
    process.exit(1);
  }
}

main();
