#!/bin/bash

echo "🔧 Corrigindo modelo Gemini..."
echo ""

cd "$(dirname "$0")"

# Backup do .env
if [ -f .env ]; then
  cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
  echo "✅ Backup do .env criado"
fi

# Atualizar GEMINI_MODEL no .env
if [ -f .env ]; then
  if grep -q "^GEMINI_MODEL=" .env; then
    sed -i '' 's/^GEMINI_MODEL=.*/GEMINI_MODEL=gemini-1.5-flash-latest/' .env
    echo "✅ GEMINI_MODEL atualizado no .env"
  else
    echo "GEMINI_MODEL=gemini-1.5-flash-latest" >> .env
    echo "✅ GEMINI_MODEL adicionado ao .env"
  fi
else
  echo "GEMINI_MODEL=gemini-1.5-flash-latest" > .env
  echo "✅ Arquivo .env criado com GEMINI_MODEL"
fi

echo ""
echo "📋 Configuração atual:"
grep "^GEMINI_MODEL=" .env

echo ""
echo "✅ Correção concluída!"
echo "📋 Próximo passo: Reinicie o backend (Ctrl+C e depois npm start)"
