const { createClient } = require("@supabase/supabase-js");
const logger = require("../utils/logger");

// Verifica variáveis de ambiente
if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL não definida");
}

if (!process.env.SUPABASE_KEY) {
  throw new Error("SUPABASE_KEY não definida");
}

// Cria cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// Testa conexão
supabase
  .from("users_livia")
  .select("count", { count: "exact", head: true })
  .then(() => {
    logger.info("Conexão com Supabase estabelecida com sucesso");
  })
  .catch((error) => {
    logger.error("Erro ao conectar com Supabase:", error);
    process.exit(1);
  });

module.exports = { supabase };
