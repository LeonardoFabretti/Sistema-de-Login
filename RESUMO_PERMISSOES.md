# 🎯 RESUMO: CONTROLE DE PERMISSÕES

## ✅ Implementação Completa

O sistema de controle de permissões está **100% implementado** com proteções contra Broken Access Control (OWASP A01 - #1 em 2021).

---

## 📁 Arquivos Criados/Atualizados

| Arquivo | Descrição |
|---------|-----------|
| [src/middlewares/auth.js](src/middlewares/auth.js) | Middleware `restrictTo()` para validação de roles |
| [src/routes/user.js](src/routes/user.js) | Rotas protegidas com IDOR, privilege escalation e mass assignment protection |
| [BROKEN_ACCESS_CONTROL.md](BROKEN_ACCESS_CONTROL.md) | Documentação completa (1000+ linhas) sobre vulnerabilidades e proteções |
| [examples/accessControlExamples.js](examples/accessControlExamples.js) | 10 exemplos práticos de controle de acesso |
| [examples/testAccessControl.js](examples/testAccessControl.js) | Testes automatizados de segurança |

---

## 🚀 Como Usar (3 níveis)

### 1️⃣ Rota Pública (sem proteção)
```javascript
router.get('/api/info', (req, res) => {
  res.json({ message: 'Público' });
});
```

### 2️⃣ Rota Protegida (apenas autenticados)
```javascript
const { protect } = require('../middlewares/auth');

router.get('/api/users/me', protect, (req, res) => {
  // req.user disponível (vem do JWT)
  res.json({ user: req.user });
});
```

### 3️⃣ Rota Restrita (role específico)
```javascript
const { protect, restrictTo } = require('../middlewares/auth');

// Apenas admin
router.delete('/api/users/:id', 
  protect, 
  restrictTo('admin'), 
  deleteUser
);

// Admin OU moderator
router.put('/api/posts/:id', 
  protect, 
  restrictTo('admin', 'moderator'), 
  editPost
);
```

---

## 🛡️ Proteções Implementadas

### 1. Autenticação JWT (middleware `protect`)

**Localização:** [src/middlewares/auth.js](src/middlewares/auth.js#L47-L150)

**O que faz:**
1. Extrai token (Authorization header OU cookie)
2. Verifica assinatura HMAC-SHA256
3. Verifica expiração
4. Busca usuário no banco
5. Verifica se conta está ativa
6. Verifica se senha foi alterada
7. Anexa `req.user = { id, name, email, role }`

**Código:**
```javascript
const protect = async (req, res, next) => {
  const token = extractToken(req);
  const decoded = jwt.verify(token, SECRET);
  const user = await User.findById(decoded.userId);
  req.user = user; // Role vem do banco!
  next();
};
```

---

### 2. Autorização por Role (middleware `restrictTo`)

**Localização:** [src/middlewares/auth.js](src/middlewares/auth.js#L197-L235)

**O que faz:**
- Valida se `req.user.role` está na lista de roles permitidos
- Retorna 403 Forbidden se não autorizado
- Loga tentativas de acesso negadas

**Código:**
```javascript
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Acesso negado: ${req.user.email} tentou acessar recurso restrito`);
      return res.status(403).json({
        success: false,
        message: 'Permissões insuficientes',
        requiredRoles: roles,
        yourRole: req.user.role
      });
    }
    next();
  };
};
```

**Uso:**
```javascript
router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);
```

---

### 3. IDOR Protection (validação de propriedade)

**Localização:** [src/routes/user.js](src/routes/user.js#L68-L135)

**O que é IDOR:**
- **I**nsecure **D**irect **O**bject **R**eference
- Usuário A acessa dados do usuário B mudando ID na URL
- `GET /api/users/456` (logado como user 123)

**Proteção:**
```javascript
router.get('/api/users/:id', protect, async (req, res) => {
  const targetId = req.params.id;
  const currentUser = req.user;
  
  // ✅ Validar propriedade
  const isOwner = currentUser.id === targetId;
  const isAdmin = currentUser.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    logger.warn(`IDOR ATTEMPT: ${currentUser.email} tentou acessar perfil ${targetId}`);
    return res.status(403).json({
      success: false,
      message: 'Você só pode acessar seu próprio perfil',
      code: 'IDOR_PROTECTION'
    });
  }
  
  // Buscar e retornar dados...
});
```

---

### 4. Privilege Escalation Protection

**Localização:** [src/routes/user.js](src/routes/user.js#L154-L240)

**O que é:**
- Usuário comum tenta virar admin
- `PUT /api/users/123 { role: "admin" }`

**Proteção:**
```javascript
router.put('/api/users/:id', protect, async (req, res) => {
  const updates = req.body;
  
  // ✅ Apenas admin pode mudar role
  if (updates.role && req.user.role !== 'admin') {
    logger.warn(`PRIVILEGE ESCALATION ATTEMPT: ${req.user.email} tentou mudar role`);
    
    return res.status(403).json({
      success: false,
      message: 'Apenas administradores podem alterar roles',
      code: 'PRIVILEGE_ESCALATION_ATTEMPT'
    });
  }
  
  // Continuar atualização...
});
```

---

### 5. Mass Assignment Protection

**Localização:** [src/routes/user.js](src/routes/user.js#L176-L191)

**O que é:**
- Atacante tenta atualizar campos sensíveis
- `PUT /api/users/123 { is_active: true, role: "admin", is_email_verified: true }`

**Proteção:**
```javascript
// ✅ Whitelist de campos permitidos por role
const allowedFields = req.user.role === 'admin'
  ? ['name', 'email', 'role', 'is_active', 'is_email_verified']
  : ['name', 'email']; // User só pode atualizar básico

