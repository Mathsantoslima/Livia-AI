#!/bin/bash

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Caminho base do projeto
BASE_PATH="/Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant"

echo -e "${BLUE}===== Gerenciador do Assistente de Fibromialgia =====${NC}"

# Função para verificar se um processo está rodando na porta
check_port() {
  lsof -i :$1 >/dev/null
  return $?
}

# Função para matar processos em uma porta específica
kill_port() {
  echo -e "${YELLOW}Encerrando processos na porta $1...${NC}"
  pid=$(lsof -t -i :$1)
  if [ ! -z "$pid" ]; then
    kill -9 $pid
    echo -e "${GREEN}Processo na porta $1 encerrado.${NC}"
  else
    echo -e "${GREEN}Nenhum processo encontrado na porta $1.${NC}"
  fi
}

# Função para iniciar todos os serviços
start_all() {
  echo -e "${BLUE}=== Preparando ambiente e iniciando aplicação ===${NC}"

  # Verificar portas em uso
  if check_port 3000; then
    echo -e "${YELLOW}Porta 3000 já está em uso. Encerrando processo...${NC}"
    kill_port 3000
    sleep 2
  fi

  if check_port 8080; then
    echo -e "${YELLOW}Porta 8080 já está em uso. Encerrando processo...${NC}"
    kill_port 8080
    sleep 2
  fi

  if check_port 3001; then
    echo -e "${YELLOW}Porta 3001 já está em uso. Encerrando processo...${NC}"
    kill_port 3001
    sleep 2
  fi

  # Remover sessões do WhatsApp Baileys
  echo -e "${BLUE}Removendo sessões do WhatsApp...${NC}"
  rm -rf "$BASE_PATH/whatsapp-baileys-api/sessions/"*
  mkdir -p "$BASE_PATH/whatsapp-baileys-api/sessions"

  # Instalar dependências do backend
  echo -e "${BLUE}Verificando dependências do backend...${NC}"
  cd "$BASE_PATH/backend"
  if ! npm list | grep -q bcrypt; then
    echo -e "${YELLOW}Instalando bcrypt...${NC}"
    npm install bcrypt
  else
    echo -e "${GREEN}bcrypt já está instalado.${NC}"
  fi

  # Verificar a URL do webhook na API Baileys
  echo -e "${BLUE}Verificando URL do webhook...${NC}"
  cd "$BASE_PATH/whatsapp-baileys-api"
  grep -q "WEBHOOK_URL=http://localhost:3000/webhook/whatsapp" .env || 
    echo "WEBHOOK_URL=http://localhost:3000/webhook/whatsapp" > .env.temp && 
    cat .env | grep -v WEBHOOK_URL >> .env.temp && 
    mv .env.temp .env

  # Verificando variáveis de ambiente do backend
  echo -e "${BLUE}Verificando variáveis de ambiente do backend...${NC}"
  cd "$BASE_PATH/backend"
  grep -q "WEBHOOK_URL" .env || 
    echo -e "\n# Webhook Baileys\nWEBHOOK_URL=http://localhost:3000/webhook/whatsapp\nENABLE_WEBHOOK=true" >> .env

  # Verificando arquivo .env do painel admin
  echo -e "${BLUE}Verificando configurações do painel admin...${NC}"
  cd "$BASE_PATH/admin-panel"
  if [ ! -f .env ]; then
    echo -e "${YELLOW}Criando arquivo .env do painel admin...${NC}"
    echo -e "PORT=3001\nREACT_APP_API_URL=http://localhost:3000\nBROWSER=none" > .env
  fi

  # Iniciar os serviços
  echo -e "${BLUE}Iniciando os serviços...${NC}"
  cd "$BASE_PATH"

  # API Baileys
  echo -e "${GREEN}Iniciando API Baileys do WhatsApp...${NC}"
  osascript -e 'tell app "Terminal" to do script "cd '"$BASE_PATH"'/whatsapp-baileys-api && node server.js"'

  # Esperar 3 segundos
  echo -e "${YELLOW}Aguardando inicialização da API Baileys...${NC}"
  sleep 3

  # Backend
  echo -e "${GREEN}Iniciando Backend do Assistente...${NC}"
  osascript -e 'tell app "Terminal" to do script "cd '"$BASE_PATH"'/backend && node server.js"'

  # Esperar 3 segundos
  echo -e "${YELLOW}Aguardando inicialização do Backend...${NC}"
  sleep 3
  
  # Frontend / Painel Admin
  echo -e "${GREEN}Iniciando Painel Administrativo...${NC}"
  osascript -e 'tell app "Terminal" to do script "cd '"$BASE_PATH"'/admin-panel && npm start"'

  echo -e "${GREEN}=== Serviços iniciados em terminais separados ===${NC}"
  echo -e "${YELLOW}Para acessar o painel administrativo:${NC} http://localhost:3001"
  echo -e "${BLUE}Para parar todos os serviços: ./start-app.sh stop${NC}"
}

# Função para parar todos os serviços
stop_all() {
  echo -e "${BLUE}=== Parando todos os serviços ===${NC}"
  
  # Parar processos nas portas
  kill_port 3000  # Backend
  kill_port 8080  # WhatsApp API
  kill_port 3001  # Painel Admin
  
  echo -e "${GREEN}Todos os serviços foram encerrados.${NC}"
}

