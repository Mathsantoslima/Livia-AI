#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando serviços do Evolution API...${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker e tente novamente.${NC}"
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose não encontrado. Por favor, instale o Docker Compose e tente novamente.${NC}"
    exit 1
fi

# Gerar token seguro para API se não existir
if [ -z "$EVOLUTION_API_KEY" ]; then
    # Gerar token aleatório de 32 caracteres
    EVOLUTION_API_KEY=$(openssl rand -hex 16)
    echo -e "${YELLOW}Token API gerado: ${EVOLUTION_API_KEY}${NC}"
fi

# Exportar variável para uso no docker-compose
export EVOLUTION_API_KEY

# Iniciar os serviços usando Docker Compose
echo -e "${YELLOW}Iniciando containers...${NC}"
docker-compose -f docker-compose.evolution.yml up -d

# Verificar se o Evolution API está rodando
if docker ps | grep -q "evolution-api"; then
    echo -e "${GREEN}✓ Evolution API iniciado com sucesso!${NC}"
    echo -e "${YELLOW}URL do Evolution API: http://localhost:8080${NC}"
    echo -e "${YELLOW}API Key: ${EVOLUTION_API_KEY}${NC}"
    echo -e "${YELLOW}Aguarde alguns segundos para o serviço estar pronto...${NC}"
    
    # Criar variáveis de ambiente para o backend
    echo -e "${YELLOW}Configurando variáveis de ambiente...${NC}"
    
    # Verificar se o arquivo .env existe, se não existir, criar
    if [ ! -f "./backend/.env" ]; then
        echo "EVOLUTION_API_URL=http://localhost:8080" > ./backend/.env
        echo "EVOLUTION_API_KEY=${EVOLUTION_API_KEY}" >> ./backend/.env
        echo "DEFAULT_WHATSAPP_INSTANCE=fibromialgia" >> ./backend/.env
        
        echo -e "${GREEN}✓ Arquivo .env criado no backend com as configurações do Evolution API${NC}"
    else
        # Verificar se as variáveis já existem no arquivo .env
        if ! grep -q "EVOLUTION_API_URL" ./backend/.env; then
            echo "EVOLUTION_API_URL=http://localhost:8080" >> ./backend/.env
        fi
        
        if ! grep -q "EVOLUTION_API_KEY" ./backend/.env; then
            echo "EVOLUTION_API_KEY=${EVOLUTION_API_KEY}" >> ./backend/.env
        fi
        
        if ! grep -q "DEFAULT_WHATSAPP_INSTANCE" ./backend/.env; then
            echo "DEFAULT_WHATSAPP_INSTANCE=fibromialgia" >> ./backend/.env
        fi
        
        echo -e "${GREEN}✓ Variáveis de ambiente configuradas no arquivo .env do backend${NC}"
    fi
    
    echo -e "${GREEN}✓ Tudo pronto! Agora você pode criar uma instância pelo painel admin.${NC}"
    echo -e "${YELLOW}Para conectar, acesse a seção 'Instâncias' nas configurações do painel administrativo.${NC}"
else
    echo -e "${RED}✗ Erro ao iniciar o Evolution API. Verifique os logs com 'docker-compose -f docker-compose.evolution.yml logs'${NC}"
    exit 1
fi
#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando serviços do Evolution API sem Docker...${NC}"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não encontrado. Por favor, instale o Node.js e tente novamente.${NC}"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm não encontrado. Por favor, instale o npm e tente novamente.${NC}"
    exit 1
fi

# Gerar token seguro para API se não existir
if [ -z "$EVOLUTION_API_KEY" ]; then
    # Gerar token aleatório de 32 caracteres (usando Node.js)
    EVOLUTION_API_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
    echo -e "${YELLOW}Token API gerado: ${EVOLUTION_API_KEY}${NC}"
fi

# Verificar se o Evolution API já foi clonado
if [ ! -d "./evolution-api" ]; then
    echo -e "${YELLOW}Clonando o repositório da Evolution API...${NC}"
    git clone https://github.com/evolution-api/evolution-api.git
    
    if [ ! -d "./evolution-api" ]; then
        echo -e "${RED}Erro ao clonar o repositório. Verifique sua conexão e tente novamente.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Repositório clonado com sucesso!${NC}"
fi

# Entrar no diretório da Evolution API e instalar dependências
cd evolution-api

echo -e "${YELLOW}Instalando dependências...${NC}"
npm install

# Criar arquivo .env para configuração
echo -e "${YELLOW}Configurando variáveis de ambiente...${NC}"
cat > .env << EOL
SERVER_URL=http://localhost:8080
PORT=8080
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS
CORS_ORIGIN=*
WEBHOOK_GLOBAL_URL=http://localhost:3000/api/webhook/whatsapp
WEBHOOK_GLOBAL_ENABLED=true
EOL

echo -e "${GREEN}✓ Variáveis de ambiente configuradas com sucesso!${NC}"

# Configurar backend
cd ..
if [ ! -f "./backend/.env" ]; then
    echo "EVOLUTION_API_URL=http://localhost:8080" > ./backend/.env
    echo "EVOLUTION_API_KEY=${EVOLUTION_API_KEY}" >> ./backend/.env
    echo "DEFAULT_WHATSAPP_INSTANCE=fibromialgia" >> ./backend/.env
    
    echo -e "${GREEN}✓ Arquivo .env criado no backend com as configurações do Evolution API${NC}"
else
    # Verificar se as variáveis já existem no arquivo .env
    if ! grep -q "EVOLUTION_API_URL" ./backend/.env; then
        echo "EVOLUTION_API_URL=http://localhost:8080" >> ./backend/.env
    fi
    
    if ! grep -q "EVOLUTION_API_KEY" ./backend/.env; then
        echo "EVOLUTION_API_KEY=${EVOLUTION_API_KEY}" >> ./backend/.env
    fi
    
    if ! grep -q "DEFAULT_WHATSAPP_INSTANCE" ./backend/.env; then
        echo "DEFAULT_WHATSAPP_INSTANCE=fibromialgia" >> ./backend/.env
    fi
    
    echo -e "${GREEN}✓ Variáveis de ambiente configuradas no arquivo .env do backend${NC}"
fi

# Iniciar a Evolution API
cd evolution-api
echo -e "${YELLOW}Iniciando Evolution API...${NC}"
npm start &
EVOLUTION_PID=$!

echo -e "${GREEN}✓ Evolution API iniciada com sucesso! (PID: ${EVOLUTION_PID})${NC}"
echo -e "${YELLOW}URL do Evolution API: http://localhost:8080${NC}"
echo -e "${YELLOW}API Key: ${EVOLUTION_API_KEY}${NC}"
echo -e "${YELLOW}Para conectar, acesse a seção 'Instâncias' nas configurações do painel administrativo.${NC}"
echo -e "${RED}Para parar a Evolution API, use: kill ${EVOLUTION_PID}${NC}"

# Manter o script rodando
wait $EVOLUTION_PID