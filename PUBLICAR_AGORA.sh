#!/bin/bash

echo "🚀 Script para Publicar no Git e Vercel"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")"

# 1. Verificar se já é um repositório Git
if [ -d .git ]; then
    echo -e "${YELLOW}⚠️  Repositório Git já inicializado${NC}"
    read -p "Deseja continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        exit 1
    fi
else
    echo -e "${BLUE}1️⃣  Inicializando repositório Git...${NC}"
    git init
    echo -e "${GREEN}   ✅ Git inicializado${NC}"
fi

# 2. Verificar .gitignore
if [ ! -f .gitignore ]; then
    echo -e "${YELLOW}⚠️  .gitignore não encontrado. Criando...${NC}"
    # O .gitignore já foi criado anteriormente
fi

# 3. Adicionar arquivos
echo -e "${BLUE}2️⃣  Adicionando arquivos ao Git...${NC}"
git add .
echo -e "${GREEN}   ✅ Arquivos adicionados${NC}"

# 4. Status
echo -e "${BLUE}3️⃣  Status do repositório:${NC}"
git status --short | head -20

# 5. Commit
echo ""
read -p "Deseja fazer commit? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    read -p "Mensagem do commit: " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="🎉 Primeiro commit: Sistema Fibro.IA completo"
    fi
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}   ✅ Commit realizado${NC}"
fi

# 6. Instruções para GitHub
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1. Crie um repositório no GitHub:"
echo "   https://github.com/new"
echo ""
echo "2. Depois, execute:"
echo -e "${GREEN}   git remote add origin https://github.com/SEU-USUARIO/fibro.ia.git${NC}"
echo -e "${GREEN}   git branch -M main${NC}"
echo -e "${GREEN}   git push -u origin main${NC}"
echo ""
echo "3. Depois, veja o arquivo PUBLICAR_GIT_VERCEL.md para deploy no Vercel"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
