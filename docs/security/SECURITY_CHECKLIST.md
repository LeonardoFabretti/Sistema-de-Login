# ✅ CHECKLIST DE CORREÇÕES DE SEGURANÇA

**Data:** 17 de Fevereiro de 2026  
**Baseado em:** AUDITORIA_OWASP.md  
**Status:** ⚠️ Pendente

---

## 🔴 URGENTE - Implementar ANTES de Produção

### [ ] 1. Gerar Secrets Aleatórios

**Problema:** JWT_SECRET e JWT_REFRESH_SECRET estão com valores de exemplo (não aleatórios)

**Ação:**
```bash
# 1. Gerar secrets verdadeiramente aleatórios
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# 2. Atualizar .env com os valores gerados
# 3. NUNCA commitar .env no Git (verificar .gitignore)
```

**Verificação:**
- [ ] JWT_SECRET tem 128 caracteres hexadecimais
- [ ] JWT_REFRESH_SECRET é diferente do JWT_SECRET
- [ ] .env está no .gitignore
- [ ] Em produção, usar variáveis de ambiente (não .env)

---

### [ ] 2. Ativar Helmet (Headers HTTP Seguros)

**Problema:** Helmet está comentado em src/app.js

**Ação:**
```javascript
// src/app.js
const helmet = require('helmet'); // ✅ Descomentar

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  }
}));
```

**Verificação:**
- [ ] Helmet instalado (verificar package.json)
- [ ] Middleware ativado
- [ ] CSP configurado
- [ ] HSTS configurado
- [ ] Testar headers: `curl -I http://localhost:5000/health`

**Headers esperados:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'
```

---

### [ ] 3. Ativar CORS Configurado

**Problema:** CORS está comentado em src/app.js

**Ação:**
```javascript
// src/app.js
const cors = require('cors'); // ✅ Descomentar

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Verificação:**
- [ ] CORS configurado
- [ ] CORS_ORIGIN definido no .env
- [ ] Em produção: Atualizar CORS_ORIGIN para domínio real
- [ ] Testar preflight: `curl -X OPTIONS http://localhost:5000/api/auth/login`

---

### [ ] 4. Ativar Rate Limiter Global

**Problema:** Rate limiter global está comentado em src/app.js

**Ação:**
```javascript
// src/app.js
const { rateLimiter } = require('./middlewares/rateLimiter'); // ✅ Descomentar

app.use(rateLimiter); // ✅ Ativar
```

**Verificação:**
- [ ] Rate limiter global ativado
- [ ] Limites configurados: 100 req / 15 min
- [ ] Testar: Fazer 101 requests, 101ª deve retornar 429

---

### [ ] 5. Ativar XSS-Clean

**Problema:** XSS-Clean está comentado em src/app.js

**Ação:**
```javascript
// src/app.js
const xss = require('xss-clean'); // ✅ Descomentar

app.use(xss()); // ✅ Ativar
```

**Verificação:**
- [ ] xss-clean instalado
- [ ] Middleware ativado
- [ ] Testar: Enviar `<script>alert('XSS')</script>` em campo de texto
- [ ] Esperado: Caracteres HTML escapados automaticamente

---

### [ ] 6. Ativar Cookie Parser

**Problema:** Cookie parser está comentado em src/app.js

**Ação:**
```javascript
// src/app.js
const cookieParser = require('cookie-parser'); // ✅ Descomentar

app.use(cookieParser()); // ✅ Ativar
```

**Verificação:**
- [ ] cookie-parser instalado
- [ ] Middleware ativado
- [ ] Cookies sendo enviados corretamente em login

---

### [ ] 7. Ativar Rotas da Aplicação

**Problema:** Rotas estão comentadas em src/app.js

**Ação:**
```javascript
// src/app.js
const routes = require('./routes'); // ✅ Descomentar

app.use('/api', routes); // ✅ Ativar
```

**Verificação:**
- [ ] Rotas ativadas
- [ ] GET /api/health retorna 200
- [ ] POST /api/auth/register funciona
- [ ] POST /api/auth/login funciona

---

### [ ] 8. Ativar Error Handler

**Problema:** Error handler global está comentado em src/app.js

**Ação:**
```javascript
// src/app.js
const errorHandler = require('./middlewares/errorHandler'); // ✅ Descomentar

app.use(errorHandler); // ✅ Ativar (deve ser o ÚLTIMO middleware)
```

**Verificação:**
- [ ] Error handler ativado
- [ ] Erros retornam formato consistente
- [ ] Stack trace NÃO exposto em produção
- [ ] Testar: Forçar erro, verificar resposta

---

---

## 🟡 ALTA PRIORIDADE - Esta Semana

### [ ] 9. Configurar HTTPS em Produção

