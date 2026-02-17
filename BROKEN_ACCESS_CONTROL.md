# 🔐 BROKEN ACCESS CONTROL - OWASP A01 (2021)

## 📋 Índice

1. [O que é Broken Access Control](#o-que-é)
2. [Por que é o #1 da OWASP](#por-que-é-crítico)
3. [Vulnerabilidades Comuns](#vulnerabilidades-comuns)
4. [Como Implementamos Proteções](#nossas-proteções)
5. [Exemplos de Ataques vs Defesas](#exemplos-práticos)
6. [Testes de Segurança](#testes)
7. [Checklist de Implementação](#checklist)

---

## 🎯 O que é Broken Access Control

**Broken Access Control** ocorre quando usuários podem **acessar recursos ou executar ações que não deveriam ter permissão**.

### Exemplos Reais

```
❌ Usuário comum consegue deletar outros usuários
❌ Usuário A consegue ver dados privados do usuário B
❌ Usuário consegue escalar privilégios para admin
❌ Usuário consegue acessar área administrativa
❌ API não valida propriedade de recursos
```

---

## 🚨 Por que é o #1 da OWASP (2021)

**Estatísticas:**
- **94% das aplicações** testadas tinham alguma forma de broken access control
- **Subiu de #5 (2017) para #1 (2021)** na lista OWASP
- **318k ocorrências** encontradas em aplicações testadas
- **CVE (Common Vulnerabilities):** 34 CVEs mapeados

**Impacto:**
- Acesso não autorizado a dados sensíveis
- Modificação/deleção de dados de outros usuários
- Privilege escalation (virar admin)
- Vazamento de informações confidenciais

---

## ⚠️ Vulnerabilidades Comuns

### 1. Insecure Direct Object Reference (IDOR)

**Vulnerável:**
```javascript
// ❌ VULNERÁVEL: Aceita qualquer ID sem validar propriedade
app.get('/api/users/:id/profile', protect, async (req, res) => {
  const userId = req.params.id;
  
  // Problema: Usuário A (id=123) pode acessar perfil do usuário B (id=456)
  // GET /api/users/456/profile
  const user = await User.findById(userId);
  
  res.json({ user }); // Vaza dados do usuário B!
});
```

**Ataque:**
```bash
# Usuário logado como ID=123
# Token válido mas tenta acessar ID=456

curl http://localhost:3000/api/users/456/profile \
  -H "Authorization: Bearer <token_user_123>"

# ❌ Resposta: 200 OK com dados do usuário 456!
# Falha de autorização: não validou se o usuário pode acessar esse ID
```

**Seguro:**
```javascript
// ✅ SEGURO: Valida propriedade do recurso
app.get('/api/users/:id/profile', protect, async (req, res) => {
  const targetUserId = req.params.id;
  const currentUser = req.user; // Vem do middleware protect
  
  // Permitir apenas se for o próprio usuário OU admin
  const isOwner = currentUser.id === targetUserId;
  const isAdmin = currentUser.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Você só pode acessar seu próprio perfil',
      code: 'FORBIDDEN'
    });
  }
  
  const user = await User.findById(targetUserId);
  res.json({ user });
});
```

---

### 2. Privilege Escalation

**Vulnerável:**
```javascript
// ❌ VULNERÁVEL: Permite usuário mudar próprio role
app.put('/api/users/:id', protect, async (req, res) => {
  const userId = req.params.id;
  const updates = req.body; // { name, email, role }
  
  // Problema: Usuário pode enviar role="admin" e virar administrador!
  await User.update(userId, updates);
  
  res.json({ message: 'Perfil atualizado' });
});
```

**Ataque:**
```bash
# Usuário comum tenta escalar privilégios

curl -X PUT http://localhost:3000/api/users/123 \
  -H "Authorization: Bearer <token_user>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "role": "admin"  <-- Tentativa de privilege escalation!
  }'

# ❌ Se vulnerável: Responde 200 OK e usuário vira admin
```

**Seguro:**
```javascript
// ✅ SEGURO: Role só pode ser mudado por admin
app.put('/api/users/:id', protect, async (req, res) => {
  const targetUserId = req.params.id;
  const currentUser = req.user;
  const updates = req.body;
  
  // 1. Validar propriedade
  const isOwner = currentUser.id === targetUserId;
  const isAdmin = currentUser.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Você só pode editar seu próprio perfil'
    });
  }
  
  // 2. Prevenir mudança de role por não-admins
  if (updates.role && currentUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Apenas administradores podem alterar roles',
      code: 'PRIVILEGE_ESCALATION_ATTEMPT'
    });
  }
  
  // 3. Filtrar campos sensíveis se não for admin
  const allowedFields = isAdmin 
    ? ['name', 'email', 'role', 'is_active'] 
    : ['name', 'email'];
  
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  
  await User.update(targetUserId, filteredUpdates);
  res.json({ message: 'Perfil atualizado com sucesso' });
});
```

---

### 3. Missing Function Level Access Control

**Vulnerável:**
```javascript
// ❌ VULNERÁVEL: Endpoint admin sem verificação de role
app.delete('/api/admin/users/:id', protect, async (req, res) => {
  // Problema: Qualquer usuário autenticado pode deletar!
  // Faltou verificar se é admin
  
  await User.delete(req.params.id);
  res.json({ message: 'Usuário deletado' });
});
```

**Ataque:**
```bash
# Usuário comum tenta deletar outro usuário

curl -X DELETE http://localhost:3000/api/admin/users/456 \
  -H "Authorization: Bearer <token_user_comum>"

# ❌ Se vulnerável: 200 OK - Usuário deletado!
```

**Seguro:**
```javascript
// ✅ SEGURO: Usa middleware restrictTo
const { protect, restrictTo } = require('../middlewares/auth');

app.delete('/api/admin/users/:id', 
  protect,              // 1º: Valida JWT
  restrictTo('admin'),  // 2º: Valida role=admin
  async (req, res) => {
    // Só chega aqui se for admin
    await User.delete(req.params.id);
    res.json({ message: 'Usuário deletado' });
  }
);
```

---

### 4. Forced Browsing

**Vulnerável:**
```javascript
// ❌ VULNERÁVEL: Área admin acessível sem autenticação
app.get('/admin/dashboard', (req, res) => {
  // Problema: Não valida se usuário está autenticado e é admin
  res.render('admin-dashboard');
});
```

**Ataque:**
```bash
# Qualquer pessoa pode acessar
curl http://localhost:3000/admin/dashboard

# ❌ Se vulnerável: Retorna painel admin sem autenticação!
```

**Seguro:**
```javascript
// ✅ SEGURO: Protegido com protect + restrictTo
app.get('/admin/dashboard', 
  protect,              // Requer autenticação
  restrictTo('admin'),  // Requer role=admin
  (req, res) => {
    res.render('admin-dashboard');
  }
);
```

---

### 5. Path Traversal / Directory Traversal

**Vulnerável:**
```javascript
// ❌ VULNERÁVEL: Aceita qualquer caminho de arquivo
app.get('/api/files/:filename', protect, (req, res) => {
  const filename = req.params.filename;
  
  // Problema: Atacante pode usar ../../../etc/passwd
  const filePath = `/uploads/${filename}`;
  res.sendFile(filePath);
});
```

**Ataque:**
```bash
# Tenta acessar arquivo fora da pasta uploads
curl http://localhost:3000/api/files/../../../etc/passwd

# ❌ Se vulnerável: Retorna arquivo do sistema!
```

**Seguro:**
```javascript
// ✅ SEGURO: Valida e sanitiza caminho
const path = require('path');

app.get('/api/files/:filename', protect, (req, res) => {
  const filename = req.params.filename;
  
  // 1. Validar caracteres permitidos
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    return res.status(400).json({
      success: false,
      message: 'Nome de arquivo inválido'
    });
  }
  
  // 2. Resolver caminho absoluto
  const uploadsDir = path.resolve(__dirname, '../uploads');
  const filePath = path.resolve(uploadsDir, filename);
  
  // 3. Verificar se arquivo está dentro da pasta permitida
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado',
      code: 'PATH_TRAVERSAL_ATTEMPT'
    });
  }
  
  // 4. Verificar propriedade do arquivo (exemplo)
  const fileOwner = await getFileOwner(filename);
  if (fileOwner !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Você não tem permissão para acessar este arquivo'
    });
  }
  
  res.sendFile(filePath);
});
```

---

## 🛡️ Nossas Proteções Implementadas

### 1. Autenticação JWT Stateless

```javascript
// src/middlewares/auth.js - middleware protect

const protect = async (req, res, next) => {
  // 1. Extrai token (header ou cookie)
  // 2. Verifica assinatura HMAC-SHA256
  // 3. Verifica expiração
  // 4. Busca usuário no banco
  // 5. Anexa req.user = { id, name, email, role }
  
  req.user = user; // Usuário autenticado com role
  next();
};
```

**Proteção:**
- ✅ Valida identidade do usuário
- ✅ Role vem do banco de dados (não do client)
- ✅ Token assinado previne adulteração de role
- ✅ Middleware reutilizável em todas as rotas

---

### 2. Controle de Acesso Baseado em Roles (RBAC)

```javascript
// src/middlewares/auth.js - middleware restrictTo

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Verifica se req.user.role está na lista permitida
    if (!roles.includes(req.user.role)) {
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
// Apenas admin
router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);

// Admin OU moderator
router.put('/posts/:id', protect, restrictTo('admin', 'moderator'), editPost);
```

**Proteção:**
- ✅ Valida role antes de executar ação
- ✅ Previne privilege escalation
- ✅ Logs de tentativas de acesso negadas
- ✅ Resposta clara sobre permissões necessárias

---

### 3. Validação de Propriedade de Recursos

```javascript
// Validar se usuário é dono do recurso OU admin

const canAccessResource = (currentUser, resourceOwnerId) => {
  const isOwner = currentUser.id === resourceOwnerId;
  const isAdmin = currentUser.role === 'admin';
  return isOwner || isAdmin;
};

// Uso em controller
const getProfile = async (req, res) => {
  const targetUserId = req.params.id;
  
  if (!canAccessResource(req.user, targetUserId)) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado',
      code: 'FORBIDDEN'
    });
  }
  
  // Buscar e retornar perfil...
};
```

**Proteção:**
- ✅ Previne IDOR (Insecure Direct Object Reference)
- ✅ Valida propriedade antes de qualquer operação
- ✅ Admin tem acesso total (auditoria)
- ✅ Usuário só acessa próprios recursos

---

### 4. Whitelist de Campos Atualizáveis

```javascript
// Prevenir privilege escalation via mass assignment

const updateUser = async (req, res) => {
  const updates = req.body;
  
  // Campos permitidos dependem do role
  const allowedFields = req.user.role === 'admin'
    ? ['name', 'email', 'role', 'is_active']  // Admin pode tudo
    : ['name', 'email'];                       // User só básico
  
  // Filtrar apenas campos permitidos
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  
  // Log de tentativa suspeita
  const suspiciousFields = Object.keys(updates)
    .filter(field => !allowedFields.includes(field));
  
  if (suspiciousFields.length > 0) {
    logger.warn(`Tentativa de atualizar campos não permitidos: ${suspiciousFields.join(', ')} por ${req.user.email}`);
  }
  
  await User.update(req.user.id, filteredUpdates);
  res.json({ message: 'Atualizado com sucesso' });
};
```

**Proteção:**
- ✅ Previne mass assignment
- ✅ Role só pode ser mudado por admin
- ✅ Logging de tentativas suspeitas
- ✅ Whitelist (não blacklist) de campos

---

### 5. Role Armazenado no Banco (não no Token)

**❌ INSEGURO: Role apenas no token JWT**
```javascript
// Problema: Role só existe no token, pode ficar desatualizado
const token = jwt.sign({ userId: 123, role: 'user' }, secret);

// Se admin rebaixar usuário, token antigo ainda tem role='admin'!
```

**✅ SEGURO: Role sempre do banco**
```javascript
// src/middlewares/auth.js

const protect = async (req, res, next) => {
  const decoded = jwt.verify(token, secret);
  
  // Busca usuário no banco (role atualizado)
  const user = await User.findById(decoded.userId);
  
  req.user = user; // Role sempre atualizado!
  next();
};
```

**Proteção:**
- ✅ Role sempre atualizado (fonte da verdade: banco)
- ✅ Admin pode rebaixar usuário imediatamente
- ✅ Token expirado força relogin (novo role)
- ✅ Previne bypass usando token antigo

---

### 6. Logging de Tentativas de Acesso

```javascript
// src/middlewares/auth.js - restrictTo

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // ✅ Log de tentativa de acesso negada
      logger.warn(`ACESSO NEGADO: ${req.user.email} (${req.user.role}) tentou acessar ${req.originalUrl} (requer ${roles.join('/')})`);
      
      return res.status(403).json({
        success: false,
        message: 'Permissões insuficientes'
      });
    }
    
    // ✅ Log de acesso autorizado (auditoria)
    logger.info(`ACESSO AUTORIZADO: ${req.user.email} (${req.user.role}) acessou ${req.originalUrl}`);
    
    next();
  };
};
```

**Proteção:**
- ✅ Rastreabilidade (quem acessou o quê)
- ✅ Detecção de ataques (múltiplas tentativas negadas)
- ✅ Auditoria de compliance
- ✅ Forense em caso de incidente

---

## 🧪 Exemplos Práticos de Rotas

### Rota Pública (sem proteção)

```javascript
// Qualquer pessoa pode acessar
router.get('/api/info', (req, res) => {
  res.json({ message: 'Informações públicas' });
});
```

**Teste:**
```bash
curl http://localhost:3000/api/info
# ✅ 200 OK - Acesso livre
```

---

### Rota Protegida (apenas autenticados)

```javascript
// Requer token válido
router.get('/api/users/me', protect, (req, res) => {
  res.json({ user: req.user });
});
```

**Teste sem token:**
```bash
curl http://localhost:3000/api/users/me
# ❌ 401 Unauthorized - Token não fornecido
```

**Teste com token:**
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"
# ✅ 200 OK - Retorna dados do usuário
```

---

### Rota Restrita (apenas admin)

```javascript
// Requer autenticação + role=admin
router.get('/api/admin/users', 
  protect, 
  restrictTo('admin'), 
  getAllUsers
);
```

**Teste com usuário comum:**
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <token_user>"
# ❌ 403 Forbidden - Permissões insuficientes
```

**Teste com admin:**
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <token_admin>"
# ✅ 200 OK - Lista de usuários
```

---

### Validação de Propriedade (IDOR Protection)

```javascript
// Usuário só pode editar próprio perfil (ou admin pode editar qualquer)
router.put('/api/users/:id', protect, async (req, res) => {
  const targetId = req.params.id;
  const currentUser = req.user;
  
  // Validar propriedade
  if (currentUser.id !== targetId && currentUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Você só pode editar seu próprio perfil',
      code: 'IDOR_PROTECTION'
    });
  }
  
  // Atualizar...
});
```

**Teste - Usuário A tenta editar usuário B:**
```bash
# Usuário logado: ID=123
# Tenta editar: ID=456

curl -X PUT http://localhost:3000/api/users/456 \
  -H "Authorization: Bearer <token_user_123>" \
  -d '{"name":"Hacker"}'

# ❌ 403 Forbidden - IDOR bloqueado
```

**Teste - Usuário edita próprio perfil:**
```bash
curl -X PUT http://localhost:3000/api/users/123 \
  -H "Authorization: Bearer <token_user_123>" \
  -d '{"name":"João Silva"}'

# ✅ 200 OK - Próprio perfil pode editar
```

---

### Privilege Escalation Protection

```javascript
router.put('/api/users/:id', protect, async (req, res) => {
  const updates = req.body;
  
  // Prevenir mudança de role por não-admin
  if (updates.role && req.user.role !== 'admin') {
    logger.warn(`PRIVILEGE ESCALATION ATTEMPT: ${req.user.email} tentou mudar role`);
    
    return res.status(403).json({
      success: false,
      message: 'Apenas administradores podem alterar roles',
      code: 'PRIVILEGE_ESCALATION_ATTEMPT'
    });
  }
  
  // Continuar...
});
```

**Teste - Usuário tenta virar admin:**
```bash
curl -X PUT http://localhost:3000/api/users/123 \
  -H "Authorization: Bearer <token_user>" \
  -d '{"role":"admin"}'

# ❌ 403 Forbidden - Privilege escalation bloqueado
# LOG: "PRIVILEGE ESCALATION ATTEMPT: user@example.com tentou mudar role"
```

---

## 🔍 Testes de Segurança

### Teste 1: IDOR (Insecure Direct Object Reference)

```javascript
// tests/idor.test.js

describe('IDOR Protection', () => {
  it('❌ Deve bloquear acesso ao perfil de outro usuário', async () => {
    // Login como usuário A
    const userA = await login('userA@example.com', 'password');
    
    // Tentar acessar perfil do usuário B
    const response = await request(app)
      .get('/api/users/userB_id/profile')
      .set('Authorization', `Bearer ${userA.token}`);
    
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });
  
  it('✅ Deve permitir acesso ao próprio perfil', async () => {
    const user = await login('user@example.com', 'password');
    
    const response = await request(app)
      .get(`/api/users/${user.id}/profile`)
      .set('Authorization', `Bearer ${user.token}`);
    
    expect(response.status).toBe(200);
  });
  
  it('✅ Admin deve acessar qualquer perfil', async () => {
    const admin = await login('admin@example.com', 'password');
    
    const response = await request(app)
      .get('/api/users/any_user_id/profile')
      .set('Authorization', `Bearer ${admin.token}`);
    
    expect(response.status).toBe(200);
  });
});
```

---

### Teste 2: Privilege Escalation

```javascript
describe('Privilege Escalation Protection', () => {
  it('❌ Usuário não pode mudar próprio role para admin', async () => {
    const user = await login('user@example.com', 'password');
    
    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ role: 'admin' });
    
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('PRIVILEGE_ESCALATION_ATTEMPT');
  });
  
  it('✅ Admin pode mudar role de outros usuários', async () => {
    const admin = await login('admin@example.com', 'password');
    
    const response = await request(app)
      .put('/api/users/target_user_id')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'admin' });
    
    expect(response.status).toBe(200);
  });
});
```

---

### Teste 3: Missing Function Level Access Control

```javascript
describe('Function Level Access Control', () => {
  it('❌ Usuário comum não pode deletar usuários', async () => {
    const user = await login('user@example.com', 'password');
    
    const response = await request(app)
      .delete('/api/admin/users/123')
      .set('Authorization', `Bearer ${user.token}`);
    
    expect(response.status).toBe(403);
  });
  
  it('✅ Admin pode deletar usuários', async () => {
    const admin = await login('admin@example.com', 'password');
    
    const response = await request(app)
      .delete('/api/admin/users/123')
      .set('Authorization', `Bearer ${admin.token}`);
    
    expect(response.status).toBe(200);
  });
});
```

---

## ✅ Checklist de Implementação

### Autenticação
- [x] JWT com assinatura HMAC-SHA256
- [x] Middleware `protect` valida token
- [x] Role vem do banco (não só do token)
- [x] Token expira em 30 minutos
- [x] Refresh token para renovação

### Autorização
- [x] Middleware `restrictTo` valida role
- [x] Validação de propriedade de recursos
- [x] Whitelist de campos atualizáveis
- [x] Previne privilege escalation
- [x] Logging de tentativas de acesso

### Proteções IDOR
- [x] Validar se usuário é dono do recurso
- [x] Admin sempre tem acesso (auditoria)
- [x] IDs não sequenciais (UUID)
- [x] Respostas genéricas (não vaza existência)

### Segurança Adicional
- [x] Rate limiting (previne enumeração)
- [x] Logging de acessos (auditoria)
- [x] Mensagens de erro genéricas
- [x] Validação de input (Joi)
- [x] Prepared statements (SQL injection)

---

## 📚 Recursos Adicionais

- **OWASP:** https://owasp.org/Top10/A01_2021-Broken_Access_Control/
- **CWE-285:** Improper Authorization
- **CWE-639:** Authorization Bypass Through User-Controlled Key
- **Documentação JWT:** [SEGURANCA_JWT.md](SEGURANCA_JWT.md)
- **Exemplos práticos:** [examples/accessControlExamples.js](examples/accessControlExamples.js)

---

## 🎯 Resumo de 1 Minuto

**Broken Access Control = #1 OWASP 2021**

**Vulnerabilidades comuns:**
1. IDOR - Acessar recursos de outros usuários
2. Privilege Escalation - Virar admin
3. Missing Function Level - Endpoints admin sem validação
4. Forced Browsing - Áreas restritas acessíveis

**Nossas proteções:**
1. ✅ JWT com role assinado
2. ✅ Middleware `protect` + `restrictTo`
3. ✅ Validação de propriedade
4. ✅ Whitelist de campos
5. ✅ Logging de acessos
6. ✅ Role sempre do banco

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

**Testes:** [examples/accessControlTests.js](examples/accessControlTests.js)
