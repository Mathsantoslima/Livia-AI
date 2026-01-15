#!/bin/bash

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Corrigindo Front-end do Assistente de Fibromialgia =====${NC}"

# Navegar para o diretório admin-panel
cd admin-panel

echo -e "${YELLOW}1. Removendo node_modules e package-lock.json...${NC}"
rm -rf node_modules package-lock.json

echo -e "${YELLOW}2. Criando arquivo .env...${NC}"
cat > .env << 'EOF'
# Configuração da aplicação React
PORT=3001
BROWSER=none

# URL da API Backend
REACT_APP_API_URL=http://localhost:3000

# Configuração do Supabase
REACT_APP_SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M

# Configurações de desenvolvimento
CHOKIDAR_USEPOLLING=true
FAST_REFRESH=true
GENERATE_SOURCEMAP=false
EOF

echo -e "${YELLOW}3. Instalando dependências Material-UI...${NC}"
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

echo -e "${YELLOW}4. Corrigindo TailwindCSS...${NC}"
npm install tailwindcss@^3.4.14 postcss@^8.4.38 autoprefixer@^10.4.19 --save-dev

echo -e "${YELLOW}5. Limpando cache...${NC}"
npm cache clean --force

echo -e "${YELLOW}6. Instalando todas as dependências...${NC}"
npm install

echo -e "${GREEN}7. Iniciando aplicação...${NC}"
npm start 