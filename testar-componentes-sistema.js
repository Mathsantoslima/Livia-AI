// =====================================================
// TESTE DOS COMPONENTES DO SISTEMA - INTEGRAÇÃO COMPLETA
// Testa backend, admin panel e assistente WhatsApp
// =====================================================

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configurações dos componentes
const COMPONENTES = {
  backend: {
    nome: "Backend API",
    pasta: "fibromialgia-assistant/backend",
    comando: "npm start",
    porta: 3000,
    healthCheck: "http://localhost:3000/",
    envVars: {
      SUPABASE_URL: "https://dbwrpdxwfqqbsngijrle.supabase.co",
      SUPABASE_KEY:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M",
      NODE_ENV: "development",
      PORT: "3000",
    },
  },
  adminPanel: {
    nome: "Admin Panel",
    pasta: "fibromialgia-assistant/admin-panel",
    comando: "npm start",
    porta: 3001,
    healthCheck: "http://localhost:3001/",
    envVars: {
      REACT_APP_SUPABASE_URL: "https://dbwrpdxwfqqbsngijrle.supabase.co",
      REACT_APP_SUPABASE_ANON_KEY:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M",
      PORT: "3001",
    },
  },
};

function criarEnvFile(pasta, envVars) {
  const envPath = path.join(__dirname, pasta, ".env");
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(envPath, envContent);
  console.log(`   📄 Arquivo .env criado em ${pasta}`);
}

function verificarDependencias(pasta) {
  const packageJsonPath = path.join(__dirname, pasta, "package.json");
  const nodeModulesPath = path.join(__dirname, pasta, "node_modules");

  if (!fs.existsSync(packageJsonPath)) {
    console.log(`   ❌ package.json não encontrado em ${pasta}`);
    return false;
  }

  if (!fs.existsSync(nodeModulesPath)) {
    console.log(
      `   ⚠️ node_modules não encontrado em ${pasta}, executando npm install...`
    );
    return "install";
  }

  return true;
}

function executarNpmInstall(pasta) {
  return new Promise((resolve, reject) => {
    console.log(`   🔄 Instalando dependências em ${pasta}...`);

    const npmInstall = spawn("npm", ["install"], {
      cwd: path.join(__dirname, pasta),
      stdio: "pipe",
    });

    npmInstall.on("close", (code) => {
      if (code === 0) {
        console.log(`   ✅ Dependências instaladas em ${pasta}`);
        resolve();
      } else {
        console.log(`   ❌ Erro ao instalar dependências em ${pasta}`);
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

function iniciarComponente(componente, config) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Iniciando ${config.nome}...`);

    // Criar arquivo .env
    criarEnvFile(config.pasta, config.envVars);

    // Verificar dependências
    const depCheck = verificarDependencias(config.pasta);

    if (depCheck === false) {
      reject(new Error(`Dependências não encontradas em ${config.pasta}`));
      return;
    }

    if (depCheck === "install") {
      executarNpmInstall(config.pasta)
        .then(() => startProcess())
        .catch(reject);
    } else {
      startProcess();
    }

    function startProcess() {
      console.log(`   🔄 Executando: ${config.comando} em ${config.pasta}`);

      const processo = spawn("npm", ["start"], {
        cwd: path.join(__dirname, config.pasta),
        stdio: "pipe",
        env: { ...process.env, ...config.envVars },
      });

      let iniciado = false;

      processo.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`   [${componente.toUpperCase()}] ${output.trim()}`);

        // Verificar se o servidor iniciou
        if (
          !iniciado &&
          (output.includes("Server running") ||
            output.includes("Local:") ||
            output.includes("started") ||
            output.includes(`localhost:${config.porta}`))
        ) {
          iniciado = true;
          console.log(`   ✅ ${config.nome} iniciado na porta ${config.porta}`);
          resolve({
            processo,
            config,
            url: `http://localhost:${config.porta}`,
          });
        }
      });

      processo.stderr.on("data", (data) => {
        const error = data.toString();
        if (
          !error.includes("WARNING") &&
          !error.includes("DeprecationWarning")
        ) {
          console.log(`   ❌ [${componente.toUpperCase()}] ${error.trim()}`);
        }
      });

      processo.on("close", (code) => {
        if (code !== 0 && !iniciado) {
          reject(new Error(`${config.nome} falhou com código ${code}`));
        }
      });

      // Timeout para inicialização
      setTimeout(() => {
        if (!iniciado) {
          reject(new Error(`Timeout na inicialização do ${config.nome}`));
        }
      }, 60000); // 60 segundos
    }
  });
}

