#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando configuração do serviço de WhatsApp com Baileys...${NC}"

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
mkdir -p whatsapp-baileys-api
cd whatsapp-baileys-api

# Inicializar o projeto
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Inicializando o projeto...${NC}"
    npm init -y
fi

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
npm install @whiskeysockets/baileys express body-parser cors dotenv qrcode-terminal @hapi/boom pino

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
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { Boom } = require('@hapi/boom');
const http = require('http');
const pino = require('pino');
require('dotenv').config();

// Configurações
const PORT = process.env.PORT || 8080;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ENABLE_WEBHOOK = process.env.ENABLE_WEBHOOK === 'true';

// Criar diretório de sessão
const SESSION_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Inicializar Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Logger silencioso
const logger = pino({ level: 'silent' });

// Autenticação API
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== WHATSAPP_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Estado do cliente WhatsApp
let sock;
let qrCodeText = '';
let connectionStatus = 'disconnected';

// Inicializar cliente WhatsApp
async function connectToWhatsApp() {
    // Carregar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    
    // Criar socket do WhatsApp
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger
    });
    
    // Manipulador de conexão
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            // Gerar QR Code
            qrCodeText = qr;
            console.log('QR Code gerado. Escaneie com WhatsApp:');
            qrcode.generate(qr, { small: true });
            connectionStatus = 'qr_code';
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom && 
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut);
            
            console.log('Conexão fechada devido a ', lastDisconnect.error);
            connectionStatus = 'disconnected';
            
            // Reconectar se não for logout
            if (shouldReconnect) {
                console.log('Reconectando...');
                setTimeout(connectToWhatsApp, 5000);
            } else {
                console.log('Desconectado permanentemente.');
                // Limpar arquivos de sessão
                fs.rmSync(SESSION_DIR, { recursive: true, force: true });
                if (!fs.existsSync(SESSION_DIR)) {
                    fs.mkdirSync(SESSION_DIR, { recursive: true });
                }
                setTimeout(connectToWhatsApp, 5000);
            }
        } else if (connection === 'open') {
            console.log('Conexão aberta!');
            connectionStatus = 'connected';
        }
    });
    
    // Salvar credenciais quando atualizado
    sock.ev.on('creds.update', saveCreds);
    
    // Manipulador de mensagens
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe && msg.message) {
                    // Extrair conteúdo da mensagem
                    const messageContent = msg.message.conversation || 
                        (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) || 
                        (msg.message.imageMessage && msg.message.imageMessage.caption) || 
                        '';
                    
                    console.log(`Nova mensagem de ${msg.key.remoteJid}: ${messageContent}`);
                    
                    // Enviar webhook se estiver habilitado
                    if (ENABLE_WEBHOOK && WEBHOOK_URL) {
                        try {
                            const webhookData = {
                                event: 'message',
                                data: {
                                    from: msg.key.remoteJid,
                                    to: sock.user.id,
                                    body: messageContent,
                                    id: msg.key.id,
                                    timestamp: msg.messageTimestamp,
                                    type: Object.keys(msg.message)[0]
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
                }
            }
        }
    });
    
    return sock;
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
    let phoneNumber = '';
    
    if (sock && sock.user) {
        phoneNumber = sock.user.id.split(':')[0];
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            connection: connectionStatus,
            phone: phoneNumber,
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
        if (!phoneNumber.includes('@s.whatsapp.net')) {
            phoneNumber = phoneNumber.replace(/[^\d]/g, '');
            phoneNumber = `${phoneNumber}@s.whatsapp.net`;
        }
        
        // Enviar mensagem
        const result = await sock.sendMessage(phoneNumber, { text: message });
        
        res.status(200).json({
            status: 'success',
            data: {
                id: result.key.id,
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
        if (sock) {
            await sock.logout();
            // Limpar arquivos de sessão
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
            if (!fs.existsSync(SESSION_DIR)) {
                fs.mkdirSync(SESSION_DIR, { recursive: true });
            }
            
            connectionStatus = 'disconnected';
            qrCodeText = '';
            
            res.status(200).json({
                status: 'success',
                message: 'Desconectado com sucesso'
            });
            
            // Reconectar em 5 segundos
            setTimeout(connectToWhatsApp, 5000);
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
    
    // Iniciar cliente WhatsApp
    connectToWhatsApp();
});
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
cd whatsapp-baileys-api
echo -e "${YELLOW}Iniciando servidor WhatsApp...${NC}"
node server.js 