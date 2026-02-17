# 👤 Modelo User (PostgreSQL) - Documentação

## ✅ Visão Geral

Modelo completo de usuário para PostgreSQL com **todas as funcionalidades de segurança** implementadas.

---

## 📂 Arquivo

**`src/models/User.js`**

---

## 🔧 Funcionalidades Implementadas

### ✅ Criar Usuário
```javascript
const user = await User.create({
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'SenhaForte123!@#',
  role: 'user'
});
```

**Segurança:**
- ✅ Hash automático de senha (bcrypt 12 rounds)
- ✅ Email normalizado (lowercase + trim)
- ✅ Prepared statement ($1, $2) previne SQL Injection  
- ✅ Verifica duplicação de email
- ✅ **NUNCA retorna a senha**

---

### ✅ Login / Validar Credenciais
```javascript
const user = await User.validateCredentials(email, password);
```

**Segurança:**
- ✅ Mensagens genéricas ("Credenciais inválidas")
- ✅ Verifica se conta está ativa
- ✅ Verifica bloqueio de conta
- ✅ bcrypt.compare() resistente a timing attacks
- ✅ Incrementa tentativas falhas
- ✅ Bloqueia após X tentativas (configurável)
- ✅ Reseta tentativas em login bem-sucedido

---

### ✅ Buscar Usuários
```javascript
// Por ID
const user = await User.findById(userId);

// Por email (SEM senha)
const user = await User.findByEmail('user@example.com');

// Por email COM senha (APENAS para autenticação)
const user = await User.findByEmailWithPassword('user@example.com');
```

**Segurança:**
- ✅ Queries padrão **NÃO retornam senha**
- ✅ `findByEmailWithPassword` retorna senha **APENAS para validação**
- ✅ Prepared statements em todas as queries

---

### ✅ Comparar Senha
```javascript
const isValid = await User.comparePassword(senhaFornecida, hashArmazenado);
```

**Segurança:**
- ✅ Usa bcrypt.compare()
- ✅ Tempo constante (previne timing attacks)

---

### ✅ Atualizar Dados
```javascript
// Dados básicos
await User.update(userId, {
  name: 'Novo Nome',
  email: 'novoemail@example.com'
});

// Senha
await User.updatePassword(userId, 'NovaSenha123!');
```

**Segurança:**
- ✅ Apenas campos permitidos podem ser atualizados
- ✅ Nova senha é hasheada automaticamente
- ✅ `password_changed_at` atualizado (invalida tokens antigos)

---

### ✅ Gerenciamento de Tentativas de Login
```javascript
// Incrementar (automático em validateCredentials)
await User.incrementLoginAttempts(userId);

// Resetar (automático em login bem-sucedido)
await User.resetLoginAttempts(userId);
```

**Proteção contra Brute Force:**
- ✅ Contador de tentativas
- ✅ Bloqueio automático após X tentativas
- ✅ Tempo de bloqueio configurável
- ✅ Reset automático em login OK

---

### ✅ Listagem e Paginação
```javascript
const resultado = await User.findAll({
  page: 1,
  perPage: 10,
  role: 'user',
  isActive: true,
  orderBy: 'created_at',
  order: 'DESC'
});

console.log(resultado.data); // Array de usuários
console.log(resultado.pagination); // { page, perPage, total, totalPages }
```

**Segurança:**
- ✅ **NÃO retorna senhas**
- ✅ Prepared statements em filtros

---

### ✅ Soft Delete
```javascript
// Desativar
await User.deactivate(userId);

// Reativar
await User.reactivate(userId);
```

**Vantagens:**
- ✅ Não perde dados
- ✅ Pode reativar depois
- ✅ Impede login quando desativado

---

### ✅ Utilitários
```javascript
// Verificar se email existe
const existe = await User.emailExists('email@example.com');

// Estatísticas
const stats = await User.countByRole();
// [{ role: 'user', total: '150' }, { role: 'admin', total: '5' }]
```

