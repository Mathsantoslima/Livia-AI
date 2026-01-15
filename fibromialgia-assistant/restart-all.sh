#!/bin/bash

echo "🔄 REINICIANDO TODOS OS SERVIÇOS..."
echo "=================================="

# 1. Parar TODOS os processos
echo "📍 Parando todos os processos..."
pm2 kill 2>/dev/null || true
pkill -f "server.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "node.*whatsapp" 2>/dev/null || true
sleep 2

cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant

# 2. Verificar configurações
echo "📍 Verificando configurações..."

# Verificar .env do backend
if [ ! -f "backend/.env" ]; then
    echo "❌ .env do backend não encontrado! Criando..."
    cat > backend/.env << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=${OPENAI_API_KEY:-sua-chave-openai-aqui}

# Database Configuration
SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0OTIyOTYsImV4cCI6MjA1MDA2ODI5Nn0.FLPkKLf7nEyNJKWYYbwJBMq0CZTsE4aFjCxR_WFnGgA

# Server Configuration
PORT=3000
NODE_ENV=development

# WhatsApp API Configuration
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=12588eb53f90c49aff2f0cdfca0a4878
EOF
fi

# Verificar .env do WhatsApp API
if [ ! -f "whatsapp-baileys-api/.env" ]; then
    echo "❌ .env do WhatsApp API não encontrado! Criando..."
    cat > whatsapp-baileys-api/.env << 'EOF'
PORT=8080
WHATSAPP_API_KEY=12588eb53f90c49aff2f0cdfca0a4878
WEBHOOK_URL=http://localhost:3000/webhook/whatsapp
ENABLE_WEBHOOK=true
EOF
fi

# Verificar .env do Admin Panel
if [ ! -f "admin-panel/.env" ]; then
    echo "❌ .env do Admin Panel não encontrado! Criando..."
    cat > admin-panel/.env << 'EOF'
REACT_APP_SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0OTIyOTYsImV4cCI6MjA1MDA2ODI5Nn0.FLPkKLf7nEyNJKWYYbwJBMq0CZTsE4aFjCxR_WFnGgA
REACT_APP_BACKEND_URL=http://localhost:3000
EOF
fi

# 3. Limpar sessões antigas
echo "📍 Limpando sessões antigas..."
rm -rf whatsapp-baileys-api/sessions/*
mkdir -p whatsapp-baileys-api/sessions
mkdir -p backend/logs

# 4. Verificar dependências
echo "📍 Verificando dependências..."
cd backend
npm install --silent > /dev/null 2>&1
cd ../admin-panel  
npm install --silent > /dev/null 2>&1
cd ../whatsapp-baileys-api
npm install --silent > /dev/null 2>&1
cd ..

# 5. Iniciar BACKEND primeiro
echo "📍 Iniciando Backend (porta 3000)..."
cd backend
pm2 start server.js --name "fibromialgia-backend" --watch --update-env --log-date-format="YYYY-MM-DD HH:mm:ss Z"
cd ..

# Aguardar backend inicializar
echo "   ⏳ Aguardando backend inicializar..."
sleep 5

# Verificar se backend iniciou
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ⚠️  Backend demorou para iniciar, aguardando mais..."
    sleep 5
fi

# 6. Iniciar WhatsApp API
echo "📍 Iniciando WhatsApp API (porta 8080)..."
cd whatsapp-baileys-api
pm2 start server.js --name "whatsapp-api" --watch --update-env --log-date-format="YYYY-MM-DD HH:mm:ss Z"
cd ..

# Aguardar WhatsApp API inicializar
echo "   ⏳ Aguardando WhatsApp API inicializar..."
sleep 7

# 7. Iniciar Admin Panel
echo "📍 Iniciando Admin Panel (porta 3001)..."
cd admin-panel
BROWSER=none PORT=3001 npm start > /dev/null 2>&1 &
cd ..

# Aguardar Admin Panel
echo "   ⏳ Aguardando Admin Panel inicializar..."
sleep 8

# 8. Verificar status dos serviços
echo ""
echo "🔍 VERIFICANDO STATUS DOS SERVIÇOS..."
echo "=================================="

# Verificar Backend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Backend (3000): FUNCIONANDO"
else
    echo "❌ Backend (3000): NÃO RESPONDE"
fi

# Verificar WhatsApp API
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ WhatsApp API (8080): FUNCIONANDO"
else
    echo "❌ WhatsApp API (8080): NÃO RESPONDE"
fi

# Verificar Admin Panel
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Admin Panel (3001): FUNCIONANDO"
else
    echo "❌ Admin Panel (3001): NÃO RESPONDE"
fi

# 9. Mostrar status do PM2
echo ""
echo "📊 STATUS PM2:"
pm2 list

# 10. Testar webhook
echo ""
echo "🧪 TESTANDO WEBHOOK..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 12588eb53f90c49aff2f0cdfca0a4878" \
  -d '{
    "event": "message",
    "data": {
      "from": "5511947439705@s.whatsapp.net",
      "body": "teste do sistema",
      "id": "test123",
      "timestamp": 1234567890,
      "type": "conversation"
    }
  }')

if [[ "$WEBHOOK_RESPONSE" == *"error"* ]] || [[ "$WEBHOOK_RESPONSE" == *"404"* ]]; then
    echo "❌ Webhook: NÃO FUNCIONANDO"
    echo "   Resposta: $WEBHOOK_RESPONSE"
else
    echo "✅ Webhook: FUNCIONANDO"
fi

echo ""
echo "🎉 REINICIALIZAÇÃO COMPLETA!"
echo "=========================="
echo ""
echo "📱 PARA CONECTAR WHATSAPP:"
echo "   1. Acesse: http://localhost:8080"
echo "   2. Escaneie o QR code que aparece no terminal do WhatsApp API"
echo ""
echo "🖥️  PAINEL ADMINISTRATIVO:"
echo "   Acesse: http://localhost:3001"
echo ""
echo "📋 PARA MONITORAR:"
echo "   pm2 logs              # Todos os logs"
echo "   pm2 logs whatsapp-api # Só WhatsApp"
echo "   pm2 logs fibromialgia-backend # Só Backend"
echo ""
echo "🚀 SISTEMA PRONTO PARA USO!" 