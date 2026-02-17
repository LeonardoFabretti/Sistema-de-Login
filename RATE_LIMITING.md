# 🛡️ RATE LIMITING E PROTEÇÃO CONTRA BRUTE FORCE

## 📋 Índice

1. [O que é Brute Force](#o-que-é-brute-force)
2. [Como Rate Limiting Protege](#como-rate-limiting-protege)
3. [Configuração Segura](#configuração-segura)
4. [Implementação](#implementação)
5. [Matemática da Proteção](#matemática-da-proteção)
6. [Testes](#testes)
7. [Monitoramento](#monitoramento)

---

## 🎯 O que é Brute Force

**Brute Force Attack** é quando um atacante tenta adivinhar credenciais (senha) testando sistematicamente todas as combinações possíveis até encontrar a correta.

### Tipos de Ataques Brute Force

#### 1. Ataque de Dicionário
```
Atacante tenta senhas comuns:
- senha123
- admin123
- password
- 123456
- qwerty
- futebol
```

#### 2. Rainbow Table Attack
```
Atacante usa tabelas pré-computadas de hashes:
- Hash de "password" = 5f4dcc3b5aa765d61d8327deb882cf99
- Compara com banco de dados vazado
```

#### 3. Credential Stuffing
```
Atacante usa credenciais vazadas de outros sites:
Email: user@example.com
Senhas testadas:
- SenhaVazadaSite1
- SenhaVazadaSite2
- SenhaVazadaSite3
```

#### 4. Ataque Automatizado
```javascript
// Script de ataque (sem rate limit)
for (let i = 0; i < 1000000; i++) {
  try {
    await login(email, senhas[i]);
    if (sucesso) {
      console.log('SENHA ENCONTRADA:', senhas[i]);
      break;
    }
  } catch {}
}

// Velocidade: 1000 tentativas/segundo
// Senha de 6 dígitos: quebrada em ~1 segundo!
```

---

## 🔒 Como Rate Limiting Protege

### Sem Rate Limiting (VULNERÁVEL)

```bash
# Atacante tenta 1000 senhas/segundo
Tentativa 1: senha123 ❌
Tentativa 2: admin123 ❌
Tentativa 3: password ❌
...
Tentativa 847: SenhaCorreta ✅ (encontrada em < 1 segundo!)
```

**Resultado:** Senha quebrada rapidamente!

---

### Com Rate Limiting (PROTEGIDO)

```bash
# Rate limit: 5 tentativas / 15 minutos

Tentativa 1: senha123 ❌
Tentativa 2: admin123 ❌
Tentativa 3: password ❌
Tentativa 4: 123456 ❌
Tentativa 5: qwerty ❌

🛑 BLOQUEADO POR 15 MINUTOS!

# Atacante precisa esperar 15min para mais 5 tentativas
# Resultado: 480 tentativas/dia (5 a cada 15min × 96 períodos/dia)
```

**Resultado:** Senha forte (12+ chars) = **impossível quebrar**!

---

## 📊 Matemática da Proteção

### Cenário 1: Senha Fraca (6 dígitos numéricos)

**Sem rate limit:**
```
Combinações: 10^6 = 1.000.000
Velocidade: 1000 tentativas/segundo
Tempo para quebrar: 1.000.000 / 1000 = 1000 segundos (~17 minutos)
```
❌ **VULNERÁVEL**

**Com rate limit (5 tentativas / 15 min):**
```
Tentativas/dia: 480
Tempo para quebrar: 1.000.000 / 480 = 2.083 dias (~5,7 anos)
```
✅ **Senhas fracas protegidas temporariamente**

---

### Cenário 2: Senha Forte (12 caracteres)

**Alfabeto completo:**
- Minúsculas: a-z (26)
- Maiúsculas: A-Z (26)
- Números: 0-9 (10)
- Especiais: !@#$%... (10)
- **Total: 72 caracteres**

**Combinações possíveis:**
```
72^12 = 19.408.409.961.765.342.806.016 combinações
       (~19 sextilhões)
```

**Sem rate limit (1000 tentativas/segundo):**
```
Tempo: 19.408.409.961.765.342.806.016 / 1000 = 19,4 × 10^18 segundos
     = 6,15 × 10^11 anos (615 bilhões de anos!)
```
✅ **Já é seguro (mais que idade do universo)**

**Com rate limit (5 tentativas / 15 min):**
```
Tentativas/dia: 480
Tempo: 19.408.409.961.765.342.806.016 / 480 = 4,04 × 10^19 dias
     = 1,1 × 10^17 anos
```
✅ **IMPOSSÍVEL quebrar (mesmo com supercomputador)**

---

### Cenário 3: Ataque Distribuído (100 IPs)

**Sem rate limit:**
```
100 IPs × 1000 tent/seg = 100.000 tentativas/segundo
Senha fraca (10^6 combinações) = quebrada em 10 segundos!
```
❌ **VULNERÁVEL**

**Com rate limit + bloqueio por IP:**
```
100 IPs × 5 tentativas / 15min = 500 tentativas / 15min
Tentativas/dia: 48.000
Senha fraca: 1.000.000 / 48.000 = 21 dias

Senha forte: Impossível (como calculado acima)
```
✅ **Protegido mesmo com múltiplos IPs**

---

## ⚙️ Configuração Segura

### 1. Rate Limit para LOGIN (CRÍTICO)

```javascript
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ⏱️ 15 minutos
  max: 5,                    // 🎯 5 tentativas máximo
  
  // ✅ IMPORTANTE: Só conta falhas, não sucessos
  skipSuccessfulRequests: true,
  
  // 🔑 Identificar por IP
  keyGenerator: (req) => req.ip,
  
  // 📝 Mensagem clara
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutos'
  }
});
```

**Por que 5 tentativas / 15 min?**
- **Usuário legítimo:** Raramente erra senha 5x seguidas
- **Atacante:** 5 tentativas/15min = 480/dia = inútil para senha forte
- **Falso positivo baixo:** Usuário que esqueceu senha pode usar "Esqueci minha senha"

---

### 2. Rate Limit para CADASTRO

```javascript
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,                    // 3 cadastros/hora
  
  message: {
    message: 'Muitas tentativas de cadastro. Tente novamente em 1 hora.'
  }
});
```

**Por que 3 cadastros / hora?**
- **Previne spam:** Bots não podem criar milhares de contas
- **Previne fraude:** Dificulta criação de contas falsas em massa
- **Usuário normal:** Cadastra apenas 1 conta

---

### 3. Rate Limit para RESET DE SENHA

```javascript
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,                    // 3 tentativas/hora
  
  message: {
    message: 'Muitas tentativas de recuperação. Tente novamente em 1 hora.'
  }
});
```

**Por que 3 tentativas / hora?**
- **Previne enumeração:** Atacante não pode descobrir emails cadastrados
- **Previne spam:** Não pode enviar milhares de emails de reset
- **Usuário normal:** Usa reset raramente

---

### 4. Rate Limit GERAL da API

```javascript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                  // 100 requisições
  
  message: {
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  }
});
```

**Por que 100 requisições / 15 min?**
- **Previne DoS:** Não pode sobrecarregar servidor
- **Usuário normal:** 100 req/15min = 6,6 req/min (suficiente)
- **Scrapers bloqueados:** Bots de raspagem de dados são bloqueados

---

## 🔧 Implementação

### Arquivo: src/middlewares/rateLimiter.js

```javascript
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Login: 5 tentativas / 15min
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Não conta sucessos
  
  handler: (req, res) => {
    const email = req.body?.email || 'desconhecido';
    
    // ⚠️ LOG DE SEGURANÇA
    logger.warn(`BRUTE FORCE BLOCKED: IP ${req.ip} - Email: ${email}`);
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente em 15 minutos.',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED'
    });
  }
});

module.exports = { loginRateLimiter };
```

---

### Uso nas Rotas: src/routes/auth.js

```javascript
const { loginRateLimiter } = require('../middlewares/rateLimiter');

// ✅ Aplicar rate limiter ANTES do controller
router.post('/login', 
  loginRateLimiter,  // 1º: Bloqueia se excedeu limite
  validate(loginSchema), // 2º: Valida formato
  authController.login   // 3º: Processa login
);
```

**Ordem importa:**
1. Rate limiter primeiro (bloqueia antes de processar)
2. Validação (rejeita inputs inválidos)
3. Controller (processa lógica de negócio)

---

## 🧪 Testando Rate Limiting

### Teste 1: Bloquear após 5 tentativas

```bash
# Tentativa 1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha_errada1"}'
# ❌ 401 Unauthorized - Credenciais inválidas

# Tentativa 2
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha_errada2"}'
# ❌ 401 Unauthorized

# ... (repita até 5 tentativas)

# Tentativa 6
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"qualquer"}'
# 🛑 429 Too Many Requests - BLOQUEADO!
# {
#   "success": false,
#   "message": "Muitas tentativas de login. Tente novamente em 15 minutos.",
#   "code": "LOGIN_RATE_LIMIT_EXCEEDED"
# }
```

---

### Teste 2: Headers de Rate Limit

```bash
curl -v http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha"}'

# Headers retornados:
RateLimit-Limit: 5              # Máximo permitido
RateLimit-Remaining: 4          # Tentativas restantes
RateLimit-Reset: 1709215200     # Timestamp quando reseta
```

**Usando os headers no client:**
```javascript
// Frontend pode mostrar contador
const response = await fetch('/api/auth/login', { ... });

const remaining = response.headers.get('RateLimit-Remaining');
const reset = response.headers.get('RateLimit-Reset');

if (remaining <= 2) {
  alert(`Atenção! Você tem apenas ${remaining} tentativas restantes.`);
}
```

---

### Teste 3: Reset após sucesso

```bash
# Tentativa 1-4: Senha errada
curl -X POST ... -d '{"password":"errado"}' # ❌ 401

# Tentativa 5: Senha CERTA
curl -X POST ... -d '{"password":"SenhaCorreta123!"}' # ✅ 200

# Tentativa 6: Contador resetou!
curl -X POST ... -d '{"password":"qualquer"}' # ❌ 401 (não 429!)
# Porque skipSuccessfulRequests: true resetou o contador
```

---

## 📊 Monitoramento e Logs

### 1. Logs de Tentativas Bloqueadas

```javascript
// Em rateLimiter.js
handler: (req, res) => {
  logger.warn({
    message: 'BRUTE FORCE ATTEMPT BLOCKED',
    ip: req.ip,
    email: req.body?.email,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  
  res.status(429).json({ ... });
}
```

**Output do log:**
```json
{
  "level": "warn",
  "message": "BRUTE FORCE ATTEMPT BLOCKED",
  "ip": "192.168.1.100",
  "email": "admin@example.com",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-02-17T10:30:00.000Z"
}
```

---

### 2. Alertas de Segurança

```javascript
// Em produção: Enviar alerta quando bloqueado
handler: (req, res) => {
  const email = req.body?.email;
  
  // Log local
  logger.warn(`BRUTE FORCE: ${req.ip} - ${email}`);
  
  // Enviar para SIEM (Security Information and Event Management)
  // sendToSIEM({ type: 'BRUTE_FORCE_BLOCKED', ip: req.ip, email });
  
  // Notificar equipe de segurança
  // if (isHighValueAccount(email)) {
  //   sendSlackAlert(`Ataque brute force em conta admin: ${email}`);
  // }
  
  // Enviar email para dono da conta
  // sendEmail(email, 'Tentativas de login suspeitas detectadas');
  
  res.status(429).json({ ... });
}
```

---

### 3. Dashboard de Métricas

```javascript
// Contador de bloqueios por IP
const blockedIPs = new Map();

handler: (req, res) => {
  const ip = req.ip;
  blockedIPs.set(ip, (blockedIPs.get(ip) || 0) + 1);
  
  // Se IP foi bloqueado 10x em 24h → Banir temporariamente
  if (blockedIPs.get(ip) >= 10) {
    logger.error(`IP ${ip} bloqueado permanentemente (10+ tentativas)`);
    // addToBlacklist(ip);
  }
  
  res.status(429).json({ ... });
}
```

---

## 🔐 Configurações Avançadas

### 1. Rate Limit por IP + Email

```javascript
// Mais preciso: Limita por combinação IP + Email
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  
  // ✅ Chave única: IP + Email
  keyGenerator: (req) => {
    const ip = req.ip;
    const email = req.body?.email || '';
    return `${ip}-${email}`;
  }
});
```

**Vantagem:** Atacante com múltiplos IPs não pode atacar mesmo email

**Desvantagem:** Usuário legítimo em IP compartilhado (café, biblioteca) pode ser bloqueado por outro usuário

---

### 2. Rate Limit Progressivo (Exponential Backoff)

```javascript
// Aumenta tempo de bloqueio a cada violação
const blockDurations = new Map();

const loginRateLimiter = rateLimit({
  windowMs: (req) => {
    const key = req.ip;
    const violations = blockDurations.get(key) || 0;
    
    // 1ª violação: 15min
    // 2ª violação: 30min
    // 3ª violação: 1 hora
    // 4ª violação: 2 horas
    const duration = 15 * 60 * 1000 * Math.pow(2, violations);
    
    return Math.min(duration, 24 * 60 * 60 * 1000); // Máx 24h
  },
  
  max: 5,
  
  handler: (req, res) => {
    const key = req.ip;
    blockDurations.set(key, (blockDurations.get(key) || 0) + 1);
    
    res.status(429).json({ ... });
  }
});
```

---

### 3. Whitelist de IPs (Admin/Confiáveis)

```javascript
const TRUSTED_IPS = [
  '10.0.0.1',      // VPN da empresa
  '192.168.1.100'  // IP do escritório
];

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  
  // ✅ Pular rate limit para IPs confiáveis
  skip: (req) => {
    return TRUSTED_IPS.includes(req.ip);
  }
});
```

---

### 4. CAPTCHA após 3 tentativas

```javascript
const failedAttempts = new Map();

router.post('/login', async (req, res) => {
  const ip = req.ip;
  const attempts = failedAttempts.get(ip) || 0;
  
  // ✅ Exigir CAPTCHA após 3 falhas
  if (attempts >= 3 && !req.body.captchaToken) {
    return res.status(400).json({
      success: false,
      message: 'CAPTCHA obrigatório após múltiplas tentativas',
      requireCaptcha: true
    });
  }
  
  // Validar CAPTCHA se fornecido
  if (req.body.captchaToken) {
    const validCaptcha = await verifyCaptcha(req.body.captchaToken);
    if (!validCaptcha) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA inválido'
      });
    }
  }
  
  // Processar login normalmente...
});
```

---

## ✅ Checklist de Segurança

### Rate Limiting
- [x] Login: 5 tentativas / 15 minutos
- [x] Cadastro: 3 tentativas / hora
- [x] Reset senha: 3 tentativas / hora
- [x] API geral: 100 requisições / 15 minutos
- [x] `skipSuccessfulRequests: true` no login
- [x] Logging de tentativas bloqueadas

### Proteções Complementares
- [x] Senhas com bcrypt (12 rounds)
- [x] Política de senha forte (8+ chars, complexidade)
- [x] Mensagens genéricas de erro (não revela se email existe)
- [x] Timing attack protection (bcrypt.compare com tempo constante)
- [x] HTTPS obrigatório (previne sniffing)
- [x] JWT com expiração curta (30min)

### Monitoramento
- [x] Logs de tentativas bloqueadas
- [x] Alertas para equipe de segurança
- [ ] Dashboard de métricas de bloqueio
- [ ] SIEM integration (produção)
- [ ] Banimento automático de IPs maliciosos

---

## 📚 Resumo de 1 Minuto

### ⚠️ Problema: Brute Force Attack
Atacante tenta adivinhar senhas testando milhares de combinações.

### ✅ Solução: Rate Limiting
Limita tentativas de login a **5 por 15 minutos**.

### 🔢 Matemática da Proteção
- **Sem rate limit:** 1000 tentativas/segundo = senha quebrada em minutos
- **Com rate limit:** 5 tentativas/15min = 480/dia = impossível quebrar senha forte

### ⚙️ Configuração Segura
```javascript
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,                    // 5 tentativas
  skipSuccessfulRequests: true // Não conta sucessos
});
```

### 🎯 Por que Funciona
1. Usuário legítimo raramente erra 5x
2. Atacante precisa esperar 15min entre tentativas
3. Senha forte = impossível quebrar com 480 tentativas/dia
4. Atacante desiste (não vale tempo/custo)

**Implementação:** [src/middlewares/rateLimiter.js](src/middlewares/rateLimiter.js)  
**Uso:** [src/routes/auth.js](src/routes/auth.js)
