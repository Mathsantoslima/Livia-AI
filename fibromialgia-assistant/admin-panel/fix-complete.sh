#!/bin/bash

echo "=== Correção Completa do Front-end ==="

# Parar processo na porta 3001
echo "1. Parando processo na porta 3001..."
lsof -t -i :3001 | xargs kill -9 2>/dev/null
sleep 2

# Parar processo na porta 3002 (caso tenha sido redirecionado)
lsof -t -i :3002 | xargs kill -9 2>/dev/null

# Navegar para o diretório admin-panel
cd "$(dirname "$0")"

# Limpeza completa
echo "2. Limpando cache e dependências..."
rm -rf node_modules
rm -rf package-lock.json  
rm -rf .eslintcache
rm -rf build
npm cache clean --force

# Criar arquivo .env
echo "3. Criando arquivo .env..."
cat > .env << 'EOF'
PORT=3001
BROWSER=none
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M
CHOKIDAR_USEPOLLING=true
FAST_REFRESH=true
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
EOF

# Corrigir dependências problemáticas
echo "4. Corrigindo dependências conflitantes..."
npm install ajv@^8.12.0 ajv-keywords@^5.1.0 --save-dev --no-audit

# Instalar dependências principais
echo "5. Instalando dependências..."
npm install --legacy-peer-deps --no-audit

# Verificar e corrigir Material-UI se necessário
echo "6. Verificando Material-UI..."
if [ ! -d "node_modules/@mui/material" ]; then
    echo "Instalando Material-UI..."
    npm install @mui/material @emotion/react @emotion/styled @mui/icons-material --force --no-audit
fi

echo "7. Iniciando aplicação..."
npm start 

# 2. Verificar serviços
cd fibromialgia-assistant
chmod +x check-services.sh
./check-services.sh

# 3. Se necessário, reiniciar tudo
./start-app.sh restart 

# Verificar se o processo do backend ainda está ativo
lsof -i :3000

# OU verificar processos Node.js
ps aux | grep node 

# Parar todos os processos
pkill -f "server.js"
sleep 3

# Criar .env COMPLETO (use variáveis de ambiente ou configure manualmente)
cat > backend/.env << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=${OPENAI_API_KEY:-sua-chave-openai-aqui}

# Claude Configuration
CLAUDE_API_KEY=${CLAUDE_API_KEY:-sua-chave-claude-aqui}

# Database Configuration
SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0OTIyOTYsImV4cCI6MjA1MDA2ODI5Nn0.FLPkKLf7nEyNJKWYYbwJBMq0CZTsE4aFjCxR_WFnGgA
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0OTIyOTYsImV4cCI6MjA1MDA2ODI5Nn0.FLPkKLf7nEyNJKWYYbwJBMq0CZTsE4aFjCxR_WFnGgA

# Server Configuration
PORT=3000
NODE_ENV=development

# WhatsApp API Configuration
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=12588eb53f90c49aff2f0cdfca0a4878

# JWT Configuration
JWT_SECRET=super-secret-jwt-key-12345

# Configurações adicionais
DEFAULT_LANGUAGE=pt-BR
MAX_HISTORY_LENGTH=10
DEFAULT_TEMPERATURE=0.7
MAX_RETRIES=3
RETRY_DELAY=1000
EOF

echo "✅ .env completo criado com chave REAL do Claude!" 