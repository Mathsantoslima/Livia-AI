# 🔑 Como Obter Chave da API Google AI (Gemini)

## 📋 Passo a Passo

### 1. Acesse o Google AI Studio

Visite: **https://makersuite.google.com/app/apikey**

Ou acesse diretamente:

- Google AI Studio: https://aistudio.google.com/app/apikey
- Google Cloud Console: https://console.cloud.google.com/

### 2. Faça Login

- Use sua conta Google
- Se não tiver, crie uma conta gratuita

### 3. Criar Nova Chave API

**Opção A: Google AI Studio (Recomendado)**

1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em **"Create API Key"** ou **"Get API Key"**
3. Escolha um projeto existente ou crie um novo
4. Copie a chave gerada

**Opção B: Google Cloud Console**

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **API Key**
5. Copie a chave gerada
6. (Opcional) Restrinja a chave para segurança

### 4. Configurar a Chave

#### Opção 1: Arquivo .env (Recomendado)

Crie um arquivo `.env` na pasta `backend/`:

```bash
cd fibromialgia-assistant/backend
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave:

```env
GOOGLE_AI_API_KEY=SUA_CHAVE_AQUI
GEMINI_MODEL=gemini-1.5-pro
```

#### Opção 2: Variáveis de Ambiente do Sistema

**Linux/Mac:**

```bash
export GOOGLE_AI_API_KEY=SUA_CHAVE_AQUI
export GEMINI_MODEL=gemini-1.5-pro
```

**Windows:**

```cmd
set GOOGLE_AI_API_KEY=SUA_CHAVE_AQUI
set GEMINI_MODEL=gemini-1.5-pro
```

#### Opção 3: Configurar no Servidor (Produção)

Configure as variáveis de ambiente no seu provedor de hospedagem:

- Heroku: Config Vars
- Vercel: Environment Variables
- AWS: Systems Manager Parameter Store
- Docker: docker-compose.yml

### 5. Verificar Instalação

Teste se a chave está funcionando:

```bash
cd fibromialgia-assistant/backend
node -e "require('dotenv').config(); console.log(process.env.GOOGLE_AI_API_KEY ? '✅ Chave configurada' : '❌ Chave não encontrada')"
```

Ou crie um script de teste:

```javascript
// test-google-ai.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent("Olá, teste de conexão");
    const response = await result.response;
    console.log("✅ Conexão com Google AI funcionando!");
    console.log("Resposta:", response.text());
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

test();
```

Execute:

```bash
node test-google-ai.js
```

## 🔒 Segurança

### ⚠️ IMPORTANTE: Proteja Sua Chave

1. **NUNCA** commite a chave no Git
2. Adicione `.env` ao `.gitignore`
3. Use variáveis de ambiente em produção
4. Restrinja a chave no Google Cloud Console (se possível)
5. Monitore o uso da API para detectar vazamentos

### Verificar se .env está no .gitignore

```bash
cat .gitignore | grep .env
```

Se não aparecer, adicione:

```bash
echo ".env" >> .gitignore
```

## 💰 Custos

### Plano Gratuito (Tier 1)

- **Gratuito até 15 RPM** (requests por minuto)
- **60 RPD** (requests por dia)
- Ótimo para desenvolvimento e testes

### Plano Pago

- Consulte: https://ai.google.dev/pricing
- Preços variam por modelo

## 🐛 Troubleshooting

### Erro: "API key not valid"

- Verifique se a chave está correta
- Certifique-se de não ter espaços extras
- Verifique se a API está habilitada no projeto

### Erro: "Quota exceeded"

- Você atingiu o limite gratuito
- Aguarde ou atualize para plano pago

### Erro: "GOOGLE_AI_API_KEY não configurada"

- Verifique se o arquivo `.env` existe
- Confirme que `dotenv` está carregado antes de usar
- Verifique se a variável está no formato correto

## 📚 Links Úteis

- [Google AI Studio](https://aistudio.google.com/)
- [Documentação Gemini API](https://ai.google.dev/docs)
- [Pricing](https://ai.google.dev/pricing)
- [Console do Google Cloud](https://console.cloud.google.com/)

## ✅ Checklist

- [ ] Criei conta no Google AI Studio
- [ ] Gerei uma chave API
- [ ] Criei arquivo `.env` na pasta `backend/`
- [ ] Adicionei `GOOGLE_AI_API_KEY` no `.env`
- [ ] Testei a conexão com a API
- [ ] Adicionei `.env` ao `.gitignore`
- [ ] Configurei variáveis de ambiente em produção (se aplicável)
