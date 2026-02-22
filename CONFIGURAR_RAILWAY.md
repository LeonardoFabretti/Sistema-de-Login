# 🚀 CONFIGURAR VARIÁVEIS DE AMBIENTE NO RAILWAY

## ⚠️ AÇÃO NECESSÁRIA PARA CORRIGIR O CORS

O código foi corrigido, mas você precisa **atualizar as variáveis de ambiente no Railway** para que o login funcione no GitHub Pages.

---

## 📋 PASSO A PASSO

### 1. Acesse o Railway
- Vá para: https://railway.app/
- Faça login
- Selecione seu projeto: **empowering-solace-production-c913**

### 2. Configure as Variáveis de Ambiente

Clique em **Variables** ou **Environment Variables** e adicione/atualize:

```env
# Ambiente de produção
NODE_ENV=production

# CORS - Origens permitidas (IMPORTANTE!)
CORS_ORIGIN=https://leonardofabretti.github.io,http://localhost:5000,http://127.0.0.1:5000

# Porta (Railway define automaticamente, mas pode especificar)
PORT=5000

# Database (Railway já fornece automaticamente via DATABASE_URL)
# Não precisa alterar

# JWT Secrets (SUBSTITUA por valores seguros!)
JWT_SECRET=seu_jwt_secret_super_seguro_minimo_256_bits_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_diferente_e_seguro_aqui
JWT_EXPIRE=30m
JWT_REFRESH_EXPIRE=7d

# Bcrypt
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. ⚠️ VARIÁVEL MAIS IMPORTANTE

A variável **CORS_ORIGIN** DEVE conter:
```
https://leonardofabretti.github.io,http://localhost:5000,http://127.0.0.1:5000
```

**Observações:**
- Use vírgulas para separar múltiplas origens
- **NÃO** coloque espaços entre as origens
- **NÃO** use barra no final das URLs
- Inclua o protocolo correto (https:// ou http://)

---

## 4. Salvar e Fazer Redeploy

Após adicionar/atualizar as variáveis:

1. **Salve** as alterações
2. Railway fará **redeploy automático** (aguarde 1-2 minutos)
3. Verifique os logs para confirmar que iniciou sem erros

---

## ✅ VERIFICAÇÃO

Após o redeploy, teste:

### Teste 1: Health Check
```bash
curl https://empowering-solace-production-c913.up.railway.app/health
```

Deve retornar:
```json
{"status":"OK","message":"Servidor funcionando"}
```

### Teste 2: CORS
No navegador, acesse:
```
https://leonardofabretti.github.io/Sistema-de-Login/
```

Tente fazer login. Se configurado corretamente:
- ✅ **NÃO** deve aparecer erro de CORS
- ✅ O login deve funcionar normalmente
- ✅ Deve redirecionar para o dashboard

---

## 🔍 COMO SABER SE FUNCIONOU?

### ✅ SUCESSO:
- Login funciona no GitHub Pages
- Não há erros de CORS no console do navegador
- O token é salvo e o usuário é redirecionado

### ❌ AINDA COM ERRO:
Se continuar com erro de CORS, verifique:

1. **Railway:**
   - Variável `CORS_ORIGIN` está correta?
   - Redeploy foi concluído?
   - Logs mostram algum erro?

2. **GitHub Pages:**
   - Limpou o cache do navegador?
   - URL do GitHub Pages está correta na variável?

3. **Logs do Railway:**
   - Veja se há mensagens: `❌ CORS blocked: Origin ... not allowed`
   - Isso indica que a origem não está na lista

---

## 🎯 RESUMO

**O QUE FOI CORRIGIDO NO CÓDIGO:**
1. ✅ CORS configurado com lista de origens permitidas
2. ✅ Suporte a `credentials: include`
3. ✅ Preflight (OPTIONS) configurado corretamente
4. ✅ Headers de autenticação permitidos

**O QUE VOCÊ PRECISA FAZER:**
1. ⚙️ Configurar `CORS_ORIGIN` no Railway
2. 🔄 Aguardar redeploy automático
3. 🧪 Testar login no GitHub Pages

---

## 📞 SUPORTE

Se ainda tiver problemas após configurar:
- Verifique os logs do Railway
- Use DevTools (F12) → Console → Network
- Procure por erros de CORS ou Failed to fetch

**O erro foi corrigido no código. Agora basta configurar as variáveis no Railway! 🚀**
