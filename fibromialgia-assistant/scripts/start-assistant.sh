#!/bin/bash

# Script para iniciar o Assistente Virtual para Fibromialgia

# Cores para mensagens
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== FibroIA - Assistente Virtual para Fibromialgia ===${NC}"
echo -e "${BLUE}Iniciando assistente e suas dependências...${NC}"
echo ""

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Arquivo .env não encontrado. Criando um arquivo padrão...${NC}"
  cat > .env << EOF
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
SUPABASE_SERVICE_KEY=sua_chave_service_do_supabase
PORT=3000
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=sua_chave_api
WEBHOOK_ENABLED=true
WEBHOOK_URL=http://localhost:3000/api/webhooks/whatsapp
NODE_ENV=development
EOF

  echo -e "${YELLOW}Arquivo .env criado. Por favor, preencha com suas credenciais antes de continuar.${NC}"
  exit 1
fi

# Função para verificar dependências
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}Erro: $1 não está instalado.${NC}"
    return 1
  fi
  return 0
}

# Verificar dependências
check_dependency "node" || exit 1
check_dependency "npm" || exit 1

# Verificar e instalar dependências
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Instalando dependências...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao instalar dependências.${NC}"
    exit 1
  fi
fi

# Definir processo API do WhatsApp baseado no que está disponível
WHATSAPP_API_PROCESS=""

# Verificar se a API do Baileys está disponível
if [ -d "whatsapp-baileys-api" ]; then
  WHATSAPP_API_PROCESS="whatsapp-baileys-api"
elif [ -d "whatsapp-web-api" ]; then
  WHATSAPP_API_PROCESS="whatsapp-web-api"
else
  echo -e "${RED}Nenhuma API do WhatsApp encontrada.${NC}"
  exit 1
fi

# Iniciar serviços em background usando o PM2 se estiver instalado
if command -v pm2 &> /dev/null; then
  echo -e "${GREEN}Usando PM2 para gerenciar processos${NC}"
  
  # Verificar se já está rodando
  if pm2 list | grep -q "whatsapp-api"; then
    echo -e "${YELLOW}API do WhatsApp já está em execução. Reiniciando...${NC}"
    pm2 restart whatsapp-api
  else
    echo -e "${GREEN}Iniciando API do WhatsApp...${NC}"
    cd $WHATSAPP_API_PROCESS && pm2 start server.js --name whatsapp-api && cd ..
  fi
  
  # Iniciar o assistente
  if pm2 list | grep -q "fibroia-assistant"; then
    echo -e "${YELLOW}Assistente já está em execução. Reiniciando...${NC}"
    pm2 restart fibroia-assistant
  else
    echo -e "${GREEN}Iniciando Assistente FibroIA...${NC}"
    pm2 start src/app.js --name fibroia-assistant
  fi
  
  echo -e "${GREEN}Todos os serviços foram iniciados.${NC}"
  echo -e "${BLUE}Para verificar os logs: pm2 logs${NC}"
  
else
  # Método alternativo usando múltiplos terminais (para desenvolvimento)
  echo -e "${YELLOW}PM2 não encontrado, iniciando processos em modo de desenvolvimento${NC}"
  
  # Criar script temporário para iniciar processos
  cat > temp_start.sh << EOF
#!/bin/bash
# Iniciar API do WhatsApp
cd $WHATSAPP_API_PROCESS && node server.js &
WHATSAPP_PID=\$!
echo "API do WhatsApp iniciada (PID: \$WHATSAPP_PID)"

# Aguardar um pouco para a API inicializar
sleep 3

# Iniciar assistente
cd ..
node src/app.js &
ASSISTANT_PID=\$!
echo "Assistente iniciado (PID: \$ASSISTANT_PID)"

# Função para encerrar processos ao receber CTRL+C
trap "kill \$WHATSAPP_PID \$ASSISTANT_PID; exit" INT TERM EXIT

# Manter script rodando
wait
EOF

  chmod +x temp_start.sh
  
  # Executar script
  echo -e "${GREEN}Iniciando serviços...${NC}"
  ./temp_start.sh
  
  # Remover script temporário ao finalizar
  rm temp_start.sh
fi 