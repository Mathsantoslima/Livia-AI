#!/bin/bash

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== CORREÇÃO COMPLETA DO ASSISTENTE DE FIBROMIALGIA =====${NC}"

# Parar todos os processos
echo -e "${YELLOW}1. Parando todos os processos...${NC}"
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
lsof -t -i :3000 | xargs kill -9 2>/dev/null
lsof -t -i :8080 | xargs kill -9 2>/dev/null
lsof -t -i :3001 | xargs kill -9 2>/dev/null
sleep 3

# Criar arquivo .env para o backend
echo -e "${YELLOW}2. Criando arquivo .env para o backend...${NC}"
cat > backend/.env << 'EOL'
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=chave_api_whatsapp
JWT_SECRET=meu_super_segredo_jwt_para_desenvolvimento_fibromialgia
SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M
DEFAULT_LANGUAGE=pt-BR
MAX_HISTORY_LENGTH=10
DEFAULT_TEMPERATURE=0.7
WEBHOOK_URL=http://localhost:3000/webhook/whatsapp
ENABLE_WEBHOOK=true
EOL

# Criar arquivo .env para o frontend
echo -e "${YELLOW}3. Criando arquivo .env para o frontend...${NC}"
cat > admin-panel/.env << 'EOL'
PORT=3001
BROWSER=none
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M
CHOKIDAR_USEPOLLING=true
FAST_REFRESH=true
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
ESLINT_NO_DEV_ERRORS=true
EOL

# Instalar PM2 
echo -e "${YELLOW}4. Instalando PM2...${NC}"
npm install -g pm2 --silent 2>/dev/null

# Iniciar API Baileys
echo -e "${GREEN}5. Iniciando API Baileys...${NC}"
osascript -e 'tell app "Terminal" to do script "cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api && node server.js"' 2>/dev/null
sleep 3

# Iniciar Backend com PM2
echo -e "${GREEN}6. Iniciando Backend...${NC}"
cd backend
pm2 delete fibromialgia-backend 2>/dev/null
pm2 start server.js --name "fibromialgia-backend"
cd ..
sleep 3

# Iniciar Frontend
echo -e "${GREEN}7. Iniciando Frontend...${NC}"
osascript -e 'tell app "Terminal" to do script "cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/admin-panel && npm start"' 2>/dev/null
sleep 5

# Verificar status
echo -e "${BLUE}8. Verificando status...${NC}"
./check-services.sh

echo ""
echo -e "${GREEN}🚀 ASSISTENTE PRONTO PARA USO!${NC}"
echo -e "🌐 Painel: http://localhost:3001"
echo -e "🔑 Login: admin@fibroia.com / admin123"
