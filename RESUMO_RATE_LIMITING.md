# 🎯 RESUMO: RATE LIMITING E PROTEÇÃO BRUTE FORCE

## ✅ Implementação Completa

O sistema de **rate limiting** está **100% implementado e ativo** em todas as rotas sensíveis.

---

## 📁 Arquivos Criados/Atualizados

| Arquivo | Descrição |
|---------|-----------|
| [src/middlewares/rateLimiter.js](src/middlewares/rateLimiter.js) | Rate limiters configurados e ativos |
| [RATE_LIMITING.md](RATE_LIMITING.md) | Documentação completa (matemática, configuração, testes) |
| [examples/testRateLimiting.js](examples/testRateLimiting.js) | Testes automatizados de proteção |

---

## 🚀 Como Funciona

### Rate Limiting = Limite de Requisições por Tempo

```
┌─────────────────────────────────────────────────────┐
│  JANELA DE 15 MINUTOS                               │
├─────────────────────────────────────────────────────┤
│  Tentativa 1: senha123 ❌                           │
│  Tentativa 2: admin123 ❌                           │
│  Tentativa 3: password ❌                           │
│  Tentativa 4: 123456 ❌                             │
│  Tentativa 5: qwerty ❌                             │
│                                                     │
│  🛑 BLOQUEADO POR 15 MINUTOS!                       │
│                                                     │
│  Tentativa 6: [REJEITADA]                          │
│  Status: 429 Too Many Requests                     │
│  Mensagem: "Tente novamente em 15 minutos"        │
└─────────────────────────────────────────────────────┘
```

---

## ⚙️ Configurações Implementadas

### 1. Login (CRÍTICO - Proteção Brute Force)

```javascript
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,                    // 5 tentativas
  skipSuccessfulRequests: true // Não conta sucessos
});
```

**Proteção:**
- ✅ Bloqueia após 5 tentativas falhas
- ✅ Contador reseta em login bem-sucedido
- ✅ Logging de tentativas bloqueadas
- ✅ Headers informativos (RateLimit-Remaining)

**Uso:**
```javascript
router.post('/login', loginRateLimiter, authController.login);
```

---

### 2. Cadastro (Previne Spam)

```javascript
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3                     // 3 cadastros
});
```

**Proteção:**
- ✅ Previne criação em massa de contas falsas
- ✅ Dificulta bots e spam
- ✅ Limita fraudes

---

### 3. Reset de Senha (Previne Enumeração)

```javascript
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3                     // 3 tentativas
});
```

**Proteção:**
- ✅ Previne descobrir emails cadastrados
- ✅ Previne spam de emails
- ✅ Limita abuso do sistema de recuperação

---

### 4. API Geral (Previne DoS)

```javascript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100                   // 100 requisições
});
```

**Proteção:**
- ✅ Previne sobrecarga do servidor
- ✅ Bloqueia scrapers
- ✅ Limita abuso geral

---

## 🔢 Matemática da Proteção

### ❌ SEM Rate Limit

```
Atacante: 1.000 tentativas/segundo
Senha fraca (10^6 combinações): quebrada em 17 MINUTOS
Senha forte (72^12 combinações): 615 bilhões de anos (mas...)
```

### ✅ COM Rate Limit (5 tent / 15 min)

```
Atacante: 5 tentativas / 15 minutos = 480 tentativas/dia

Senha fraca (10^6 combinações):
  1.000.000 / 480 = 2.083 dias (~5,7 anos)
  
Senha forte (72^12 combinações):
  19.408.409.961.765.342.806.016 / 480 = IMPOSSÍVEL
  (~1,1 × 10^17 anos)
```

**Resultado:**
- 🎯 Senhas **FRACAS** → Tornam-se **FORTES**
- 🎯 Senhas **FORTES** → Tornam-se **IMPOSSÍVEIS**
- 🎯 Redução de **99,99%** nas tentativas de ataque

---

## 🛡️ Por que Protege Contra Brute Force

### 1. Limita Velocidade de Ataque

**Sem rate limit:**
```python
# Script de ataque
for senha in dicionario:
    if login(email, senha):
        print("SUCESSO!")
        break

# Velocidade: 1000 tentativas/segundo
# Tempo: Minutos para quebrar senha fraca
```

