#!/bin/bash

# Script para reiniciar todos os serviços do sistema Fibro.IA

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔄 Reiniciando todos os serviços do Fibro.IA...${NC}\n"

# Diretório base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# ============================================
# 1. PARAR TODOS OS SERVIÇOS
# ============================================
echo -e "${YELLOW}1️⃣ Parando todos os serviços...${NC}"

# Parar backend
echo -e "${BLUE}   Parando backend...${NC}"
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "node.*backend" 2>/dev/null || true
sleep 2

# Parar WhatsApp Baileys (se estiver rodando)
echo -e "${BLUE}   Parando WhatsApp Baileys...${NC}"
pkill -f "whatsapp-baileys-api" 2>/dev/null || true
pkill -f "baileys.*server" 2>/dev/null || true
sleep 1

# Parar frontend (React)
echo -e "${BLUE}   Parando frontend (React)...${NC}"
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "node.*admin-panel" 2>/dev/null || true
sleep 1

echo -e "${GREEN}   ✅ Todos os serviços parados${NC}\n"

# ============================================
# 2. VERIFICAR PORTAS
# ============================================
echo -e "${YELLOW}2️⃣ Verificando portas...${NC}"

check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${RED}   ⚠️  Porta $port ainda em uso${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    else
        echo -e "${GREEN}   ✅ Porta $port livre${NC}"
    fi
}

check_port 3000  # Backend
check_port 3001  # Frontend (pode variar)
check_port 8080  # WhatsApp Baileys (se usado)
check_port 5173  # Vite (se usado)

echo ""

# ============================================
# 3. INICIAR BACKEND
# ============================================
echo -e "${YELLOW}3️⃣ Iniciando Backend...${NC}"
cd "$BASE_DIR/fibromialgia-assistant/backend"

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}   Instalando dependências do backend...${NC}"
    npm install
fi

echo -e "${BLUE}   Iniciando servidor backend na porta 3000...${NC}"
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/backend.pid

sleep 3

# Verificar se backend iniciou
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}   ✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}   ❌ Erro ao iniciar backend. Verifique /tmp/backend.log${NC}"
fi

echo ""

# ============================================
# 4. INICIAR FRONTEND
# ============================================
echo -e "${YELLOW}4️⃣ Iniciando Frontend (Admin Panel)...${NC}"

# Verificar se o diretório existe
if [ -d "$BASE_DIR/fibromialgia-assistant/admin-panel" ]; then
    FRONTEND_DIR="$BASE_DIR/fibromialgia-assistant/admin-panel"
elif [ -d "$BASE_DIR/admin-panel" ]; then
    FRONTEND_DIR="$BASE_DIR/admin-panel"
else
    echo -e "${YELLOW}   ⚠️  Diretório do frontend não encontrado. Pulando...${NC}"
    FRONTEND_DIR=""
fi

if [ -n "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"

    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}   Instalando dependências do frontend...${NC}"
        npm install
    fi

    echo -e "${BLUE}   Iniciando servidor frontend...${NC}"
    npm start > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/frontend.pid

    sleep 3

    # Verificar se frontend iniciou
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${GREEN}   ✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${RED}   ❌ Erro ao iniciar frontend. Verifique /tmp/frontend.log${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  Frontend não será iniciado (diretório não encontrado)${NC}"
fi

echo ""

# ============================================
# 5. VERIFICAR STATUS
# ============================================
echo -e "${YELLOW}5️⃣ Verificando status dos serviços...${NC}"
sleep 2

# Backend
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Backend: Online (http://localhost:3000)${NC}"
else
    echo -e "${RED}   ❌ Backend: Offline ou não responde${NC}"
fi

# Frontend (pode demorar mais para iniciar)
sleep 2
if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Frontend: Online${NC}"
else
    echo -e "${YELLOW}   ⚠️  Frontend: Pode estar iniciando ainda (verifique manualmente)${NC}"
fi

echo ""

# ============================================
# RESUMO
# ============================================
echo -e "${CYAN}📊 Resumo:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Backend:${NC} http://localhost:3000"
echo -e "${GREEN}✅ Frontend:${NC} http://localhost:3000 (ou porta configurada)"
echo -e "${GREEN}✅ WhatsApp:${NC} W-API configurada (não precisa de processo local)"
echo ""
echo -e "${CYAN}📋 Logs:${NC}"
echo -e "   Backend:  tail -f /tmp/backend.log"
echo -e "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "${CYAN}🛑 Para parar todos os serviços:${NC}"
echo -e "   pkill -f 'node.*server.js' && pkill -f 'react-scripts'"
echo ""
echo -e "${GREEN}✨ Todos os serviços reiniciados!${NC}\n"