// Filtrar apenas campos permitidos
const filteredUpdates = {};
for (const field of allowedFields) {
  if (updates[field] !== undefined) {
    filteredUpdates[field] = updates[field];
  }
}

// Detectar tentativas suspeitas
const suspiciousFields = Object.keys(updates)
  .filter(field => !allowedFields.includes(field));

if (suspiciousFields.length > 0) {
  logger.warn(`SUSPICIOUS UPDATE: ${req.user.email} tentou atualizar campos não permitidos: ${suspiciousFields.join(', ')}`);
}

// Atualizar apenas campos filtrados
await User.update(userId, filteredUpdates);
```

---

### 6. Auditoria de Ações Sensíveis

**Localização:** [src/routes/user.js](src/routes/user.js#L308-L385)

**O que é:**
- Log de todas as ações administrativas
- Rastreabilidade (quem fez o quê e quando)

**Proteção:**
```javascript
router.delete('/api/users/:id', protect, restrictTo('admin'), async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  
  // Deletar/desativar usuário...
  
  // ✅ LOG DE AUDITORIA
  logger.warn(`AUDIT: Admin ${req.user.email} desativou usuário ${targetUser.email} (ID: ${req.params.id})`);
  
  res.json({
    success: true,
    deletedBy: { email: req.user.email },
    timestamp: new Date().toISOString()
  });
});
```

---

### 7. Role Sempre do Banco

**Por que importante:**
- Role no JWT pode ficar desatualizado
- Admin rebaixa usuário, mas token antigo ainda tem role='admin'

**Solução:**
```javascript
// ❌ INSEGURO: Role apenas do token
const decoded = jwt.verify(token, SECRET);
req.user = decoded; // { userId, role: 'admin' }

// ✅ SEGURO: Role sempre do banco
const decoded = jwt.verify(token, SECRET);
const user = await User.findById(decoded.userId); // Busca no banco
req.user = user; // Role atualizado!
```

---

## 📊 Matriz de Permissões

| Ação | Usuário Comum | Admin | Implementação |
|------|--------------|-------|---------------|
| **Ver próprio perfil** | ✅ Sim | ✅ Sim | `protect` |
| **Ver perfil de outro** | ❌ Não | ✅ Sim (auditoria) | `isOwner \|\| isAdmin` |
| **Editar próprio perfil** | ✅ Sim (name, email) | ✅ Sim (todos campos) | Whitelist por role |
| **Editar perfil de outro** | ❌ Não | ✅ Sim | `isOwner \|\| isAdmin` |
| **Mudar próprio role** | ❌ Não | ❌ Não | `updates.role && role !== 'admin'` |
| **Mudar role de outro** | ❌ Não | ✅ Sim | `restrictTo('admin')` |
| **Listar todos os usuários** | ❌ Não | ✅ Sim | `restrictTo('admin')` |
| **Deletar usuário** | ❌ Não | ✅ Sim (exceto si mesmo) | `restrictTo('admin')` |

---

## 🧪 Testar na Prática

### 1. Login como usuário comum
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SenhaForte123!"}'
```