**Com rate limit:**
```python
# Mesmo script
for senha in dicionario:
    if login(email, senha):
        print("SUCESSO!")
        break
    # Mas após 5 tentativas: HTTP 429 Too Many Requests
    # Precisa esperar 15 minutos!

# Velocidade: 480 tentativas/DIA
# Tempo: Anos para quebrar senha fraca
```

**Conclusão:** Atacante desiste (não vale tempo/custo)!

---

### 2. Torna Ataque Economicamente Inviável

**Custo do ataque:**
```
Sem rate limit:
  Tempo: 17 minutos
  Custo servidor: $0.01
  ROI: Alto (vale a pena)

Com rate limit:
  Tempo: 5,7 anos
  Custo servidor: $50.000+ (manter durante anos)
  Custo oportunidade: Tempo perdido
  Risco: Ser detectado e banido
  ROI: Negativo (não vale a pena)
```

**Conclusão:** Atacante busca alvos mais fáceis!

---

### 3. Previne Ataques Automatizados

**Características de bots:**
- Tentam milhares de senhas rapidamente
- Esperam resposta imediata
- Não têm "paciência" para esperar

**Rate limiting:**
- Força espera de 15 minutos
- Torna script inútil (leva anos ao invés de minutos)
- Bot move para próximo alvo

---

### 4. Protege Mesmo com Senhas Fracas

**Realidade:**
- Usuários escolhem senhas fracas (123456, senha123)
- Impossível forçar senhas ultra-fortes (usabilidade)

**Rate limiting compensa:**
- Senha fraca + rate limit = Tempo de quebra aceitável
- Dá tempo para detecção e resposta
- Permite políticas mais flexíveis

---

## 🧪 Testar a Proteção

### Teste Manual

```bash
# Tentativa 1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"errado1"}'
# ❌ 401 Unauthorized - Credenciais inválidas
# Header: RateLimit-Remaining: 4

# Tentativa 2-5 (repita)
# ...

# Tentativa 6
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"errado6"}'
# 🛑 429 Too Many Requests - BLOQUEADO!
# {
#   "success": false,
#   "message": "Muitas tentativas de login. Tente novamente em 15 minutos.",
#   "code": "LOGIN_RATE_LIMIT_EXCEEDED"
# }
```

---

### Teste Automatizado

```bash
node examples/testRateLimiting.js
```

**Output esperado:**
```
═══════════════════════════════════════════════════════
🛡️  RATE LIMITING E PROTEÇÃO CONTRA BRUTE FORCE
═══════════════════════════════════════════════════════

🧪 SIMULAÇÃO: Ataque Brute Force SEM Rate Limit
❌ SENHA QUEBRADA em 847 tentativas (0.85 segundos)!
⚠️  SEM RATE LIMIT = VULNERÁVEL!

🧪 TESTE: Ataque Brute Force COM Rate Limit
Tentativa 1: Testando senha "senha123"...❌
Tentativa 2: Testando senha "admin123"...❌
Tentativa 3: Testando senha "password"...❌
Tentativa 4: Testando senha "123456"...❌
Tentativa 5: Testando senha "qwerty"...❌
🛑 BLOQUEADO! Rate limit excedido após 5 tentativas
✅ PROTEÇÃO FUNCIONANDO! Brute force bloqueado.

🧮 MATEMÁTICA: Por que Rate Limit Protege
Senha fraca: 17 min → 5,7 ANOS
Senha forte: Impossível → Mais impossível
Redução: 99,99% nas tentativas
```

---

## 📊 Headers de Rate Limit

### Headers Retornados

```http
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1709215200
```

**Significado:**
- `RateLimit-Limit`: Máximo de tentativas permitidas (5)
- `RateLimit-Remaining`: Tentativas restantes (3)
- `RateLimit-Reset`: Timestamp UNIX quando contador reseta

---

### Usar no Frontend

```javascript
// Fazer login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// Ler headers
const remaining = response.headers.get('RateLimit-Remaining');
const reset = response.headers.get('RateLimit-Reset');

// Mostrar alerta ao usuário
if (remaining <= 2) {
  alert(`Atenção! Você tem apenas ${remaining} tentativas restantes.`);
}

if (response.status === 429) {
  const resetDate = new Date(reset * 1000);
  alert(`Muitas tentativas. Tente novamente às ${resetDate.toLocaleTimeString()}`);
}
```

