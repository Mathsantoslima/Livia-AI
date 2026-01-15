#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando configuração do serviço de WhatsApp sem Docker...${NC}"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não encontrado. Por favor, instale o Node.js e tente novamente.${NC}"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm não encontrado. Por favor, instale o npm e tente novamente.${NC}"
    exit 1
fi

# Gerar token seguro para API
WHATSAPP_API_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
echo -e "${YELLOW}Token API gerado: ${WHATSAPP_API_KEY}${NC}"

# Criar diretório para o projeto WhatsApp
mkdir -p whatsapp-web-api
cd whatsapp-web-api

# Inicializar o projeto
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Inicializando o projeto...${NC}"
    npm init -y
fi

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
npm install whatsapp-web.js express body-parser cors dotenv qrcode-terminal

# Criar arquivo .env para configuração
echo -e "${YELLOW}Configurando variáveis de ambiente...${NC}"
cat > .env << EOL
PORT=8080
WHATSAPP_API_KEY=${WHATSAPP_API_KEY}
WEBHOOK_URL=http://localhost:3000/api/webhooks/whatsapp
ENABLE_WEBHOOK=true
EOL

# Criar arquivo do servidor
echo -e "${YELLOW}Criando servidor WhatsApp...${NC}"
cat > server.js << 'EOL'
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Configurações
const PORT = process.env.PORT || 8080;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ENABLE_WEBHOOK = process.env.ENABLE_WEBHOOK === 'true';

// Inicializar Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Autenticação API
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== WHATSAPP_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Estado do cliente WhatsApp
let client;
let qrCodeText = '';
let connectionStatus = 'disconnected';

// Inicializar cliente WhatsApp
function initializeWhatsAppClient() {
    // Criar diretório de sessão se não existir
    const sessionDir = path.join(__dirname, '.wwebjs_auth');
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ['--no-sandbox']
        }
    });

    // Evento de QR Code
    client.on('qr', (qr) => {
        qrCodeText = qr;
        console.log('QR Code gerado. Escaneie com WhatsApp:');
        qrcode.generate(qr, { small: true });
        connectionStatus = 'qr_code';
    });

    // Evento de autenticação
    client.on('authenticated', () => {
        console.log('Autenticado com sucesso!');
        connectionStatus = 'authenticated';
    });

    // Evento de inicialização
    client.on('ready', () => {
        console.log('Cliente WhatsApp pronto!');
        connectionStatus = 'connected';
    });

    // Evento de mensagem
    client.on('message', async (message) => {
        console.log(`Mensagem recebida de ${message.from}: ${message.body}`);
        
        // Enviar webhook se estiver habilitado
        if (ENABLE_WEBHOOK && WEBHOOK_URL) {
            try {
                const webhookData = {
                    event: 'message',
                    data: {
                        from: message.from,
                        to: message.to,
                        body: message.body,
                        id: message.id._serialized,
                        timestamp: message.timestamp,
                        type: message.type
                    }
                };
                
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': WHATSAPP_API_KEY
                    }
                };
                
                const req = http.request(WEBHOOK_URL, options);
                req.write(JSON.stringify(webhookData));
                req.end();
            } catch (error) {
                console.error('Erro ao enviar webhook:', error);
            }
        }
    });

    // Evento de desconexão
    client.on('disconnected', (reason) => {
        console.log('Cliente desconectado:', reason);
        connectionStatus = 'disconnected';
        
        // Reiniciar cliente após desconexão
        setTimeout(() => {
            console.log('Reiniciando cliente...');
            initializeWhatsAppClient();
        }, 5000);
    });

    // Iniciar cliente
    client.initialize();
}

// Endpoint para obter QR Code
app.get('/qrcode', apiKeyMiddleware, (req, res) => {
    if (connectionStatus === 'connected') {
        return res.status(200).json({ 
            status: 'success', 
            message: 'Já conectado ao WhatsApp' 
        });
    }
    
    if (qrCodeText) {
        return res.status(200).json({ 
            status: 'success', 
            qrcode: qrCodeText 
        });
    }
    
    return res.status(404).json({ 
        status: 'error', 
        message: 'QR Code ainda não gerado' 
    });
});

// Endpoint para verificar status
app.get('/status', apiKeyMiddleware, (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            connection: connectionStatus,
            timestamp: new Date().toISOString()
        }
    });
});

// Endpoint para enviar mensagem
app.post('/send', apiKeyMiddleware, async (req, res) => {
    const { to, message } = req.body;
    
    if (!to || !message) {
        return res.status(400).json({
            status: 'error',
            message: 'Parâmetros "to" e "message" são obrigatórios'
        });
    }
    
    if (connectionStatus !== 'connected') {
        return res.status(400).json({
            status: 'error',
            message: 'Cliente WhatsApp não está conectado'
        });
    }
    
    try {
        // Formatar número se necessário
        let phoneNumber = to;
        if (!phoneNumber.includes('@c.us')) {
            phoneNumber = phoneNumber.replace(/[^\d]/g, '');
            phoneNumber = `${phoneNumber}@c.us`;
        }
        
        // Enviar mensagem
        const result = await client.sendMessage(phoneNumber, message);
        
        res.status(200).json({
            status: 'success',
            data: {
                id: result.id._serialized,
                to: phoneNumber,
                message: message
            }
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao enviar mensagem',
            error: error.message
        });
    }
});

// Endpoint para desconectar
app.post('/logout', apiKeyMiddleware, async (req, res) => {
    try {
        if (client) {
            await client.logout();
            res.status(200).json({
                status: 'success',
                message: 'Desconectado com sucesso'
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: 'Cliente não inicializado'
            });
        }
    } catch (error) {
        console.error('Erro ao desconectar:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao desconectar',
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor WhatsApp API rodando na porta ${PORT}`);
    console.log(`API Key: ${WHATSAPP_API_KEY}`);
    console.log(`Webhook URL: ${WEBHOOK_URL}`);
});

// Inicializar cliente WhatsApp
initializeWhatsAppClient();
EOL

# Configurar backend
cd ..
if [ ! -f "./backend/.env" ]; then
    echo "WHATSAPP_API_URL=http://localhost:8080" > ./backend/.env
    echo "WHATSAPP_API_KEY=${WHATSAPP_API_KEY}" >> ./backend/.env
    
    echo -e "${GREEN}✓ Arquivo .env criado no backend com as configurações do serviço de WhatsApp${NC}"
else
    # Verificar se as variáveis já existem no arquivo .env
    if ! grep -q "WHATSAPP_API_URL" ./backend/.env; then
        echo "WHATSAPP_API_URL=http://localhost:8080" >> ./backend/.env
    fi
    
    if ! grep -q "WHATSAPP_API_KEY" ./backend/.env; then
        echo "WHATSAPP_API_KEY=${WHATSAPP_API_KEY}" >> ./backend/.env
    fi
    
    echo -e "${GREEN}✓ Variáveis de ambiente configuradas no arquivo .env do backend${NC}"
fi

# Iniciar o servidor
cd whatsapp-web-api
echo -e "${YELLOW}Iniciando servidor WhatsApp...${NC}"
node server.js 