### 2. Tentar acessar endpoint admin
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <token_user>"

# ❌ 403 Forbidden - Permissões insuficientes
# {
#   "success": false,
#   "message": "Você não tem permissão para acessar este recurso",
#   "requiredRoles": ["admin"],
#   "yourRole": "user"
# }
```

### 3. Tentar acessar perfil de outro usuário (IDOR)
```bash
curl http://localhost:3000/api/users/outro_usuario_id \
  -H "Authorization: Bearer <token_user>"

# ❌ 403 Forbidden - IDOR bloqueado
# {
#   "success": false,
#   "message": "Você só pode acessar seu próprio perfil",
#   "code": "IDOR_PROTECTION"
# }
```

### 4. Tentar virar admin (Privilege Escalation)
```bash
curl -X PUT http://localhost:3000/api/users/seu_id \
  -H "Authorization: Bearer <token_user>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'

# ❌ 403 Forbidden - Privilege escalation bloqueado
# {
#   "success": false,
#   "message": "Apenas administradores podem alterar roles",
#   "code": "PRIVILEGE_ESCALATION_ATTEMPT"
# }
```

---

## ⚠️ Vulnerabilidades Prevenidas

### ❌ IDOR (Insecure Direct Object Reference)
**Ataque:** Usuário A acessa dados do usuário B mudando ID na URL  
**Proteção:** Validar `req.user.id === targetId || req.user.role === 'admin'`

### ❌ Privilege Escalation
**Ataque:** Usuário comum muda próprio role para admin  
**Proteção:** Apenas admin pode alterar roles + whitelist de campos

### ❌ Missing Function Level Access Control
**Ataque:** Usuário comum acessa endpoint admin  
**Proteção:** Middleware `restrictTo('admin')` em rotas sensíveis

### ❌ Forced Browsing
**Ataque:** Acessar área restrita sem autenticação  
**Proteção:** Middleware `protect` em todas as rotas não-públicas

### ❌ Mass Assignment
**Ataque:** Atualizar campos sensíveis via req.body  
**Proteção:** Whitelist de campos permitidos por role

---

## 📚 Documentação Completa

- 📖 **[BROKEN_ACCESS_CONTROL.md](BROKEN_ACCESS_CONTROL.md)** - Explicação detalhada de vulnerabilidades e proteções
- 💡 **[examples/accessControlExamples.js](examples/accessControlExamples.js)** - 10 exemplos práticos
- 🧪 **[examples/testAccessControl.js](examples/testAccessControl.js)** - Testes automatizados
- 🛡️ **[src/routes/user.js](src/routes/user.js)** - Rotas com proteções completas

---

## ✅ Checklist de Implementação

- [x] Middleware `protect` implementado (autenticação JWT)
- [x] Middleware `restrictTo` implementado (autorização por role)
- [x] IDOR protection em rotas de recursos
- [x] Privilege escalation protection (role só mudado por admin)
- [x] Mass assignment protection (whitelist de campos)
- [x] Auditoria de ações sensíveis (logging)
- [x] Role sempre do banco (não só do token)
- [x] Documentação completa criada
- [x] Exemplos práticos criados
- [x] Testes de segurança implementados

---

## 💡 Resumo de 1 Minuto

✅ **Controle de permissões implementado!**

**3 níveis de proteção:**
1. **Pública** - Sem autenticação
2. **Protegida** - `protect` (qualquer autenticado)
3. **Restrita** - `protect + restrictTo('admin')` (role específico)

**Como usar:**
```javascript
// Apenas autenticados
router.get('/profile', protect, getProfile);

// Apenas admin
router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);

// Validar propriedade
if (req.user.id !== targetId && req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Acesso negado' });
}
```

**Proteções:**
- ✅ IDOR bloqueado
- ✅ Privilege escalation bloqueado
- ✅ Mass assignment bloqueado
- ✅ Function level access validado
- ✅ Auditoria implementada

**Testar:** `node examples/testAccessControl.js`
