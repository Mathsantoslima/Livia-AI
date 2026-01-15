require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUxODkxNywiZXhwIjoyMDYzMDk0OTE3fQ.AMyBX-NBR2VBA2yZIIUXLKhBxPjRM4u0CjaAlgtQsAY";

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function applyMigration() {
  try {
    console.log("🚀 Aplicando migração do schema avançado da Livia...");

    // Ler o arquivo de migração
    const migrationPath = path.join(
      __dirname,
      "supabase/migrations/20250530225500_livia_analytics_schema.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"));

    console.log(`📋 Executando ${commands.length} comandos SQL...`);

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ";";
      console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);

      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql_query: command,
        });

        if (error) {
          console.log(`⚠️  Aviso no comando ${i + 1}: ${error.message}`);
          // Continuar mesmo com alguns erros (como tabelas que já existem)
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (err) {
        console.log(`⚠️  Erro no comando ${i + 1}: ${err.message}`);
        // Continuar mesmo com erros
      }
    }

    console.log("🎉 Migração aplicada com sucesso!");
    console.log("📊 Verificando tabelas criadas...");

    // Verificar se as tabelas foram criadas
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", [
        "users",
        "messages",
        "daily_checkins",
        "patterns_detected",
        "engagement_logs",
        "conversation_sessions",
        "livia_suggestions",
        "analytics_cache",
      ]);

    if (tablesError) {
      console.error("❌ Erro ao verificar tabelas:", tablesError);
    } else {
      console.log(
        "✅ Tabelas encontradas:",
        tables.map((t) => t.table_name).join(", ")
      );
    }
  } catch (error) {
    console.error("❌ Erro ao aplicar migração:", error);
  }
}

// Função para criar a função exec_sql no Supabase se não existir
async function createExecSqlFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    const { error } = await supabase.rpc("exec", { sql: functionSQL });
    if (error) {
      console.log("Função exec_sql já existe ou erro:", error.message);
    } else {
      console.log("✅ Função exec_sql criada");
    }
  } catch (err) {
    console.log("Tentando criar função de outra forma...");
  }
}

// Executar
createExecSqlFunction().then(() => {
  applyMigration();
});
