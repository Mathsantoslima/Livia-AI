#!/bin/bash

echo "=== Corrigindo problemas e iniciando aplicação ==="

# Remover sessões do WhatsApp Baileys
echo "Removendo sessões do WhatsApp..."
rm -rf /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api/sessions/*
mkdir -p /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api/sessions

# Instalar dependências do backend
echo "Instalando dependências faltantes no backend..."
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
npm install bcrypt

# Verificar a URL do webhook na API Baileys
echo "Verificando URL do webhook..."
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api
grep -q "WEBHOOK_URL=http://localhost:3000/webhook/whatsapp" .env || 
  echo "WEBHOOK_URL=http://localhost:3000/webhook/whatsapp" > .env.temp && 
  cat .env | grep -v WEBHOOK_URL >> .env.temp && 
  mv .env.temp .env

# Verificando variáveis de ambiente do backend
echo "Verificando variáveis de ambiente do backend..."
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
grep -q "WEBHOOK_URL" .env || 
  echo -e "\n# Webhook Baileys\nWEBHOOK_URL=http://localhost:3000/webhook/whatsapp\nENABLE_WEBHOOK=true" >> .env

# Iniciar os serviços
echo "Iniciando os serviços..."
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant

# API Baileys
osascript -e 'tell app "Terminal" to do script "cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api && node server.js"'

# Esperar 5 segundos
echo "Aguardando inicialização da API Baileys..."
sleep 5

# Backend
osascript -e 'tell app "Terminal" to do script "cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend && node server.js"'

echo "=== Serviços iniciados em terminais separados ==="
echo "Caso ainda haja problemas, verifique os logs nos terminais." 