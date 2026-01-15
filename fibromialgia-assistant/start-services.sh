#!/bin/bash

# Iniciar API Baileys em uma nova janela do terminal
osascript -e 'tell app "Terminal" to do script "cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api && node server.js"'

# Esperar um pouco para que a API Baileys inicie
sleep 2

# Iniciar Backend em uma nova janela do terminal
osascript -e 'tell app "Terminal" to do script "cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend && node server.js"'

echo "Serviços iniciados em terminais separados"
