#!/bin/bash

echo "🚀 Iniciando ngrok para o backend..."
echo ""
echo "⚠️  IMPORTANTE: Deixe este terminal aberto!"
echo "📋 Copie a URL HTTPS que aparecer abaixo"
echo "🔗 Configure no painel W-API: https://painel.w-api.app"
echo ""

# Verificar se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não está instalado!"
    echo ""
    echo "📦 Instalar ngrok:"
    echo "   macOS: brew install ngrok"
    echo "   Ou baixar de: https://ngrok.com/download"
    exit 1
fi

# Verificar se o backend está rodando
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  Backend não está rodando na porta 3000!"
    echo "📋 Inicie o backend primeiro:"
    echo "   cd backend && npm start"
    echo ""
    read -p "Continuar mesmo assim? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Iniciando ngrok na porta 3000..."
echo ""

ngrok http 3000

