#!/bin/bash

set -e

echo "=== Configurando ambiente de desenvolvimento do FibroIA ==="
echo ""

echo "1. Verificando dependências..."
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado. Por favor, instale o Node.js (v16+)."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "NPM não encontrado. Por favor, instale o NPM."
    exit 1
fi

echo "2. Instalando dependências globais..."
npm install -g supabase

echo "3. Configurando o backend..."
cd backend
npm install
echo "Backend configurado com sucesso!"

echo "4. Configurando o painel administrativo..."
cd ../admin-panel
npm install
echo "Painel administrativo configurado com sucesso!"

echo "5. Criando diretórios necessários..."
mkdir -p ../logs

echo "6. Verificando configuração do Supabase..."
echo "IMPORTANTE: Você já criou um projeto no Supabase e executou os scripts SQL?"
select yn in "Sim" "Não"; do
    case $yn in
        Sim ) break;;
        Não ) 
            echo "Por favor, crie um projeto no Supabase (https://supabase.com) e execute os scripts SQL em backend/supabase/migrations antes de continuar."
            echo "Depois disso, execute este script novamente."
            exit 0;;
    esac
done

echo "7. Verificando arquivos de ambiente..."
if [ ! -f "backend/.env" ]; then
    echo "Arquivo .env não encontrado no backend. Criando um modelo..."
    echo "SUPABASE_URL=sua_url_do_supabase" > backend/.env
    echo "SUPABASE_ANON_KEY=sua_chave_anon_do_supabase" >> backend/.env
    echo "PORT=3000" >> backend/.env
    echo "Por favor, edite o arquivo backend/.env com suas credenciais do Supabase."
fi

if [ ! -f "admin-panel/.env" ]; then
    echo "Arquivo .env não encontrado no painel administrativo. Criando um modelo..."
    echo "REACT_APP_SUPABASE_URL=sua_url_do_supabase" > admin-panel/.env
    echo "REACT_APP_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase" >> admin-panel/.env
    echo "Por favor, edite o arquivo admin-panel/.env com suas credenciais do Supabase."
fi

echo ""
echo "=== Configuração concluída com sucesso! ==="
echo ""
echo "Para iniciar o backend:"
echo "cd backend && npm start"
echo ""
echo "Para iniciar o painel administrativo:"
echo "cd admin-panel && npm start"
echo ""
echo "Acesse o painel administrativo em: http://localhost:3000"
echo "Credenciais iniciais:"
echo "Email: admin@fibroia.com"
echo "Senha: admin123"
echo ""
echo "Lembre-se de alterar a senha após o primeiro login!" 