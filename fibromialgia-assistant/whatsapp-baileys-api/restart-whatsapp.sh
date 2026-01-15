#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Reiniciando WhatsApp Baileys...${NC}\n"

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verificar se há processos Node rodando o server.js
echo -e "${YELLOW}📋 Verificando processos em execução...${NC}"
PIDS=$(pgrep -f "node.*server.js" || true)

if [ ! -z "$PIDS" ]; then
    echo -e "${YELLOW}🛑 Encerrando processos existentes...${NC}"
    pkill -f "node.*server.js" || true
    sleep 2
    echo -e "${GREEN}✅ Processos encerrados.${NC}\n"
else
    echo -e "${GREEN}✅ Nenhum processo em execução.${NC}\n"
fi

# Perguntar se deseja limpar sessão
echo -ne "${YELLOW}Limpar sessão? Isso forçará um novo QR Code (s/N): ${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${BLUE}🧹 Limpando sessão...${NC}"
    node limpar-sessao.js
    echo ""
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    npm install
    echo ""
fi

# Iniciar servidor
echo -e "${GREEN}🚀 Iniciando servidor WhatsApp Baileys...${NC}\n"
node server.js
