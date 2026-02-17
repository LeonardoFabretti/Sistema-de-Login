# 🔐 Como Usar JWT nas Suas Rotas

## 📋 Visão Geral

O middleware de autenticação JWT já está implementado e pronto para uso. Este guia mostra como proteger suas rotas.

## 🚀 Uso Básico

### 1. Importar Middlewares

```javascript
const { protect, restrictTo } = require('../middlewares/auth');
```

### 2. Proteger Rota (Autenticação)

```javascript
// Qualquer usuário autenticado pode acessar
router.get('/profile', protect, getProfile);
```

### 3. Restringir por Role (Autorização)

```javascript
// Apenas admin pode acessar
router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);

// Admin OU moderator podem acessar
router.put('/posts/:id', protect, restrictTo('admin', 'moderator'), editPost);
```

## 📝 Exemplos Práticos

### Rota Pública (sem proteção)

```javascript
router.get('/api/info', (req, res) => {
  res.json({ message: 'Informações públicas' });
});
```

**Teste:**
```bash
curl http://localhost:3000/api/info
# ✅ 200 OK - Qualquer um pode acessar
```

---

### Rota Protegida (requer autenticação)

```javascript
router.get('/api/users/me', protect, (req, res) => {
  // req.user foi anexado pelo middleware
  res.json({ 
    user: req.user  // { id, name, email, role }
  });
});
```

**Teste com token:**
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# ✅ 200 OK - Retorna dados do usuário
```

**Teste sem token:**
```bash
curl http://localhost:3000/api/users/me
# ❌ 401 Unauthorized - Token não fornecido
```

---

### Rota Restrita (requer role específico)

```javascript
router.get('/api/admin/users', 
  protect,                    // 1º valida JWT
  restrictTo('admin'),        // 2º verifica role
  getAllUsers
);
```

**Teste com usuário comum:**
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <token_user_comum>"
# ❌ 403 Forbidden - Permissões insuficientes
```

**Teste com admin:**
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <token_admin>"
# ✅ 200 OK - Lista de usuários
```

---

### Autorização Customizada no Controller

```javascript
router.put('/api/users/:id', protect, async (req, res) => {
  const targetUserId = req.params.id;
  const currentUser = req.user;  // Anexado pelo middleware protect
  
  // Permitir apenas se for próprio perfil OU admin
  const canEdit = (currentUser.id === targetUserId) || (currentUser.role === 'admin');
  
  if (!canEdit) {
    return res.status(403).json({
      success: false,
      message: 'Você só pode editar seu próprio perfil'
    });
  }
  
  // Lógica de atualização...
});
```

---

## 🔍 Como o Token é Validado

### Estrutura do JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← Header (Base64)
.
eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoidXNlciJ9  ← Payload (Base64)
.
4Adcj_jF3vPI4PAMeJJPjK8N5zyb0YKXvD-RKHnxJDo  ← Signature (HMAC-SHA256)
```

**Decodificando:**
- Header: `{"alg":"HS256","typ":"JWT"}`
- Payload: `{"userId":"123","role":"user","exp":1709209800}`
- Signature: `HMAC-SHA256(Header.Payload, SECRET)`

### Processo de Validação (6 passos)

```
┌─────────────────────────────────────────────┐
│ 1. EXTRAIR TOKEN                            │
│    - Authorization: Bearer <token>          │
│    - Cookie: accessToken=<token>            │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│ 2. VERIFICAR ASSINATURA                     │
│    - Decodifica Header + Payload            │
│    - Recalcula: HMAC-SHA256(H.P, SECRET)    │
│    - Compara com assinatura recebida        │
│    ❌ Se diferente = token adulterado       │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│ 3. VERIFICAR EXPIRAÇÃO                      │
│    - Compara exp com timestamp atual        │
│    ❌ Se expirado = token inválido          │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│ 4. BUSCAR USUÁRIO NO BANCO                  │
│    - Usa userId do payload                  │
│    ❌ Se não existe = usuário deletado      │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│ 5. VERIFICAR SE CONTA ESTÁ ATIVA            │
│    - Verifica is_active = true              │
│    ❌ Se false = conta desativada           │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│ 6. VERIFICAR MUDANÇA DE SENHA               │
│    - Compara password_changed_at > token.iat│
│    ❌ Se mudou = token invalidado           │
└─────────────────────────────────────────────┘
                    ▼
              req.user = { ... }
```

---

## 🔒 Por Que é Seguro

### 1. Assinatura HMAC-SHA256 Previne Falsificação

**Tentativa de ataque:**
```javascript
// Atacante decodifica payload e tenta trocar role
const payload = {
  userId: "123",
  role: "admin"  // ← Alterado de "user" para "admin"
};

// Cria novo token
const fakeToken = base64(header) + "." + base64(payload) + "." + <assinatura_antiga>;
```

