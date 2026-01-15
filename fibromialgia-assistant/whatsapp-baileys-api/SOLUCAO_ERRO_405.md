# Solução: Erro 405 - QR Code não aparece

## 🔍 Problema

O servidor está tentando conectar mas recebe erro 405 "Connection Failure" ANTES de gerar o QR Code.

## 📋 Possíveis Causas

1. **Problema de conectividade** com servidores do WhatsApp
2. **Bloqueio temporário** do WhatsApp
3. **Versão do Baileys** desatualizada
4. **Configuração de rede/proxy/firewall**
5. **Problema com a sessão** (mesmo após limpar)

## ✅ Soluções para Tentar

### 1. Aguardar e Tentar Novamente (Recomendado Primeiro)

O erro 405 geralmente é **temporário**. Aguarde alguns minutos (10-15 minutos) antes de tentar novamente.

### 2. Verificar Conexão com Internet

```bash
# Testar conexão
ping -c 4 8.8.8.8

# Testar DNS
nslookup web.whatsapp.com
```

### 3. Atualizar Baileys

```bash
cd whatsapp-baileys-api
npm update @whiskeysockets/baileys
```

### 4. Limpar Completamente e Tentar Novamente

```bash
# Parar o servidor (Ctrl+C)

# Limpar sessão
cd whatsapp-baileys-api
node limpar-sessao.js

# Remover node_modules e reinstalar (opcional)
rm -rf node_modules package-lock.json
npm install

# Reiniciar
node server.js
```

### 5. Verificar se há Proxy/Firewall Bloqueando

Se você está atrás de um proxy ou firewall, pode ser necessário configurá-lo.

### 6. Tentar em Outra Rede

Se possível, tente conectar em outra rede (ex: usar hotspot do celular) para descartar problemas de rede local.

### 7. Verificar Logs Detalhados

O logger está configurado como "silent". Se quiser ver mais detalhes, você pode modificar temporariamente:

```javascript
// Em server.js, linha ~44
const logger = pino({ level: "info" }); // ou "debug" para mais detalhes
```

## ⚠️ Observação Importante

O erro 405 é um problema de **conectividade com os servidores do WhatsApp**, não um problema do código. O código está correto - o problema é que o WhatsApp está rejeitando a conexão antes mesmo de gerar o QR Code.

## 🔄 Processo Normal

1. **Servidor inicia** → Tenta conectar com WhatsApp
2. **WhatsApp gera QR Code** → Evento `qr` é emitido
3. **QR Code é exibido** → Usuário escaneia
4. **Conexão estabelecida** → Evento `connection === "open"`

## ❌ O que está acontecendo

1. **Servidor inicia** → Tenta conectar com WhatsApp
2. **Erro 405 ocorre** → WhatsApp rejeita a conexão ANTES de gerar QR Code
3. **Reconexão tenta** → Mas falha novamente

## 💡 Recomendação

1. **Aguarde 15-30 minutos** - Erros 405 geralmente são temporários
2. **Verifique sua conexão** com internet
3. **Tente em outra rede** se possível
4. **Verifique se há atualizações** do Baileys disponíveis

## 📞 Se o Problema Persistir

Se o erro 405 continuar por mais de 1 hora, pode indicar:
- Bloqueio permanente do número/IP
- Problema de rede mais sério
- Necessidade de atualizar o Baileys

Neste caso, considere:
- Usar API oficial do WhatsApp (WhatsApp Business API)
- Verificar se há atualizações do Baileys
- Tentar de outro ambiente/rede
