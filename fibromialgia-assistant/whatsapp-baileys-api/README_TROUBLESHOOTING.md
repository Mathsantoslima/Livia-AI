# Troubleshooting - WhatsApp Baileys

Este documento contém soluções para problemas comuns do servidor WhatsApp Baileys.

## 🔧 Scripts Úteis

### Limpar Sessão

Se você está tendo problemas de conexão ou quer forçar uma nova autenticação:

```bash
node limpar-sessao.js
```

Este script:
- Remove todos os arquivos de sessão
- Força uma nova autenticação via QR Code
- Útil quando há erros de conexão persistentes

### Reiniciar Servidor

Para reiniciar o servidor com opção de limpar sessão:

```bash
./restart-whatsapp.sh
```

Este script:
- Encerra processos existentes
- Pergunta se deseja limpar a sessão
- Reinicia o servidor

## ⚠️ Problemas Comuns

### 1. Erro 405 "Connection Failure"

**Sintoma:**
```
Conexão fechada devido a Error: Connection Failure
statusCode: 405, error: 'Method Not Allowed'
```

**Soluções:**
1. **Aguarde alguns minutos** - Este erro geralmente é temporário
2. **Limpe a sessão** e tente novamente:
   ```bash
   node limpar-sessao.js
   node server.js
   ```
3. **Verifique sua conexão com a internet**
4. **Aguarde um pouco** - O servidor tenta reconectar automaticamente a cada 5 segundos

### 2. QR Code não aparece

**Sintoma:**
- Servidor inicia mas QR Code não é gerado

**Soluções:**
1. **Limpe a sessão**:
   ```bash
   node limpar-sessao.js
   ```
2. **Reinicie o servidor**:
   ```bash
   node server.js
   ```
3. **Verifique se o diretório `sessions/` existe** e tem permissões corretas

### 3. Sessão expirada ou inválida

**Sintoma:**
- Conexão falha repetidamente
- Mensagens de erro sobre sessão

**Solução:**
```bash
# Limpar sessão e reconectar
node limpar-sessao.js
node server.js
# Escanear novo QR Code
```

### 4. SUPABASE_URL não definida

**Sintoma:**
```
Error: SUPABASE_URL não definida
```

**Solução:**
1. Certifique-se de que o arquivo `.env` existe no diretório `backend/`
2. Verifique se as variáveis `SUPABASE_URL` e `SUPABASE_KEY` estão configuradas
3. O servidor WhatsApp Baileys carrega as variáveis do `backend/.env` automaticamente

### 5. Erro ao inicializar IA

**Sintoma:**
```
❌ Erro ao inicializar infraestrutura de IA: ...
```

**Soluções:**
1. **Verifique se o backend está rodando** na porta 3000
2. **Verifique variáveis de ambiente** (Supabase, chaves de IA)
3. **Verifique logs do erro** para mais detalhes

### 6. Reconexão contínua (loop)

**Sintoma:**
- Servidor fica tentando reconectar infinitamente

**Soluções:**
1. **Pare o servidor** (Ctrl+C)
2. **Limpe a sessão**:
   ```bash
   node limpar-sessao.js
   ```
3. **Aguarde alguns minutos** antes de reconectar
4. **Reinicie o servidor**:
   ```bash
   node server.js
   ```

## 📋 Checklist de Diagnóstico

Se você está tendo problemas, verifique:

- [ ] Backend está rodando? (`http://localhost:3000/health`)
- [ ] Arquivo `.env` existe em `backend/`?
- [ ] Variáveis `SUPABASE_URL` e `SUPABASE_KEY` estão configuradas?
- [ ] Conexão com internet está funcionando?
- [ ] Não há outros processos usando a porta 8080?
- [ ] Diretório `sessions/` existe e tem permissões corretas?

## 🔄 Fluxo de Reconexão

1. **Primeira conexão:**
   - Servidor inicia → QR Code gerado → Escanear QR Code → Conectado

2. **Conexão perdida:**
   - Servidor detecta desconexão → Tenta reconectar automaticamente a cada 5 segundos

3. **Reconexão bem-sucedida:**
   - Conexão restaurada → IA inicializada → Pronto para uso

4. **Reconexão falhando:**
   - Limpar sessão → Reiniciar → Novo QR Code

## 📞 Próximos Passos

Se nenhuma solução funcionar:

1. **Verifique os logs** para mais detalhes do erro
2. **Limpe completamente a sessão**:
   ```bash
   rm -rf sessions/
   mkdir sessions
   ```
3. **Reinicie o servidor** e aguarde o novo QR Code
4. **Verifique a documentação do Baileys** para atualizações

## 📚 Referências

- [Documentação Baileys](https://github.com/WhiskeySockets/Baileys)
- `GUIA_TESTES.md` - Guia completo de testes
- `PROXIMOS_PASSOS.md` - Próximos passos do projeto