**Ação:**
```javascript
// src/app.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

**Verificação:**
- [ ] HTTP → HTTPS redirect configurado
- [ ] Certificado SSL válido (Railway/Heroku fazem automaticamente)
- [ ] Testar: http://seusite.com redireciona para https://seusite.com

---

### [ ] 10. Centralizar Logs

**Opção 1: Logtail (Gratuito até 100K logs/mês)**
```bash
npm install @logtail/node
```

```javascript
// src/utils/logger.js
const { Logtail } = require('@logtail/node');
const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

logger.add(new winston.transports.Stream({
  stream: logtail
}));
```

**Opção 2: ELK Stack (Self-hosted)**
```javascript
const { ElasticsearchTransport } = require('winston-elasticsearch');

logger.add(new ElasticsearchTransport({
  level: 'info',
  clientOpts: { node: process.env.ELASTICSEARCH_URL }
}));
```

**Verificação:**
- [ ] Serviço de logs escolhido
- [ ] Token/URL configurado no .env
- [ ] Logs aparecendo no dashboard
- [ ] Retenção configurada (90 dias recomendado)

---

### [ ] 11. Configurar Alertas de Segurança

**Slack:**
```javascript
const axios = require('axios');

async function sendSlackAlert(message) {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `🚨 ALERTA DE SEGURANÇA: ${message}`
  });
}

// Em rateLimiter.js
handler: (req, res) => {
  const message = `Brute force detectado: IP ${req.ip}`;
  logger.warn(message);
  sendSlackAlert(message); // ✅ Adicionar
  res.status(429).json({ ... });
}
```

**Email:**
```javascript
const nodemailer = require('nodemailer');

async function sendSecurityAlert(email, subject, body) {
  const transporter = nodemailer.createTransport({ ... });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: 'security@empresa.com',
    subject: `[SECURITY] ${subject}`,
    text: body
  });
}
```

**Verificação:**
- [ ] Webhook Slack configurado OU
- [ ] SMTP configurado para emails
- [ ] Alerta de brute force testado
- [ ] Alerta de login suspeito testado

---

### [ ] 12. CI/CD com Security Scans

**GitHub Actions:**
```yaml
# .github/workflows/security.yml
name: Security Audits

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Segunda-feira 00:00

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Check for outdated packages
        run: npm outdated || true
      
      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**Verificação:**
- [ ] Workflow criado
- [ ] Secrets configurados (SNYK_TOKEN)
- [ ] Pipeline rodando em push
- [ ] Notificações de vulnerabilidades funcionando

---

### [ ] 13. Implementar MFA para Admins

**Instalar:**
```bash
npm install speakeasy qrcode
```

**Implementar:**
```javascript
// src/models/User.js - Adicionar campo
CREATE TABLE users (
  ...
  mfa_secret TEXT,
  mfa_enabled BOOLEAN DEFAULT false
);

// src/services/authService.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Gerar secret
const generateMFASecret = async (userId, email) => {
  const secret = speakeasy.generateSecret({
    name: `SecureAuthSystem (${email})`,
    length: 32
  });
  
  await User.updateMFASecret(userId, secret.base32);
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  return { secret: secret.base32, qrCode };
};

// Validar código
const verifyMFACode = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Aceita códigos ±2 intervalos de tempo
  });
};
```

**Verificação:**
- [ ] Campos MFA adicionados ao banco
- [ ] Endpoint /api/auth/mfa/setup implementado
- [ ] Endpoint /api/auth/mfa/verify implementado
- [ ] QR code gerado corretamente
- [ ] Google Authenticator lê o QR code
- [ ] Código TOTP validado corretamente
- [ ] MFA obrigatório para admins

---

### [ ] 14. Rotação de Logs

**Implementar:**
```bash
npm install winston-daily-rotate-file
```

```javascript
// src/utils/logger.js
const DailyRotateFile = require('winston-daily-rotate-file');

logger.add(new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '90d' // LGPD: Manter 90 dias
}));

logger.add(new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '90d'
}));
```

**Verificação:**
- [ ] Logs rotacionados diariamente
- [ ] Logs antigos comprimidos (.gz)
- [ ] Logs >90 dias deletados automaticamente
- [ ] Espaço em disco monitorado

---

---

## 🟢 MÉDIA PRIORIDADE - Este Mês

### [ ] 15. Threat Modeling

**Criar:** `THREAT_MODEL.md`

**Conteúdo:**
```markdown
# Threat Model

## Assets
- Banco de dados PostgreSQL (senhas, emails, dados pessoais)
- JWT Secrets (autenticação)
- Logs de auditoria

## Trust Boundaries
1. Internet ↔ Load Balancer (HTTPS)
2. Load Balancer ↔ App Server (autenticação)
3. App Server ↔ Database (prepared statements)

## Threats (STRIDE)
- Spoofing: JWT forjado → Mitigado por HMAC-SHA256
- Tampering: Modificação de dados → Mitigado por prepared statements
- Repudiation: Negar ações → Mitigado por logs de auditoria
- Information Disclosure: Vazamento de dados → Mitigado por bcrypt
- Denial of Service: Sobrecarga → Mitigado por rate limiting
- Elevation of Privilege: Admin sem permissão → Mitigado por RBAC
```

