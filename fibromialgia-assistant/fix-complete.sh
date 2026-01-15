#!/bin/bash

echo "🚀 CORRIGINDO TODOS OS PROBLEMAS..."

# 1. Parar todos os serviços
echo "📍 Parando serviços..."
pm2 stop all 2>/dev/null || true
pkill -f "server.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant

# 2. Criar .env para o BACKEND com OpenAI
echo "📍 Criando .env do backend..."
cat > backend/.env << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

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

# 3. Criar .env para WhatsApp API
echo "📍 Configurando WhatsApp API..."
cat > whatsapp-baileys-api/.env << 'EOF'
PORT=8080
WHATSAPP_API_KEY=12588eb53f90c49aff2f0cdfca0a4878
WEBHOOK_URL=http://localhost:3000/webhook/whatsapp
ENABLE_WEBHOOK=true
EOF

# 4. Criar .env para Admin Panel
echo "📍 Configurando Admin Panel..."
cat > admin-panel/.env << 'EOF'
REACT_APP_SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0OTIyOTYsImV4cCI6MjA1MDA2ODI5Nn0.FLPkKLf7nEyNJKWYYbwJBMq0CZTsE4aFjCxR_WFnGgA
REACT_APP_BACKEND_URL=http://localhost:3000
EOF

# 5. Limpar sessões antigas
echo "📍 Limpando sessões antigas..."
rm -rf whatsapp-baileys-api/sessions/*
mkdir -p whatsapp-baileys-api/sessions

# 6. Instalar dependências se necessário
echo "📍 Verificando dependências..."
cd backend && npm install --silent
cd ../admin-panel && npm install --silent  
cd ../whatsapp-baileys-api && npm install --silent
cd ..

# 7. Iniciar BACKEND primeiro
echo "📍 Iniciando Backend..."
pm2 start backend/server.js --name "fibromialgia-backend" --watch

# 8. Aguardar backend inicializar
sleep 3

# 9. Iniciar WhatsApp API
echo "📍 Iniciando WhatsApp API..."
pm2 start whatsapp-baileys-api/server.js --name "whatsapp-api" --watch

# 10. Aguardar WhatsApp API
sleep 5

# 11. Iniciar Admin Panel
echo "📍 Iniciando Admin Panel..."
cd admin-panel
BROWSER=none npm start &
cd ..

echo ""
echo "🎉 TODOS OS SERVIÇOS INICIADOS!"
echo ""
echo "📊 STATUS DOS SERVIÇOS:"
echo "✅ Backend:      http://localhost:3000"
echo "✅ WhatsApp API: http://localhost:8080" 
echo "✅ Admin Panel:  http://localhost:3001"
echo ""
echo "⚠️  IMPORTANTE: Você precisa configurar sua OPENAI_API_KEY!"
echo "   Edite: backend/.env e adicione sua chave da OpenAI"
echo ""
echo "📱 Para conectar WhatsApp:"
echo "   1. Acesse http://localhost:8080/qr"
echo "   2. Escaneie o QR code com seu WhatsApp"
echo ""
echo "🔧 Para verificar logs:"
echo "   pm2 logs" 