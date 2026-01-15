#!/bin/bash

# =====================================================
# START SISTEMA INTEGRADO - ASSISTENTE LIVIA
# Inicia todos os componentes com tabelas unificadas
# =====================================================

echo "🌷 SISTEMA ASSISTENTE LIVIA - INTEGRADO"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para mostrar menu
show_menu() {
    echo -e "${BLUE}🚀 ESCOLHA UMA OPÇÃO:${NC}"
    echo "1) 🖥️  Iniciar Backend API (porta 3000)"
    echo "2) 🎛️  Iniciar Admin Panel (porta 3001)"  
    echo "3) 🤖 Iniciar Assistente WhatsApp"
    echo "4) 🔄 Iniciar Backend + Admin Panel"
    echo "5) 🧪 Executar Testes de Integração"
    echo "6) 📊 Verificar Status dos Serviços"
    echo "7) 🛑 Parar Todos os Serviços"
    echo "8) 📄 Abrir URLs no Navegador"
    echo "0) ❌ Sair"
    echo ""
}

# Função para iniciar backend
start_backend() {
    echo -e "${YELLOW}🖥️ Iniciando Backend API...${NC}"
    
    cd fibromialgia-assistant/backend
    
    if [ ! -f ".env" ]; then
        echo "📄 Criando arquivo .env para backend..."
        cat > .env << EOF
SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M
NODE_ENV=development
PORT=3000
EOF
    fi
    
    echo "🔄 Iniciando servidor backend..."
    npm start &
    BACKEND_PID=$!
    
    echo -e "${GREEN}✅ Backend iniciado na porta 3000 (PID: $BACKEND_PID)${NC}"
    echo -e "${BLUE}🔗 Acesse: http://localhost:3000${NC}"
    
    cd ../..
}

# Função para iniciar admin panel
start_admin() {
    echo -e "${YELLOW}🎛️ Iniciando Admin Panel...${NC}"
    
    cd fibromialgia-assistant/admin-panel
    
    if [ ! -f ".env" ]; then
        echo "📄 Criando arquivo .env para admin panel..."
        cat > .env << EOF
REACT_APP_SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M
REACT_APP_BACKEND_URL=http://localhost:3000
PORT=3001
EOF
    fi
    
    echo "🔄 Iniciando admin panel..."
    npm start &
    ADMIN_PID=$!
    
    echo -e "${GREEN}✅ Admin Panel iniciado na porta 3001 (PID: $ADMIN_PID)${NC}"
    echo -e "${BLUE}🔗 Acesse: http://localhost:3001${NC}"
    
    cd ../..
}

# Função para iniciar assistente WhatsApp
start_whatsapp() {
    echo -e "${YELLOW}🤖 Iniciando Assistente WhatsApp...${NC}"
    
    if [ ! -f "assistente-livia-comportamento.js" ]; then
        echo -e "${RED}❌ Arquivo assistente-livia-comportamento.js não encontrado${NC}"
        return 1
    fi
    
    echo "🔄 Iniciando assistente..."
    node assistente-livia-comportamento.js &
    WHATSAPP_PID=$!
    
    echo -e "${GREEN}✅ Assistente WhatsApp iniciado (PID: $WHATSAPP_PID)${NC}"
}

