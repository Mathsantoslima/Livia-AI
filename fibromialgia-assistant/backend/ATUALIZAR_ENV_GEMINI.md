# 🔧 Atualizar Modelo Gemini no .env

## ⚠️ Problema Encontrado

O arquivo `.env` está configurado com o modelo antigo que não funciona:

```
GEMINI_MODEL=gemini-1.5-flash
```

## ✅ Solução

### Opção 1: Editar o .env Manualmente

1. **Abra o arquivo `.env`** na pasta `backend/`
2. **Localize a linha** `GEMINI_MODEL=gemini-1.5-flash`
3. **Altere para** uma das opções abaixo:

```bash
# Opção A: Usar modelo flash-latest (recomendado)
GEMINI_MODEL=gemini-1.5-flash-latest

# Opção B: Usar modelo pro (mais poderoso, pode ter custo)
GEMINI_MODEL=gemini-1.5-pro

# Opção C: Usar modelo pro-latest
GEMINI_MODEL=gemini-1.5-pro-latest

# Opção D: Usar apenas gemini-pro (mais antigo, mas estável)
GEMINI_MODEL=gemini-pro
```

4. **Salve o arquivo**
5. **Reinicie o backend:**

```bash
# Pressione Ctrl+C para parar
npm start
```

### Opção 2: Usar Comando

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend

# Atualizar o .env (se existir)
if [ -f .env ]; then
  # Backup
  cp .env .env.backup

  # Atualizar GEMINI_MODEL
  if grep -q "GEMINI_MODEL=" .env; then
    sed -i '' 's/GEMINI_MODEL=.*/GEMINI_MODEL=gemini-1.5-flash-latest/' .env
    echo "✅ GEMINI_MODEL atualizado para gemini-1.5-flash-latest"
  else
    echo "GEMINI_MODEL=gemini-1.5-flash-latest" >> .env
    echo "✅ GEMINI_MODEL adicionado ao .env"
  fi
else
  echo "⚠️ Arquivo .env não encontrado. Criando..."
  echo "GEMINI_MODEL=gemini-1.5-flash-latest" > .env
fi

echo ""
echo "📋 Verifique o .env:"
grep GEMINI_MODEL .env
```

---

## 🧪 Modelos Disponíveis

| Modelo                    | Descrição                                      | Free Tier   |
| ------------------------- | ---------------------------------------------- | ----------- |
| `gemini-1.5-flash-latest` | Última versão do Flash (recomendado)           | ✅ Sim      |
| `gemini-1.5-pro-latest`   | Última versão do Pro                           | ⚠️ Limitado |
| `gemini-pro`              | Modelo Pro estável                             | ✅ Sim      |
| `gemini-1.5-flash`        | ❌ **NÃO FUNCIONA** (não existe na API v1beta) | -           |

---

## ✅ Após Atualizar

1. **Reinicie o backend** (Ctrl+C e depois `npm start`)
2. **Teste enviando uma mensagem** para `(11) 93618-8540`
3. **Verifique os logs** - não deve mais aparecer o erro 404

---

## 🔍 Verificar Modelo Atual

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
grep GEMINI_MODEL .env
```
