#!/bin/bash

echo "=== Verificação dos Serviços ==="

# Verificar portas
echo "1. Verificando portas:"
if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Backend (3000): Rodando"
else
    echo "❌ Backend (3000): Parado"
fi

if lsof -i :8080 >/dev/null 2>&1; then
    echo "✅ WhatsApp API (8080): Rodando"
else
    echo "❌ WhatsApp API (8080): Parado"
fi

if lsof -i :3001 >/dev/null 2>&1; then
    echo "✅ Frontend (3001): Rodando"
else
    echo "❌ Frontend (3001): Parado"
fi

# Testar APIs
echo -e "\n2. Testando APIs:"
if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Backend API: Respondendo"
else
    echo "❌ Backend API: Não responde"
fi

if curl -s http://localhost:8080/status >/dev/null 2>&1; then
    echo "✅ WhatsApp API: Respondendo"
else
    echo "❌ WhatsApp API: Não responde"
fi

echo -e "\n3. Recomendações:"
echo "- Acesse: http://localhost:3001"
echo "- Login: admin@fibroia.com / admin123"
echo "- Configure WhatsApp na seção correspondente" 