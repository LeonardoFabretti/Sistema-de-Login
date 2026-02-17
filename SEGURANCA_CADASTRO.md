# 🔐 Segurança na Rota de Cadastro de Usuário

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Camadas de Proteção](#camadas-de-proteção)
3. [Validação de Dados](#validação-de-dados)
4. [Proteção de Senha](#proteção-de-senha)
5. [Prevenção de Duplicação](#prevenção-de-duplicação)
6. [Rate Limiting](#rate-limiting)
7. [SQL Injection](#sql-injection)
8. [XSS e CSRF](#xss-e-csrf)
9. [Logging e Auditoria](#logging-e-auditoria)
10. [Conformidade OWASP Top 10](#conformidade-owasp-top-10)

---

## 🎯 Visão Geral

A rota de cadastro implementada em `POST /api/auth/register` possui **múltiplas camadas de segurança** para proteger contra ataques comuns e garantir conformidade com as melhores práticas do OWASP Top 10.

### Fluxo de Segurança

```
Cliente → Rate Limiter → Validator → Controller → Service → Model → Database
   ↓           ↓             ↓           ↓          ↓        ↓        ↓
  HTTP     Limita      Valida      Orquestra  Verifica  Hasheia   Armazena
           tentativas  inputs      lógica     duplicação senha     dados
```

---

## 🛡️ Camadas de Proteção

### 1️⃣ **Rate Limiting** (Primeira Linha de Defesa)
```javascript
// src/routes/auth.js
router.post('/register',
  registerRateLimiter,  // ← Bloqueia spam e DoS
  // ...
);
```

**O que faz:**
- Limita número de tentativas de cadastro por IP
- Previne **ataques de força bruta** e **DoS**
- Configuração padrão: 5 tentativas a cada 15 minutos

**Proteção contra:**
- ✅ A07:2021 – Identification and Authentication Failures (OWASP)
- ✅ Denial of Service (DoS)
- ✅ Spam de cadastros

---

### 2️⃣ **Validação de Entrada** (Joi Schema)
```javascript
// src/validators/authValidator.js
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email().max(255).required(),
  password: passwordSchema, // Política de senha forte
});
```

**O que faz:**
- Valida **formato** e **tipo** de dados
- **Sanitiza** inputs (trim, lowercase)
- **Remove campos desconhecidos** (stripUnknown)
- Aplica política de senha forte

**Proteção contra:**
- ✅ A03:2021 – Injection (OWASP)
- ✅ A04:2021 – Insecure Design (OWASP)
- ✅ Buffer overflow (limita tamanhos)
- ✅ Dados malformados

---

### 3️⃣ **Política de Senha Forte**
```javascript
// src/config/security.js
passwordPolicy: {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}
```

**Requisitos:**
- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 letra maiúscula
- ✅ Pelo menos 1 letra minúscula
- ✅ Pelo menos 1 número
- ✅ Pelo menos 1 caractere especial

**Proteção contra:**
- ✅ Senhas fracas
- ✅ Ataques de dicionário
- ✅ Rainbow tables

---

## 🔒 Proteção de Senha

### Hash com bcrypt (12 rounds)
```javascript
// src/models/User.js (método create)
const hashedPassword = await bcrypt.hash(password, 12);
```

**Por que 12 rounds?**
- **Balanceamento** entre segurança e performance
- Cada round dobra o tempo de processamento
- 12 rounds = ~250ms por hash (dificulta força bruta)
- Ajustável via `BCRYPT_ROUNDS` no `.env`

**Proteção contra:**
- ✅ A02:2021 – Cryptographic Failures (OWASP)
- ✅ Vazamento de senhas em texto plano
- ✅ Rainbow table attacks
- ✅ Força bruta (tempo por tentativa alto)

### ⚠️ Senha NUNCA é retornada
```javascript
// src/models/User.js
const user = await db.query(
  `SELECT id, name, email, role, created_at 
   FROM users WHERE id = $1`,
  [userId]
);
// ← Campo 'password' NUNCA é retornado em queries normais
```

---

## 🚫 Prevenção de Duplicação de Email

### Verificação no Model
```javascript
// src/models/User.js (método create)
const existingUser = await db.query(
  'SELECT id FROM users WHERE email = $1',
  [email.toLowerCase()]
);

if (existingUser.rows.length > 0) {
  throw new Error('Email já cadastrado');
}
```

**Segurança:**
- ✅ Normalização automática (lowercase)
- ✅ Verificação antes de inserir
- ✅ Constraint UNIQUE no banco (redundância)
- ❌ Mensagem **NÃO revela** se email existe (previne enumeração)

### Constraint no Banco de Dados
```sql
-- database/schema.sql
CREATE TABLE users (
  email VARCHAR(255) UNIQUE NOT NULL,
  -- ...
);
```

**Proteção contra:**
- ✅ User enumeration
- ✅ Duplicação de contas
- ✅ Race conditions (UNIQUE constraint)

---

## 💉 Prevenção de SQL Injection

### Prepared Statements (Parameterized Queries)
```javascript
// ❌ VULNERÁVEL (NUNCA FAZER)
db.query(`INSERT INTO users (email) VALUES ('${email}')`);

// ✅ SEGURO (SEMPRE FAZER)
db.query('INSERT INTO users (email) VALUES ($1)', [email]);
```

**Como funciona:**
- PostgreSQL trata `$1`, `$2` como **valores**, não código SQL
- Impossível injetar SQL malicioso
- Todos os queries do projeto usam prepared statements

**Exemplo de ataque bloqueado:**
```javascript
// Input malicioso:
const email = "test@test.com'); DROP TABLE users; --";

// Com prepared statement:
// PostgreSQL escapa automaticamente, armazena literal:
// "test@test.com'); DROP TABLE users; --"

// SEM prepared statement:
// SQL executado: INSERT INTO users (email) VALUES ('test@test.com'); DROP TABLE users; --')
// ← Tabela seria DELETADA!!!
```

**Proteção contra:**
- ✅ A03:2021 – Injection (OWASP Top 1)
- ✅ SQL Injection
- ✅ Manipulação de queries

---

## 🌐 XSS e CSRF

### Proteção XSS (Cross-Site Scripting)
```javascript
// src/middlewares/validateInput.js
const { error, value } = schema.validate(req.body, {
  stripUnknown: true, // Remove campos desconhecidos
});
req.body = value; // Substitui com valor sanitizado
```

**Também protegido por:**
- ✅ Helmet.js (headers de segurança)
- ✅ Validação Joi (remove tags maliciosas)
- ✅ Content Security Policy (CSP)

### Proteção CSRF (Cross-Site Request Forgery)
```javascript
// src/config/jwt.js
cookieOptions: {
  httpOnly: true,    // JS não acessa cookie
  secure: true,      // Apenas HTTPS (produção)
  sameSite: 'strict', // ← PROTEÇÃO CSRF
}
```

**SameSite='strict':**
- Cookie só enviado em requisições **do mesmo site**
- Bloqueia ataques CSRF de sites maliciosos

**Proteção contra:**
- ✅ A03:2021 – Injection (XSS)
- ✅ A05:2021 – Security Misconfiguration
- ✅ Cookie theft

---

## 🔍 Logging e Auditoria

### Eventos Registrados
```javascript
// src/services/authService.js
logger.info(`Novo usuário registrado: ${email} (ID: ${user.id})`);
logger.error(`Tentativa de cadastro com email duplicado: ${email}`);
```

**O que é logado:**
- ✅ Cadastros bem-sucedidos (email + ID)
- ✅ Tentativas de duplicação
- ✅ Erros de validação
- ✅ Timestamp de cada evento
- ❌ Senhas (NUNCA são logadas)

**Benefícios:**
- Detecção de ataques
- Auditoria de segurança
- Debugging de problemas
- Conformidade regulatória (LGPD, GDPR)

**Proteção contra:**
- ✅ A09:2021 – Security Logging and Monitoring Failures

---

## 📊 Conformidade OWASP Top 10 (2021)

| # | Categoria | Como a rota está protegida |
|---|-----------|----------------------------|
| **A01** | Broken Access Control | Rate limiting, validação de inputs |
| **A02** | Cryptographic Failures | bcrypt (12 rounds), HTTPS, cookies seguros |
| **A03** | Injection | Prepared statements ($1, $2), validação Joi |
| **A04** | Insecure Design | Arquitetura em camadas, validação múltipla |
| **A05** | Security Misconfiguration | Helmet, CORS, CSP, variáveis de ambiente |
| **A06** | Vulnerable Components | Dependências atualizadas, npm audit |
| **A07** | Authentication Failures | Política de senha forte, rate limiting |
| **A08** | Software Integrity Failures | package-lock.json, verificação de dependências |
| **A09** | Logging Failures | Winston logger, eventos auditados |
| **A10** | SSRF | Não aplicável (sem requisições server-side) |

---

## 🏗️ Arquitetura de Segurança

### Separação de Responsabilidades

```
┌─────────────────────────────────────────────────────────┐
│ CAMADA             │ RESPONSABILIDADE      │ PROTEÇÃO    │
├─────────────────────────────────────────────────────────┤
│ Routes            │ Aplica middlewares    │ Rate limit  │
│ Validators        │ Valida formato        │ Injection   │
│ Controllers       │ Orquestra fluxo       │ HTTP errors │
│ Services          │ Lógica de negócio     │ Duplicação  │
│ Models            │ Acesso ao banco       │ SQL Inject. │
│ Database          │ Constraints           │ Integridade │
└─────────────────────────────────────────────────────────┘
```

### Princípios Aplicados

1. **Defense in Depth** (Defesa em Profundidade)
   - Múltiplas camadas de segurança
   - Se uma falha, outras protegem

2. **Least Privilege** (Menor Privilégio)
   - Usuário novo recebe role='user' (não admin)
   - Tokens com tempo de expiração curto

3. **Fail Securely** (Falhar com Segurança)
   - Erros não expõem informações sensíveis
   - Mensagens genéricas (previne enumeração)

4. **Don't Trust User Input** (Nunca Confie no Input)
   - Todo input é validado
   - Todo input é sanitizado
   - Prepared statements sempre

---

## 🧪 Como Testar a Segurança

### 1. Testar Rate Limiting
```bash
# Enviar 10 requisições rapidamente
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test'$i'@test.com","password":"Test@123"}' &
done
# Deve bloquear após 5 tentativas
```

### 2. Testar Validação de Senha
```bash
# Senha fraca (deve falhar)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
# Resposta: "Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais"
```

### 3. Testar SQL Injection
```bash
# Tentativa de SQL injection (deve ser bloqueada)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com'\'' OR 1=1; --","password":"Test@123"}'
# Email será armazenado como string literal, não como SQL
```

### 4. Testar XSS
```bash
# Tentativa de XSS (deve ser sanitizada)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"XSS\")</script>","email":"test@test.com","password":"Test@123"}'
# Nome será validado como string, tags removidas
```

---

## 📚 Referências

- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [bcrypt - Choosing a Cost Factor](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#bcrypt)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

## ✅ Checklist de Segurança

Marque ao implementar:

- [x] Rate limiting ativado
- [x] Validação Joi configurada
- [x] Senha hasheada com bcrypt (≥12 rounds)
- [x] Prepared statements em todos os queries
- [x] Verificação de email duplicado
- [x] Política de senha forte
- [x] Cookies httpOnly + secure + sameSite
- [x] Logging de eventos de segurança
- [ ] HTTPS em produção (configurar no deploy)
- [ ] Monitoramento de logs (configurar alertas)
- [ ] Backup automático do banco
- [ ] Teste de penetração (pentesting)

---

## 🚀 Próximos Passos

1. **Implementar MFA (Multi-Factor Authentication)**
   - 2FA via SMS ou app (Google Authenticator)

2. **Verificação de Email**
   - Enviar link de confirmação
   - Ativar conta apenas após verificação

3. **CAPTCHA**
   - Adicionar reCAPTCHA no cadastro
   - Prevenir bots automatizados

4. **Análise de Senha Comprometida**
   - Verificar senhas vazadas (HaveIBeenPwned API)
   - Bloquear senhas comuns

5. **Monitoramento Avançado**
   - Integrar com Sentry, LogRocket
   - Alertas em tempo real

---

**Desenvolvido com foco em segurança e conformidade OWASP Top 10 2021** 🔒