---

## 🔒 Recursos de Segurança

### 1. Prepared Statements (SQL Injection)

**✅ CORRETO:**
```javascript
query('SELECT * FROM users WHERE id = $1', [userId]);
```

**❌ ERRADO:**
```javascript
query(`SELECT * FROM users WHERE id = ${userId}`); // VULNERÁVEL!
```

**Todas as funções do modelo usam prepared statements.**

---

### 2. Bcrypt para Senhas

```javascript
// Hash (criação/atualização)
const hash = await bcrypt.hash(password, 12); // 12 rounds

// Comparação (login)
const isValid = await bcrypt.compare(candidatePassword, hash);
```

**Por que bcrypt?**
- ✅ Hash unidirecional (não pode reverter)
- ✅ Salt automático único para cada senha
- ✅ Custo computacional configurável
- ✅ Resistente a timing attacks

---

### 3. Proteção contra Brute Force

```javascript
// Configurável em src/config/security.js
loginRateLimit: {
  maxAttempts: 5,           // Máx tentativas
  blockDuration: 900000,    // 15 minutos em ms
}
```

**Funcionamento:**
1. Tentativa falha → incrementa contador
2. 5 tentativas → bloqueia por 15 min
3. Login OK → reseta contador

---

### 4. Mensagens Genéricas

**❌ ERRADO (revela informação):**
```
"Email não encontrado"
"Senha incorreta"
```

**✅ CORRETO (genérico):**
```
"Credenciais inválidas"
```

**Implementado em `validateCredentials()`**

---

### 5. Senha Nunca Retornada

```javascript
// ✅ Queries normais NÃO retornam password
const user = await User.findByEmail(email);
console.log(user.password); // undefined

// ⚠️ Apenas esta função retorna (para autenticação)
const userWithPassword = await User.findByEmailWithPassword(email);
console.log(userWithPassword.password); // hash bcrypt
```

---

### 6. Email Normalizado

```javascript
// Automaticamente:
'USER@EXAMPLE.COM' → 'user@example.com'
'  user@example.com  ' → 'user@example.com'
```

**Previne:**
- Duplicatas por case sensitivity
- Espaços acidentais

---

### 7. Password Changed At

```javascript
// Atualizado automaticamente em updatePassword()
password_changed_at: '2026-02-17 10:30:00'
```

**Uso:**
- Invalidar tokens JWT antigos
- Forçar re-login após mudança de senha
- Auditoria de segurança

---

## 📋 Tabela: users (PostgreSQL)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    
    email_verification_token VARCHAR(255),
    email_verification_expire TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expire TIMESTAMP,
    
    login_attempts INTEGER DEFAULT 0,
    lock_until TIMESTAMP,
    password_changed_at TIMESTAMP,
    last_login TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 💡 Exemplos de Uso

### Registro de Usuário
```javascript
const User = require('./models/User');

const novoUsuario = await User.create({
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'SenhaForte123!@#'
});

console.log(novoUsuario);
// { id, name, email, role, is_active, created_at }
// Senha NÃO é retornada!
```

---

### Login
```javascript
try {
  const usuario = await User.validateCredentials(
    'joao@example.com',
    'SenhaForte123!@#'
  );
  
  console.log('Login OK:', usuario);
  // Gerar tokens JWT aqui
  
} catch (error) {
  console.error(error.message);
  // "Credenciais inválidas" ou
  // "Conta bloqueada. Tente novamente em X minutos"
}
```

---

### Verificar Email Duplicado
```javascript
const existe = await User.emailExists('joao@example.com');

if (existe) {
  return res.status(409).json({
    success: false,
    message: 'Email já cadastrado'
  });
}
```

---

### Atualizar Senha
```javascript
await User.updatePassword(userId, 'NovaSenha123!');
// Senha hasheada automaticamente
// password_changed_at atualizado
```

---