# Função para mostrar status
show_status() {
  echo -e "${BLUE}=== Status dos serviços ===${NC}"
  
  if check_port 8080; then
    echo -e "${GREEN}API Baileys (porta 8080): Rodando${NC}"
  else
    echo -e "${RED}API Baileys (porta 8080): Parado${NC}"
  fi
  
  if check_port 3000; then
    echo -e "${GREEN}Backend (porta 3000): Rodando${NC}"
  else
    echo -e "${RED}Backend (porta 3000): Parado${NC}"
  fi

  if check_port 3001; then
    echo -e "${GREEN}Painel Admin (porta 3001): Rodando${NC}"
  else
    echo -e "${RED}Painel Admin (porta 3001): Parado${NC}"
  fi
}

# Menu de ajuda
show_help() {
  echo -e "Uso: $0 [opção]"
  echo -e "Opções:"
  echo -e "  start    - Inicia todos os serviços"
  echo -e "  stop     - Para todos os serviços"
  echo -e "  restart  - Reinicia todos os serviços"
  echo -e "  status   - Mostra o status dos serviços"
  echo -e "  help     - Mostra esta ajuda"
  echo -e "  admin    - Inicia apenas o painel admin"
  echo -e "  debug    - Inicia o painel admin em modo de depuração"
  echo -e "  frontend - Reinicia apenas o frontend"
  echo -e "  Sem opção - Inicia todos os serviços"
}

# Função para iniciar apenas o painel admin
start_admin() {
  echo -e "${BLUE}=== Iniciando apenas o Painel Administrativo ===${NC}"

  # Verificar se a porta 3001 está em uso
  if check_port 3001; then
    echo -e "${YELLOW}Porta 3001 já está em uso. Encerrando processo...${NC}"
    kill_port 3001
    sleep 2
  fi

  # Verificando arquivo .env do painel admin
  echo -e "${BLUE}Verificando configurações do painel admin...${NC}"
  cd "$BASE_PATH/admin-panel"
  if [ ! -f .env ]; then
    echo -e "${YELLOW}Criando arquivo .env do painel admin...${NC}"
    echo -e "PORT=3001\nREACT_APP_API_URL=http://localhost:3000\nBROWSER=none" > .env
  fi

  # Iniciar o painel admin
  echo -e "${GREEN}Iniciando Painel Administrativo...${NC}"
  osascript -e 'tell app "Terminal" to do script "cd '"$BASE_PATH"'/admin-panel && npm start"'

  echo -e "${GREEN}Painel Administrativo iniciado em http://localhost:3001${NC}"
}

# Função para iniciar o painel admin em modo de depuração
debug_admin() {
  echo -e "${BLUE}=== Iniciando Painel Administrativo em Modo Depuração ===${NC}"

  # Verificar se a porta 3001 está em uso
  if check_port 3001; then
    echo -e "${YELLOW}Porta 3001 já está em uso. Encerrando processo...${NC}"
    kill_port 3001
    sleep 2
  fi

  # Verificando arquivo .env do painel admin com modo debug
  echo -e "${BLUE}Configurando modo de depuração...${NC}"
  cd "$BASE_PATH/admin-panel"
  echo -e "PORT=3001\nREACT_APP_API_URL=http://localhost:3000\nBROWSER=none\nREACT_APP_DEBUG=true\nCHOKIDAR_USEPOLLING=true" > .env
  
  # Limpar cache do node_modules
  echo -e "${YELLOW}Limpando cache do React...${NC}"
  rm -rf node_modules/.cache

  # Iniciar o painel admin
  echo -e "${GREEN}Iniciando Painel Administrativo em modo debug...${NC}"
  osascript -e 'tell app "Terminal" to do script "cd '"$BASE_PATH"'/admin-panel && BROWSER=none DEBUG=* npm start"'

  echo -e "${GREEN}Painel Administrativo em modo debug iniciado em http://localhost:3001${NC}"
  echo -e "${YELLOW}Para ver logs completos, verifique o terminal aberto${NC}"
}

# Função para reiniciar apenas o frontend
restart_frontend() {
  echo -e "${BLUE}=== Reiniciando apenas o Frontend ===${NC}"

  # Verificar se a porta 3001 está em uso
  if check_port 3001; then
    echo -e "${YELLOW}Porta 3001 já está em uso. Encerrando processo...${NC}"
    kill_port 3001
    sleep 2
  fi

  # Limpar cache do node_modules
  echo -e "${YELLOW}Limpando cache do React...${NC}"
  cd "$BASE_PATH/admin-panel"
  rm -rf node_modules/.cache

  # Iniciar o painel admin
  echo -e "${GREEN}Reiniciando Painel Administrativo...${NC}"
  osascript -e 'tell app "Terminal" to do script "cd '"$BASE_PATH"'/admin-panel && npm start"'

  echo -e "${GREEN}Painel Administrativo reiniciado em http://localhost:3001${NC}"
}

# Controle baseado em argumentos
case "$1" in
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    sleep 2
    start_all
    ;;
  status)
    show_status
    ;;
  help)
    show_help
    ;;
  admin)
    start_admin
    ;;  
  debug)
    debug_admin
    ;;
  frontend)
    restart_frontend
    ;;
  *)
    start_all
    ;;
esac 