# Função para verificar status
check_status() {
    echo -e "${BLUE}📊 VERIFICANDO STATUS DOS SERVIÇOS...${NC}"
    echo ""
    
    # Verificar Backend (porta 3000)
    if curl -s http://localhost:3000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API: RODANDO (http://localhost:3000)${NC}"
    else
        echo -e "${RED}❌ Backend API: PARADO${NC}"
    fi
    
    # Verificar Admin Panel (porta 3001)
    if curl -s http://localhost:3001/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Admin Panel: RODANDO (http://localhost:3001)${NC}"
    else
        echo -e "${RED}❌ Admin Panel: PARADO${NC}"
    fi
    
    # Verificar processos Node.js
    echo ""
    echo -e "${BLUE}🔍 Processos Node.js ativos:${NC}"
    ps aux | grep -E "(node|npm)" | grep -v grep | grep -E "(backend|admin|assistente)" || echo "Nenhum processo encontrado"
    
    echo ""
    echo -e "${BLUE}📋 Tabelas no Supabase:${NC}"
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient('https://dbwrpdxwfqqbsngijrle.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M');
    (async () => {
        try {
            const { count: users } = await supabase.from('users_livia').select('*', {count: 'exact', head: true});
            const { count: convs } = await supabase.from('conversations_livia').select('*', {count: 'exact', head: true});
            console.log('- users_livia:', users, 'registros');
            console.log('- conversations_livia:', convs, 'registros');
        } catch(e) { console.log('Erro ao verificar tabelas:', e.message); }
    })();
    " 2>/dev/null || echo "Erro na verificação do Supabase"
}

# Função para parar serviços
stop_services() {
    echo -e "${YELLOW}🛑 Parando todos os serviços...${NC}"
    
    # Parar processos específicos
    pkill -f "react-scripts/scripts/start.js" 2>/dev/null
    pkill -f "assistente-livia" 2>/dev/null
    pkill -f "backend/.*npm start" 2>/dev/null
    
    echo -e "${GREEN}✅ Serviços parados${NC}"
}

# Função para abrir URLs
open_urls() {
    echo -e "${BLUE}📄 Abrindo URLs no navegador...${NC}"
    
    # Para macOS
    if command -v open &> /dev/null; then
        open http://localhost:3000 2>/dev/null &
        open http://localhost:3001 2>/dev/null &
    # Para Linux
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000 2>/dev/null &
        xdg-open http://localhost:3001 2>/dev/null &
    else
        echo "❌ Comando para abrir navegador não encontrado"
        echo "🔗 Acesse manualmente:"
        echo "   - Backend: http://localhost:3000"
        echo "   - Admin Panel: http://localhost:3001"
    fi
    
    echo "✅ URLs abertas no navegador"
}

# Função para executar testes
run_tests() {
    echo -e "${YELLOW}🧪 Executando Testes de Integração...${NC}"
    
    if [ -f "testar-integracao-completa.js" ]; then
        node testar-integracao-completa.js
    else
        echo -e "${RED}❌ Arquivo de testes não encontrado${NC}"
    fi
}

# Loop principal
while true; do
    show_menu
    read -p "Digite sua opção: " choice
    echo ""
    
    case $choice in
        1)
            start_backend
            echo ""
            read -p "Pressione Enter para continuar..."
            ;;
        2)
            start_admin
            echo ""
            read -p "Pressione Enter para continuar..."
            ;;
        3)
            start_whatsapp
            echo ""
            read -p "Pressione Enter para continuar..."
            ;;
        4)
            start_backend
            sleep 3
            start_admin
            echo ""
            echo -e "${GREEN}🎉 Backend e Admin Panel iniciados!${NC}"
            echo -e "${BLUE}🔗 Backend: http://localhost:3000${NC}"
            echo -e "${BLUE}🔗 Admin Panel: http://localhost:3001${NC}"
            echo ""
            read -p "Pressione Enter para continuar..."
            ;;
        5)
            run_tests
            echo ""
            read -p "Pressione Enter para continuar..."
            ;;
        6)
            check_status
            echo ""
            read -p "Pressione Enter para continuar..."
            ;;
        7)
            stop_services
            echo ""
            read -p "Pressione Enter para continuar..."
            ;;
        8)
            open_urls
            echo ""
            read -p "Pressione Enter para continuar..."
            ;;
        0)
            echo -e "${GREEN}🌷 Obrigado por usar o Sistema Livia!${NC}"
            echo -e "${BLUE}Sistema completamente integrado e funcional!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Opção inválida. Tente novamente.${NC}"
            echo ""
            ;;
    esac
    
    clear
done 