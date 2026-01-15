#!/bin/bash

# Script para limpar dados mockados e reiniciar o projeto

# Cores para mensagens
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== FibroIA - Limpeza e Reinicialização ===${NC}"
echo -e "${BLUE}Este script limpará dados mockados e reiniciará o projeto.${NC}"
echo ""

# Diretório base
BASE_DIR=$(pwd)

# Parar todos os serviços em execução
echo -e "${YELLOW}Parando todos os serviços...${NC}"
pm2 stop all
pm2 delete all

# Limpar cache
echo -e "${YELLOW}Limpando cache...${NC}"
cd $BASE_DIR/admin-panel && npm cache clean --force
cd $BASE_DIR/backend && npm cache clean --force

# Reiniciar banco de dados
echo -e "${YELLOW}Reiniciando banco de dados...${NC}"
cd $BASE_DIR
./scripts/reset-db.sh

# Reinstalar dependências
echo -e "${YELLOW}Reinstalando dependências...${NC}"
cd $BASE_DIR/admin-panel && npm install
cd $BASE_DIR/backend && npm install
cd $BASE_DIR/whatsapp-baileys-api && npm install

# Iniciar os serviços
echo -e "${GREEN}Iniciando serviços...${NC}"
cd $BASE_DIR
./scripts/start-assistant.sh

echo ""
echo -e "${GREEN}=== Sistema reiniciado com sucesso! ===${NC}"
echo -e "${BLUE}O sistema está rodando com as seguintes configurações:${NC}"
echo -e "${BLUE}- Painel Admin: http://localhost:3000${NC}"
echo -e "${BLUE}- API Backend: http://localhost:3001${NC}"
echo -e "${BLUE}- API WhatsApp: http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}Para visualizar o código QR do WhatsApp, execute:${NC}"
echo -e "${BLUE}cd $BASE_DIR && node scripts/show-qrcode.js${NC}"
echo "" 