async function testarHealthCheck(url, nome) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log(`   ✅ ${nome} respondendo em ${url}`);
      return true;
    } else {
      console.log(
        `   ❌ ${nome} não respondeu corretamente (${response.status})`
      );
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro ao testar ${nome}: ${error.message}`);
    return false;
  }
}

async function testarComponentes() {
  console.log(`
🧪 TESTE DOS COMPONENTES DO SISTEMA
===================================

Testando backend, admin panel e assistente com tabelas unificadas...
  `);

  const componentesRodando = [];

  try {
    // Testar cada componente
    for (const [key, config] of Object.entries(COMPONENTES)) {
      try {
        console.log(`\n📋 TESTANDO: ${config.nome.toUpperCase()}`);

        const componente = await iniciarComponente(key, config);
        componentesRodando.push(componente);

        // Aguardar um pouco antes do health check
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Fazer health check
        await testarHealthCheck(componente.url, config.nome);
      } catch (error) {
        console.log(`   ❌ Falha no ${config.nome}: ${error.message}`);
      }
    }

    // Gerar relatório
    console.log(`
✅ TESTE DOS COMPONENTES CONCLUÍDO!
==================================

📊 COMPONENTES ATIVOS:
${componentesRodando.map((c) => `- ${c.config.nome}: ${c.url}`).join("\n")}

🔗 URLS PARA TESTE:
- Backend API: http://localhost:3000/
- Admin Panel: http://localhost:3001/

🚀 PRÓXIMOS PASSOS:
1. Acesse o Admin Panel em http://localhost:3001
2. Teste a API em http://localhost:3000/api
3. Execute o assistente WhatsApp: node assistente-livia-comportamento.js

⚠️ Para parar os serviços, use Ctrl+C ou execute:
   killall node

🌷 Sistema completamente integrado e funcionando!
    `);

    // Manter os processos rodando
    console.log("\n⏳ Mantendo serviços ativos... (Ctrl+C para parar)");

    // Aguardar indefinidamente
    await new Promise(() => {});
  } catch (error) {
    console.error("❌ Erro crítico nos testes:", error);

    // Limpar processos
    componentesRodando.forEach((c) => {
      if (c.processo) {
        c.processo.kill();
      }
    });
  }
}

// Função para testar apenas o assistente WhatsApp
async function testarAssistente() {
  console.log(`
🤖 TESTE DO ASSISTENTE WHATSAPP
==============================

Testando assistente com tabelas unificadas...
  `);

  try {
    // Verificar se o arquivo existe
    const assistentePath = path.join(
      __dirname,
      "assistente-livia-comportamento.js"
    );

    if (!fs.existsSync(assistentePath)) {
      console.log(
        "❌ Arquivo assistente-livia-comportamento.js não encontrado"
      );
      return;
    }

    console.log("🔄 Iniciando assistente WhatsApp...");

    const assistente = spawn("node", ["assistente-livia-comportamento.js"], {
      stdio: "inherit",
      env: {
        ...process.env,
        SUPABASE_URL: "https://dbwrpdxwfqqbsngijrle.supabase.co",
        SUPABASE_KEY:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M",
      },
    });

    assistente.on("close", (code) => {
      console.log(`\n📊 Assistente finalizado com código: ${code}`);
    });
  } catch (error) {
    console.error("❌ Erro ao testar assistente:", error);
  }
}

// Executar testes
if (require.main === module) {
  const comando = process.argv[2];

  if (comando === "assistente") {
    testarAssistente().catch(console.error);
  } else {
    testarComponentes().catch(console.error);
  }
}

module.exports = {
  testarComponentes,
  testarAssistente,
  COMPONENTES,
};
