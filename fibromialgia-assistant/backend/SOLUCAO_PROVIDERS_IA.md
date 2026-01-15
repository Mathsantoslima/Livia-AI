# 🔧 Solução para Problemas com Providers de IA

## 📋 Problemas Identificados

### 1. **Gemini - Quota Excedida / Modelo Incorreto**
- **Erro**: `429 Too Many Requests` - Quota excedida
- **Causa**: O modelo `gemini-3-pro-preview` não está disponível no free tier
- **Solução**: Alterado modelo padrão para `gemini-1.5-flash` (disponível no free tier)

### 2. **ChatGPT - Quota Excedida**
- **Erro**: `429 You exceeded your current quota`
- **Causa**: Chave de API sem crédito disponível
- **Solução**: Verificar créditos na conta OpenAI ou usar outro provider

### 3. **Claude - Erro de Inicialização**
- **Erro**: `Cannot read properties of undefined (reading 'create')`
- **Causa**: Cliente não inicializado quando API key não está configurada
- **Solução**: Adicionada verificação antes de inicializar o cliente

### 4. **Tabelas do Supabase Faltando**
- **Erro**: `Could not find the table 'public.conversations_livia'`
- **Tabelas faltando**: `conversations_livia`, `users_livia`, `collective_insights`
- **Impacto**: Funcionalidades avançadas não funcionam, mas o básico funciona

## ✅ Correções Aplicadas

### 1. Modelo Gemini Alterado
- **Antes**: `gemini-1.5-pro` (pode estar sendo sobrescrito para `gemini-3-pro-preview`)
- **Agora**: `gemini-1.5-flash` (compatível com free tier)

### 2. Claude com Verificação de API Key
- Adicionada verificação antes de inicializar o cliente
- Provider desabilitado graciosamente se não tiver API key

### 3. Mensagem de Erro Melhorada
- Mensagem mais amigável quando todos os providers falham
- Informa sobre problemas técnicos de forma clara

## 🔍 Verificar Configuração

### Verificar Modelo Gemini no .env
```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
grep GEMINI_MODEL .env
```

Se encontrar `GEMINI_MODEL=gemini-3-pro-preview`, altere para:
```bash
GEMINI_MODEL=gemini-1.5-flash
```

### Verificar Chaves de API
```bash
# Verificar se as chaves estão configuradas
grep -E "GOOGLE_AI_API_KEY|OPENAI_API_KEY|CLAUDE_API_KEY" .env
```

## 🚀 Próximos Passos

### Opção 1: Usar Gemini Flash (Recomendado para Testes)
O modelo `gemini-1.5-flash` está disponível no free tier e deve funcionar.

**Verificar se está funcionando:**
1. Envie uma mensagem de teste
2. Verifique os logs: `tail -f /tmp/backend.log`
3. Se ainda der erro de quota, verifique sua conta Google AI Studio

### Opção 2: Configurar Claude (Se tiver API key)
Se você tem uma chave da Anthropic:
1. Adicione ao `.env`: `CLAUDE_API_KEY=sua_chave_aqui`
2. Reinicie o backend

### Opção 3: Configurar ChatGPT (Se tiver créditos)
Se você tem créditos na OpenAI:
1. Verifique se `OPENAI_API_KEY` está no `.env`
2. Verifique se há créditos disponíveis na conta
3. Reinicie o backend

## 📝 Status Atual

- ✅ **Webhook W-API**: Funcionando
- ✅ **Processamento de Mensagens**: Funcionando
- ✅ **Canal WhatsApp**: Criado e registrado
- ⚠️ **Providers de IA**: Todos falhando (quota/API keys)
- ⚠️ **Tabelas Supabase**: Faltando (não crítico para funcionamento básico)

## 🎯 Teste Rápido

Envie uma nova mensagem e verifique os logs. Se o Gemini Flash estiver funcionando, você verá:
```
[Gemini] Resposta gerada com sucesso
[WhatsApp] Enviado para 5511947439705: [resposta da Livia]
```

Se ainda der erro, verifique:
1. Se a chave `GOOGLE_AI_API_KEY` está válida
2. Se há quota disponível no Google AI Studio
3. Se o modelo `gemini-1.5-flash` está disponível na sua região

## 💡 Dica

Para desenvolvimento/testes, você pode usar apenas um provider que funcione. Configure no `.env`:
```bash
# Usar apenas Gemini Flash
GEMINI_MODEL=gemini-1.5-flash
# Desabilitar outros providers se não tiver chaves
# OPENAI_API_KEY=
# CLAUDE_API_KEY=
```