**Verificação:**
- [ ] Documento criado
- [ ] Assets identificados
- [ ] Trust boundaries mapeadas
- [ ] Ameaças classificadas (STRIDE)
- [ ] Mitigações documentadas

---

### [ ] 16. Detecção de Viagem Impossível

**Instalar:**
```bash
npm install geoip-lite
```

**Implementar:**
```javascript
const geoip = require('geoip-lite');

const detectImpossibleTravel = async (userId, currentIP) => {
  const lastLogin = await User.getLastLogin(userId);
  
  if (!lastLogin) return false;
  
  const lastGeo = geoip.lookup(lastLogin.ip);
  const currentGeo = geoip.lookup(currentIP);
  
  if (!lastGeo || !currentGeo) return false;
  
  // Calcular distância (Haversine formula)
  const distance = calculateDistance(
    lastGeo.ll[0], lastGeo.ll[1],
    currentGeo.ll[0], currentGeo.ll[1]
  );
  
  const timeDiff = Date.now() - new Date(lastLogin.timestamp);
  const hoursElapsed = timeDiff / (1000 * 60 * 60);
  
  // Se >500km em <1 hora = Impossível
  if (distance > 500 && hoursElapsed < 1) {
    return {
      impossible: true,
      distance,
      hoursElapsed,
      lastLocation: `${lastGeo.city}, ${lastGeo.country}`,
      currentLocation: `${currentGeo.city}, ${currentGeo.country}`
    };
  }
  
  return false;
};
```

**Verificação:**
- [ ] Geolocalização funcionando
- [ ] Distância calculada corretamente
- [ ] Alerta enviado quando detectado
- [ ] Exigir MFA em viagens impossíveis

---

### [ ] 17. Notificação de Login Suspeito

**Implementar:**
```javascript
const sendLoginNotification = async (user, ip, location) => {
  await sendEmail(user.email, {
    subject: 'Novo login detectado na sua conta',
    html: `
      <h2>Novo login detectado</h2>
      <p>Um login foi realizado na sua conta:</p>
      <ul>
        <li>Data: ${new Date().toLocaleString('pt-BR')}</li>
        <li>IP: ${ip}</li>
        <li>Localização: ${location}</li>
      </ul>
      <p>Foi você? Se não, <a href="${process.env.APP_URL}/reset-password">altere sua senha imediatamente</a>.</p>
    `
  });
};

// Em authService.js após login bem-sucedido
if (!user.known_ips.includes(req.ip)) {
  sendLoginNotification(user, req.ip, location);
}
```

**Verificação:**
- [ ] Email de notificação implementado
- [ ] Link para reset de senha incluído
- [ ] Localização geográfica incluída
- [ ] Usuários recebendo notificações

---

### [ ] 18. Verificar Integridade de Dependencies

**Implementar:**
```bash
# Gerar package-lock.json com SRI
npm install --package-lock-only

# Em CI/CD, usar npm ci ao invés de npm install
npm ci --ignore-scripts
```

**Adicionar ao package.json:**
```json
"scripts": {
  "preinstall": "npx npm-force-resolutions",
  "audit:fix": "npm audit fix",
  "audit:check": "npm audit --audit-level=moderate"
}
```

**Verificação:**
- [ ] package-lock.json committed
- [ ] CI/CD usa `npm ci`
- [ ] Scripts de auditoria configurados
- [ ] Dependências verificadas semanalmente

---

---

## 📊 PROGRESSO GERAL

**Urgente (8 itens):**
- [ ] 0/8 completos (0%)

**Alta Prioridade (6 itens):**
- [ ] 0/6 completos (0%)

**Média Prioridade (4 itens):**
- [ ] 0/4 completos (0%)

**Total:**
- [ ] 0/18 completos (0%)

---

## 🎯 Meta para Produção

**Mínimo aceitável:**
- ✅ Todos 8 itens URGENTES completos
- ✅ 4/6 itens ALTA prioridade completos
- ✅ Auditoria de segurança revisada

**Ideal:**
- ✅ Todos 18 itens completos
- ✅ Pentest executado
- ✅ Certificação de segurança obtida

---

## 📅 Cronograma Recomendado

**Hoje (Dia 1):**
- Item 1: Gerar secrets ✅
- Item 2-8: Ativar middlewares ✅
- **Meta: Sistema seguro para desenvolvimento**

**Esta Semana (Dias 2-7):**
- Item 9: HTTPS
- Item 10: Centralizar logs
- Item 11: Alertas
- Item 12: CI/CD
- **Meta: Sistema pronto para staging**

**Este Mês (Dias 8-30):**
- Item 13: MFA
- Item 14: Rotação de logs
- Item 15-18: Melhorias avançadas
- **Meta: Sistema pronto para produção**

---

**Última atualização:** 17/02/2026  
**Responsável:** [SEU NOME]  
**Próxima revisão:** [DATA]