---

## 🔍 Monitoramento

### Logs de Bloqueio

```javascript
// Em rateLimiter.js
handler: (req, res) => {
  logger.warn(`BRUTE FORCE BLOCKED: IP ${req.ip} - Email: ${req.body?.email}`);
  res.status(429).json({ ... });
}
```

**Log gerado:**
```json
{
  "level": "warn",
  "message": "BRUTE FORCE BLOCKED",
  "ip": "192.168.1.100",
  "email": "admin@example.com",
  "timestamp": "2026-02-17T10:30:00.000Z"
}
```

---

### Alertas de Segurança

Em produção, pode-se adicionar:

```javascript
handler: (req, res) => {
  // Log local
  logger.warn(`BRUTE FORCE: ${req.ip}`);
  
  // Enviar para SIEM
  sendToSIEM({ type: 'BRUTE_FORCE', ip: req.ip });
  
  // Alertar equipe
  if (isHighValueAccount(req.body.email)) {
    sendSlackAlert(`Ataque em conta admin: ${req.body.email}`);
  }
  
  // Notificar usuário
  sendEmail(req.body.email, 'Tentativas de login suspeitas');
  
  res.status(429).json({ ... });
}
```

---

## ⚡ Recursos Avançados

### Skip em Login Bem-Sucedido

```javascript
skipSuccessfulRequests: true
```

**Benefício:**
- Usuário que erra 4x e acerta na 5ª → Contador reseta
- Não bloqueia usuário legítimo permanentemente
- Atacante ainda limitado (não pode testar infinitamente)

---

### Identificação por IP

```javascript
keyGenerator: (req) => req.ip
```

**Opções:**
- Por IP: Bloqueia IP inteiro (pode afetar múltiplos usuários em NAT)
- Por IP + Email: Mais preciso (cada combinação tem limite próprio)
- Por Sessão: Para aplicações já autenticadas

---

### Banimento Progressivo

```javascript
// Aumentar tempo de bloqueio a cada violação
const violations = blockMap.get(ip) || 0;
const duration = 15 * 60 * 1000 * Math.pow(2, violations);

// 1ª vez: 15min
// 2ª vez: 30min
// 3ª vez: 1 hora
// 4ª vez: 2 horas
```

---

## ✅ Checklist

- [x] Rate limiter implementado em src/middlewares/rateLimiter.js
- [x] Login: 5 tentativas / 15 minutos
- [x] Cadastro: 3 tentativas / hora
- [x] Reset senha: 3 tentativas / hora
- [x] API geral: 100 requisições / 15 minutos
- [x] skipSuccessfulRequests: true (login)
- [x] Headers de rate limit (RateLimit-*)
- [x] Logging de tentativas bloqueadas
- [x] Mensagens claras para usuário
- [x] Documentação completa
- [x] Testes automatizados

---

## 📚 Documentação

- 📖 **[RATE_LIMITING.md](RATE_LIMITING.md)** - Documentação completa
- 🧪 **[examples/testRateLimiting.js](examples/testRateLimiting.js)** - Testes automatizados
- ⚙️ **[src/middlewares/rateLimiter.js](src/middlewares/rateLimiter.js)** - Implementação

---

## 💡 Resumo de 1 Minuto

### ⚠️ Problema
Brute force: Atacante testa milhares de senhas automaticamente

### ✅ Solução
Rate limiting: Limita a 5 tentativas / 15 minutos

### 🔢 Efetividade
- Sem rate limit: Senha quebrada em **17 minutos**
- Com rate limit: Senha quebrada em **5,7 ANOS**
- Redução: **99,99% nas tentativas**

### ⚙️ Configuração
```javascript
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,                    // 5 tentativas
  skipSuccessfulRequests: true
});
```

### 🎯 Resultado
- Ataque brute force torna-se **economicamente inviável**
- Senhas fracas tornam-se **temporariamente fortes**
- Senhas fortes tornam-se **impossíveis de quebrar**

**Testar:** `node examples/testRateLimiting.js`
