#!/bin/bash

# Instalar dependências do backend
echo "Instalando dependências do backend..."
npm install

# Instalar dependências do frontend
echo "Instalando dependências do frontend..."
cd admin-panel
npm install
cd ..

# Iniciar o backend em background
echo "Iniciando o backend..."
npm run dev &
BACKEND_PID=$!

# Iniciar o frontend
echo "Iniciando o frontend..."
cd admin-panel
npm start

# Quando o frontend for encerrado, encerrar o backend também
kill $BACKEND_PID 