**Resultado:**
```
❌ BLOQUEADO!
Servidor recalcula: HMAC-SHA256(header.payload, SECRET)
Nova assinatura ≠ Assinatura antiga
Token rejeitado: "Assinatura inválida"
```

**Por quê?**
- HMAC-SHA256 é **unidirecional** (não dá para reverter)
- **Determinístico** (mesma entrada = mesma saída)
- **Sensível** (1 byte diferente = assinatura completamente diferente)
- Sem o `SECRET`, impossível gerar assinatura válida

---

### 2. Secret Forte e Bem Armazenado

```bash
# .env (NUNCA commitar!)
JWT_SECRET=e8b7c5d4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6
```

**Características:**
- 256-bit (64 caracteres hexadecimais)
- Aleatório (crypto.randomBytes)
- Armazenado em variável de ambiente
- Protegido por `.gitignore`

**Força:**
- 2^256 combinações possíveis
- Impossível adivinhar por força bruta
- Mesmo com supercomputador, levaria bilhões de anos

---

### 3. Expiração Curta Limita Janela de Ataque

```javascript
// Access Token: 30 minutos
JWT_EXPIRE=30m

// Refresh Token: 7 dias
JWT_REFRESH_EXPIRE=7d
```

**Cenário de ataque:**
```
Atacante rouba token → Token expira em 30min → Ataque limitado
```

**Estratégia:**
- Access token curto (30min) para requisições API
- Refresh token longo (7 dias) para renovar access token
- Se refresh token for roubado, pode ser revogado no banco

---

### 4. Stateless = Escalável

**Vantagens:**
- Servidor não armazena sessões em memória
- Pode escalar horizontalmente (múltiplos servidores)
- Não requer Redis/Memcached para sessões
- Validação rápida (apenas criptografia, sem DB query)

**Como funciona:**
```
Cliente → Token (self-contained) → Servidor A
                                 → Servidor B  ← Ambos validam independentemente
                                 → Servidor C
```

---

### 5. HttpOnly Cookies Previnem XSS

```javascript
res.cookie('accessToken', token, {
  httpOnly: true,       // JavaScript não pode acessar
  secure: true,         // Apenas HTTPS (produção)
  sameSite: 'strict',   // Previne CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 dias
});
```

**Proteção:**
```javascript
// ❌ Ataque XSS não funciona
<script>
  document.cookie; // Vazio! httpOnly bloqueia
  localStorage.getItem('token'); // Não usamos localStorage
</script>
```

---

### 6. Comparação Timing-Safe

```javascript
// Biblioteca jsonwebtoken usa comparação constant-time
// Previne timing attacks que tentam deduzir secret medindo tempo de resposta

// ❌ Comparação insegura (vulnerável a timing attack)
if (recalculatedSignature === receivedSignature) { ... }

// ✅ Comparação segura (constant-time)
crypto.timingSafeEqual(recalculatedSignature, receivedSignature)
```

---

## 📊 Comparação: Access vs Refresh Token

| Característica | Access Token | Refresh Token |
|---------------|--------------|---------------|
| **Tipo** | JWT (self-contained) | Random (opaco) |
| **Duração** | 30 minutos | 7 dias |
| **Armazenamento** | Nenhum (stateless) | Banco de dados |
| **Uso** | Toda requisição API | Renovar access token |
| **Revogação** | Não (espera expirar) | Sim (revoke no DB) |
| **Tamanho** | ~200 bytes | 80 chars |

---

## ⚠️ Erros Comuns

### Token Expirado

```json
{
  "success": false,
  "message": "Token expirado. Faça login novamente.",
  "code": "TOKEN_EXPIRED"
}
```

**Solução:** Use refresh token para renovar

---

### Token Adulterado

```json
{
  "success": false,
  "message": "Token inválido",
  "code": "TOKEN_INVALID"
}
```

**Causa:** Assinatura não confere (payload foi alterado)

---

### Permissões Insuficientes

```json
{
  "success": false,
  "message": "Você não tem permissão para acessar este recurso",
  "code": "FORBIDDEN"
}
```

**Causa:** Role do usuário não está na lista permitida

---

## 📚 Próximos Passos

- 📖 Documentação técnica completa: [SEGURANCA_JWT.md](SEGURANCA_JWT.md)
- 🧪 Exemplos práticos: [examples/jwtUsage.js](examples/jwtUsage.js)
- 🛡️ Rotas protegidas: [examples/protectedRoutes.js](examples/protectedRoutes.js)
- 🔄 Implementar refresh token (próximo passo)

---

## 🆘 Suporte

Se tiver dúvidas sobre JWT:
1. Leia [SEGURANCA_JWT.md](SEGURANCA_JWT.md) - explicação técnica detalhada
2. Rode `node examples/jwtUsage.js` - veja exemplos práticos
3. Rode `node examples/protectedRoutes.js` - demonstrações de uso