### Buscar com Paginação
```javascript
const resultado = await User.findAll({
  page: 2,
  perPage: 20,
  role: 'user',
  isActive: true
});

resultado.data.forEach(user => {
  console.log(user.name, user.email);
});
```

---

## 🔗 Integração com authService

```javascript
// src/services/authService.js
const User = require('../models/User');

const registerUser = async ({ name, email, password }) => {
  // User.create já hasheia senha e verifica duplicatas
  const user = await User.create({ name, email, password });
  
  // Gerar tokens
  const accessToken = tokenService.generateAccessToken(user.id);
  const refreshToken = await tokenService.generateRefreshToken(user.id);
  
  return { user, accessToken, refreshToken };
};

const loginUser = async ({ email, password, ipAddress }) => {
  // validateCredentials já verifica tudo
  const user = await User.validateCredentials(email, password);
  
  // Gerar tokens
  const accessToken = tokenService.generateAccessToken(user.id);
  const refreshToken = await tokenService.generateRefreshToken(user.id, ipAddress);
  
  return { user, accessToken, refreshToken };
};
```

---

## 📊 Funções Disponíveis

| Função | Descrição | Retorna Senha? |
|--------|-----------|----------------|
| `create()` | Criar usuário | ❌ Não |
| `findById()` | Buscar por ID | ❌ Não |
| `findByEmail()` | Buscar por email | ❌ Não |
| `findByEmailWithPassword()` | Buscar com senha | ✅ Sim (apenas para auth) |
| `validateCredentials()` | Login completo | ❌ Não |
| `comparePassword()` | Comparar senha | N/A |
| `update()` | Atualizar dados | ❌ Não |
| `updatePassword()` | Atualizar senha | N/A |
| `incrementLoginAttempts()` | Incrementar tentativas | N/A |
| `resetLoginAttempts()` | Resetar tentativas | N/A |
| `findAll()` | Listar com paginação | ❌ Não |
| `deactivate()` | Desativar (soft delete) | N/A |
| `reactivate()` | Reativar | N/A |
| `emailExists()` | Verificar duplicata | N/A |
| `countByRole()` | Estatísticas | N/A |

---

## ⚠️ Importante

### ❌ NUNCA Faça Isso
```javascript
// NÃO concatene strings em SQL
query(`SELECT * FROM users WHERE email = '${email}'`); // SQL INJECTION!

// NÃO retorne senha para cliente
res.json({ user: userWithPassword }); // EXPÕE SENHA!

// NÃO use senhas em plaintext
user.password = 'senha123'; // SEM HASH!
```

### ✅ SEMPRE Faça Isso
```javascript
// USE prepared statements
query('SELECT * FROM users WHERE email = $1', [email]);

// REMOVA senha antes de retornar
const { password, ...userSafe } = user;
res.json({ user: userSafe });

// USE bcrypt para senhas
const hash = await bcrypt.hash(password, 12);
```

---

## 📚 Mais Informações

- 📗 **Exemplos completos:** [examples/userModelUsage.js](examples/userModelUsage.js)
- 📘 **Integração:** [src/services/authService.js](src/services/authService.js)
- 📙 **Configuração:** [src/config/security.js](src/config/security.js)
- 📕 **Schema SQL:** [database/schema.sql](database/schema.sql)

---

## ✅ Checklist de Segurança

- [x] Prepared statements em todas as queries
- [x] Bcrypt para hash de senhas (12 rounds)
- [x] Senha nunca retornada em queries normais
- [x] Email normalizado (lowercase + trim)
- [x] Mensagens genéricas de erro
- [x] Proteção contra brute force
- [x] Bloqueio de conta após X tentativas
- [x] Timing attack protection (bcrypt.compare)
- [x] Password changed at tracking
- [x] Soft delete (is_active)
- [x] Validação de duplicatas
- [x] Prepared statements dinâmicos seguros

---

🎉 **Modelo User completo e pronto para produção com todas as melhores práticas de segurança!**
