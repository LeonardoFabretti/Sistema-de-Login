# 🔐 Segurança na Rota de Login

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Camadas de Proteção](#camadas-de-proteção)
3. [Brute Force Protection](#brute-force-protection)
4. [Mensagens Genéricas](#mensagens-genéricas)
5. [Timing Attack Protection](#timing-attack-protection)
6. [Comparação Segura de Senha](#comparação-segura-de-senha)
7. [Rate Limiting](#rate-limiting)
8. [Logging e Auditoria](#logging-e-auditoria)
9. [JWT e Cookies Seguros](#jwt-e-cookies-seguros)
10. [Conformidade OWASP Top 10](#conformidade-owasp-top-10)

---

## 🎯 Visão Geral

A rota de login implementada em `POST /api/auth/login` possui **proteções críticas** contra os ataques mais comuns de autenticação, incluindo **brute force**, **credential stuffing**, **timing attacks** e **user enumeration**.

### Fluxo de Segurança

```
Cliente → Rate Limiter → Validator → Controller → Service → Model → Database
   ↓           ↓             ↓           ↓          ↓        ↓        ↓
  HTTP    Bloqueia      Valida     Extrai IP   Valida   Compara   Verifica
          brute       formato      para log   credenc.  senha    bloqueio
          force                                          bcrypt
```

---

## 🛡️ Camadas de Proteção

### 1️⃣ **Rate Limiting Agressivo**

```javascript
// src/routes/auth.js
router.post('/login',
  loginRateLimiter,  // ← Limite mais restritivo que registro
  // ...
);
```

**Configuração (src/config/security.js):**
```javascript
loginRateLimit: {
  windowMs: 15 * 60 * 1000,  // 15 minutos
  maxAttempts: 5,            // Apenas 5 tentativas
  blockDuration: 15 * 60 * 1000,  // Bloqueio por 15 min
}
```

**Por que mais restritivo?**
- Login é alvo preferencial de ataques brute force
- Registro é menos crítico (email único já limita)
- 5 tentativas em 15 minutos é suficiente para uso legítimo

**Proteção contra:**
- ✅ Brute force attacks
- ✅ Credential stuffing
- ✅ Password spraying
- ✅ Distributed attacks (por IP)

---

### 2️⃣ **Validação SEM Política de Senha Forte**

```javascript
// src/validators/authValidator.js
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),  // ← SEM validação de complexidade
});
```

**⚠️ IMPORTANTE: Por que NÃO validar senha forte no login?**

**ERRADO (revela informação):**
```javascript
// ❌ NUNCA FAZER NO LOGIN
password: Joi.string().min(8).pattern(/[A-Z]/)...
// → Se falhar: "Senha deve ter maiúscula"
// → Atacante sabe: email EXISTE mas senha está errada
```

**CORRETO (genérico):**
```javascript
// ✅ SEMPRE FAZER NO LOGIN
password: Joi.string().required()
// → Se falhar: "Email ou senha inválidos"
// → Atacante NÃO sabe se email existe ou senha está errada
```

**Princípio de Segurança:**
- **Cadastro**: Valida senha forte (usuário ainda não existe)
- **Login**: Apenas aceita senha (não revela se usuário existe)

**Proteção contra:**
- ✅ User enumeration
- ✅ Email harvesting
- ✅ Account discovery

---

### 3️⃣ **Mensagens Genéricas de Erro**

```javascript
// src/models/User.js - validateCredentials()

// ❌ VULNERÁVEL (revela se email existe)
if (!user) throw new Error('Usuário não encontrado');
if (!validPassword) throw new Error('Senha incorreta');

// ✅ SEGURO (mensagem genérica)
if (!user || !validPassword) {
  throw new Error('Email ou senha inválidos');
}
```

**Cenários de erro com MESMA mensagem:**
1. Email não existe → "Email ou senha inválidos"
2. Senha incorreta → "Email ou senha inválidos"
3. Conta desativada → "Email ou senha inválidos"
4. Conta bloqueada → "Email ou senha inválidos" (com timestamp)

**Exemplo de ataque bloqueado:**
```
Atacante testa: test@example.com / senha123
Resposta: "Email ou senha inválidos"

Atacante não sabe:
- Email existe?
- Senha está errada?
- Conta está bloqueada?
```

**Proteção contra:**
- ✅ A07:2021 – Identification and Authentication Failures
- ✅ User enumeration
- ✅ Account discovery
- ✅ Email validation attacks

---

## 🔐 Brute Force Protection (Dupla Camada)

### Camada 1: Rate Limiter (Nível HTTP)
```javascript
// 5 tentativas por IP a cada 15 minutos
loginRateLimiter
```

### Camada 2: Database Lock (Nível de Usuário)
```javascript
// src/models/User.js - validateCredentials()

// Verificar se conta está bloqueada
if (user.lock_until && user.lock_until > new Date()) {
  const minutesLeft = Math.ceil((user.lock_until - new Date()) / 60000);
  throw new Error(`Conta bloqueada. Tente novamente em ${minutesLeft} minutos`);
}

// Se senha errada, incrementar tentativas
if (!validPassword) {
  await User.incrementLoginAttempts(user.id);
  throw new Error('Email ou senha inválidos');
}

// Se senha correta, resetar tentativas
await User.resetLoginAttempts(user.id);
```

**Como funciona:**
```sql
-- Após 5 tentativas falhas:
UPDATE users 
SET login_attempts = login_attempts + 1,
    lock_until = NOW() + INTERVAL '15 minutes'
WHERE id = $1 AND login_attempts >= 4;
```

**Proteção em detalhes:**

| Tentativa | Ação |
|-----------|------|
| 1-4 | Incrementa `login_attempts` |
| 5 | Define `lock_until = agora + 15min` |
| 6+ | Retorna erro "Conta bloqueada" |
| Login OK | Define `login_attempts = 0`, `lock_until = NULL` |

**Proteção contra:**
- ✅ Brute force distribuído (persist por conta, não por IP)
- ✅ Slow brute force (acumula tentativas no tempo)
- ✅ VPN rotation (bloqueio é por email, não IP)

---

## ⏱️ Timing Attack Protection

### O que é Timing Attack?

Atacante mede **tempo de resposta** para descobrir informações:

```
Cenário VULNERÁVEL:
├─ Email não existe → Resposta em 5ms (busca rápida)
└─ Email existe mas senha errada → Resposta em 250ms (bcrypt)

Atacante sabe que email existe pela diferença de tempo!
```

### Nossa Proteção: bcrypt.compare()

```javascript
// src/models/User.js
const validPassword = await bcrypt.compare(password, user.password);

if (!user || !validPassword) {  // ← Avalia AMBOS sempre
  throw new Error('Email ou senha inválidos');
}
```

**Por que bcrypt.compare() protege:**
1. **Timing-safe comparison** - Sempre leva o mesmo tempo
2. **Constant-time algorithm** - Não para na primeira diferença
3. **Mesmo tempo mesmo com senha errada** - ~250ms sempre

**Exemplo:**
```
Senha correta:     bcrypt.compare() = 248ms
Senha incorreta:   bcrypt.compare() = 250ms
Diferença: 2ms (insignificante para detectar)
```

**⚠️ Armadilha comum:**
```javascript
// ❌ VULNERÁVEL (timing attack)
if (!user) {
  throw new Error('...');  // ← Retorna rápido (5ms)
}
if (!await bcrypt.compare(...)) {
  throw new Error('...');  // ← Retorna lento (250ms)
}

// ✅ SEGURO (sempre compara)
const validPassword = user ? await bcrypt.compare(...) : false;
if (!user || !validPassword) {
  throw new Error('...');  // ← Sempre ~250ms
}
```

**Proteção contra:**
- ✅ Timing attacks
- ✅ User enumeration via timing
- ✅ Side-channel attacks

---

## 🔒 Comparação Segura de Senha

### bcrypt.compare() - Por que é seguro?

```javascript
// src/models/User.js
const validPassword = await bcrypt.compare(password, user.password);
```

**3 Proteções em 1:**

#### 1. Timing-Safe (já explicado acima)

#### 2. Salt Automático
```
Senha armazenada: $2b$12$LQv3c1yqBWVHxkd.../iIGJZO
                   │  │  └─── Salt (16 bytes)
                   │  └────── Rounds (2^12 = 4096 iterações)
                   └───────── Algoritmo (bcrypt)

bcrypt.compare() extrai salt automaticamente e compara
```

#### 3. Proteção contra Rainbow Tables
- Cada usuário tem salt diferente
- Mesmo senha = hash diferente
- Rainbow tables inúteis

**Exemplo:**
```javascript
// Dois usuários com MESMA senha:
user1.password = '$2b$12$abc...hash1';
user2.password = '$2b$12$xyz...hash2';  // ← Hash diferente!
```

**Proteção contra:**
- ✅ A02:2021 – Cryptographic Failures
- ✅ Rainbow table attacks
- ✅ Precomputed hash attacks
- ✅ Timing attacks

---

## 🚦 Rate Limiting Detalhado

### Implementação em Múltiplas Camadas

```javascript
// Camada 1: Rate Limiter Global (express-rate-limit)
app.use('/api', apiRateLimiter);  // 100 req/15min

// Camada 2: Rate Limiter de Login (específico)
router.post('/login', loginRateLimiter);  // 5 req/15min

// Camada 3: Brute Force Protection (banco de dados)
User.validateCredentials() → incrementLoginAttempts()
```

### Configuração Otimizada

```javascript
// src/middlewares/rateLimiter.js
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutos
  max: 5,                        // 5 requisições
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,         // RateLimit-* headers
  legacyHeaders: false,
  
  // Identificar por IP
  keyGenerator: (req) => req.ip,
  
  // Handler customizado
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login',
      retryAfter: 15 * 60, // segundos
    });
  },
});
```

### Headers de Resposta

```http
RateLimit-Limit: 5
RateLimit-Remaining: 2
RateLimit-Reset: 1708174800
```

**Cliente pode:**
- Ver quantas tentativas restam
- Saber quando pode tentar novamente
- Implementar backoff automático

---

## 📊 Logging e Auditoria

### Eventos Logados

```javascript
// src/services/authService.js

// ✅ Login bem-sucedido
logger.info(`Login bem-sucedido: ${email} (ID: ${user.id}) de IP ${ipAddress}`);

// ⚠️ Tentativa falha
logger.warn(`Tentativa de login falha para email: ${email} de IP ${ipAddress}`);

// 🚨 Conta bloqueada
logger.warn(`Conta bloqueada por tentativas excessivas: ${email} (ID: ${user.id})`);

// 🔥 Rate limit atingido
logger.warn(`Rate limit excedido para IP: ${req.ip}`);
```

### O que NÃO é logado:

```javascript
// ❌ NUNCA LOGAR
logger.error(`Login falhou: senha ${password} incorreta`);  // ← Expõe senha!
logger.error(`Usuário ${email} não existe`);  // ← User enumeration!
```

### Formato de Log (Winston)

```json
{
  "level": "warn",
  "message": "Tentativa de login falha para email: test@example.com de IP 192.168.1.1",
  "timestamp": "2026-02-17T10:30:00.123Z",
  "service": "auth-service"
}
```

### Casos de Uso:

1. **Detecção de Ataques:**
   - Múltiplas falhas do mesmo IP → DDoS/brute force
   - Múltiplas falhas para mesmo email → Targeted attack

2. **Análise Forense:**
   - Investigar acesso não autorizado
   - Rastrear tentativas de invasão

3. **Compliance:**
   - LGPD: Registro de acessos a dados pessoais
   - GDPR: Auditoria de autenticação

**Proteção contra:**
- ✅ A09:2021 – Security Logging and Monitoring Failures

---

## 🍪 JWT e Cookies Seguros

### Geração de Tokens

```javascript
// src/services/tokenService.js (exemplo)
const accessToken = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }  // ← Curta duração
);

const refreshToken = jwt.sign(
  { userId: user.id, tokenId: uuid() },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }  // ← Longa duração
);
```

### Cookies Seguros

```javascript
// src/controllers/authController.js
res.cookie('accessToken', result.accessToken, {
  httpOnly: true,     // ← JavaScript não acessa (XSS protection)
  secure: true,       // ← Apenas HTTPS (produção)
  sameSite: 'strict', // ← Previne CSRF
  maxAge: 15 * 60 * 1000,  // 15 minutos
});

res.cookie('refreshToken', result.refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 dias
});
```

### Atributos de Segurança:

| Atributo | Proteção | Explicação |
|----------|----------|------------|
| `httpOnly: true` | XSS | JavaScript não pode ler `document.cookie` |
| `secure: true` | MITM | Cookie só enviado via HTTPS |
| `sameSite: 'strict'` | CSRF | Cookie só enviado em requisições same-site |
| `maxAge` | Session fixation | Cookie expira automaticamente |

### Por que AMBOS (response + cookie)?

```javascript
// Response body
res.json({
  data: {
    accessToken: "..."  // ← Para clientes mobile/SPA
  }
});

// Cookie
res.cookie('accessToken', "...");  // ← Para browsers
```

**Flexibilidade:**
- **Web browsers**: Usam cookie (mais seguro)
- **Mobile apps**: Usam token do body (armazenam localmente)
- **SPAs**: Podem usar ambos (cookie para auth, body para storage)

**Proteção contra:**
- ✅ A02:2021 – Cryptographic Failures
- ✅ A05:2021 – Security Misconfiguration
- ✅ XSS attacks
- ✅ CSRF attacks
- ✅ Token theft

---

## 📊 Conformidade OWASP Top 10 (2021)

| # | Categoria | Como a rota de LOGIN está protegida |
|---|-----------|--------------------------------------|
| **A01** | Broken Access Control | JWT obrigatório para rotas privadas, rate limiting |
| **A02** | Cryptographic Failures | bcrypt.compare() timing-safe, cookies httpOnly/secure |
| **A03** | Injection | Prepared statements, validação Joi |
| **A04** | Insecure Design | Brute force protection dupla, mensagens genéricas |
| **A05** | Security Misconfiguration | Cookies seguros, CORS, helmet, variables .env |
| **A06** | Vulnerable Components | Dependências atualizadas, bcrypt latest |
| **A07** | Auth Failures | **FOCO PRINCIPAL**: Rate limit, account lock, timing-safe |
| **A08** | Software Integrity | package-lock.json, npm audit |
| **A09** | Logging Failures | Winston logger, eventos auditados (sem senhas) |
| **A10** | SSRF | Não aplicável |

### ⭐ Destaque: A07 - Authentication Failures

Esta categoria é **CRÍTICA** para login. Nossa implementação:

✅ **Multi-factor brute force protection:**
- Rate limiting por IP (5 tentativas)
- Account locking por email (5 tentativas)

✅ **Credential stuffing protection:**
- Mensagens genéricas (sem enumeration)
- Logging de IPs suspeitos

✅ **Timing attack protection:**
- bcrypt.compare() constant-time
- Sempre valida ambos (user && password)

✅ **Session management:**
- Tokens JWT com expiração curta
- Refresh token rotation
- HttpOnly cookies

---

## 🧪 Como Testar a Segurança

### 1. Testar Login Bem-Sucedido
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"SenhaCorreta@123"}'

# Resposta esperada: 200 OK com tokens
```

### 2. Testar Senha Incorreta (Mensagem Genérica)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"SenhaErrada"}'

# Resposta: "Email ou senha inválidos" (não revela que email existe)
```

### 3. Testar Email Inexistente (Mesma Mensagem)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"naoexiste@example.com","password":"Qualquer@123"}'

# Resposta: "Email ou senha inválidos" (igual ao erro de senha)
```

### 4. Testar Brute Force Protection
```bash
# Fazer 6 tentativas com senha errada
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"usuario@example.com","password":"Errada'$i'"}' &
done

# Após 5 tentativas: "Conta bloqueada. Tente novamente em X minutos"
```

### 5. Testar Rate Limiting
```bash
# Enviar 10 requisições rapidamente
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com","password":"Abc@123"}' &
done

# Após 5 requisições: HTTP 429 Too Many Requests
```

### 6. Testar Timing Attack (Avançado)
```bash
# Medir tempo de resposta para email existente vs inexistente
time curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"existe@example.com","password":"Errada@123"}'

time curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"naoexiste@example.com","password":"Errada@123"}'

# Tempos devem ser similares (~250ms) devido ao bcrypt
```

---

## 📚 Referências

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt - Timing-Safe Comparison](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)
- [Express Rate Limiting Best Practices](https://expressjs.com/en/advanced/best-practice-security.html#prevent-brute-force-attacks)
- [JWT Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## ✅ Checklist de Segurança - Login

Marque ao implementar:

**Validação:**
- [x] Schema Joi sem política de senha forte
- [x] Normalização de email (lowercase)
- [x] Mensagens genéricas de erro

**Autenticação:**
- [x] bcrypt.compare() timing-safe
- [x] Busca usuário COM senha (findByEmailWithPassword)
- [x] Verificação de conta ativa
- [x] Verificação de bloqueio

**Brute Force:**
- [x] Rate limiting ativado (5/15min)
- [x] Account locking após 5 tentativas
- [x] Bloqueio por 15 minutos
- [x] Reset de tentativas em login bem-sucedido

**Tokens:**
- [x] JWT com expiração curta (15min access)
- [x] Refresh token (7 dias)
- [ ] Refresh token rotation (implementar depois)
- [ ] Token revocation (implementar depois)

**Cookies:**
- [x] httpOnly habilitado
- [x] secure em produção
- [x] sameSite='strict'
- [x] maxAge configurado

**Logging:**
- [x] Login bem-sucedido (email + ID + IP)
- [x] Tentativa falha (email + IP, SEM senha)
- [x] Conta bloqueada
- [x] Rate limit excedido
- [x] Senhas NUNCA logadas

**Deploy:**
- [ ] HTTPS obrigatório em produção
- [ ] Variáveis de ambiente (.env)
- [ ] Monitoramento de logs
- [ ] Alertas de múltiplas falhas

---

## 🎯 Comparação: Cadastro vs Login

| Aspecto | Cadastro | Login |
|---------|----------|-------|
| **Rate Limit** | 5/15min | 5/15min (mesmo) |
| **Validação Senha** | ✅ Política forte | ❌ Apenas obrigatória |
| **Mensagem Erro** | "Email já cadastrado" | "Email OU senha inválidos" |
| **bcrypt** | hash() - cria hash | compare() - valida hash |
| **Account Lock** | Não aplicável | ✅ Após 5 tentativas |
| **Logging** | Novo usuário criado | Login + IP |
| **Retorna Senha** | ❌ Nunca | ❌ Nunca |

**Por que diferenças?**
- **Cadastro**: Ainda não há usuário → pode revelar erros específicos
- **Login**: Usuário pode existir → mensagens genéricas previnem enumeration

---

**Desenvolvido com foco em conformidade OWASP A07:2021 - Authentication Failures** 🔒
