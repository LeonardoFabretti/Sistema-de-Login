# 📚 Índice da Documentação

Guia completo de navegação para toda a documentação do projeto.

---

## 🚀 Início Rápido

**Primeiro acesso?** Comece aqui:

1. [README.md](README.md) - Visão geral do projeto
2. [QUICK_START.md](QUICK_START.md) - Configure em 5 minutos
3. [docs/guides/POSTGRESQL.md](docs/guides/POSTGRESQL.md) - Setup do banco de dados

---

## 📖 Documentação por Categoria

### 🔒 Segurança

**Documentação completa sobre segurança, autenticação e proteções.**

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| [docs/security/SECURITY.md](docs/security/SECURITY.md) | **Guia Completo de Segurança** - OWASP Top 10, JWT, Rate Limiting, Proteção de Rotas | ~800 |
| [docs/security/ACCESS_CONTROL.md](docs/security/ACCESS_CONTROL.md) | Controle de Acesso (RBAC) e Proteção IDOR | ~850 |
| [docs/security/SECURITY_CHECKLIST.md](docs/security/SECURITY_CHECKLIST.md) | Checklist de Segurança Pré-Deploy | ~660 |

**Principais tópicos:**
- ✅ Auditoria OWASP Top 10 (nota 8.7/10)
- ✅ Autenticação JWT (validação em 6 passos)
- ✅ Rate Limiting (99.99% proteção brute force)
- ✅ RBAC (Role-Based Access Control)
- ✅ Proteção SQL Injection (100%)
- ✅ Bcrypt com 12 rounds

---

### 🛠️ Guias Técnicos

**Tutoriais e guias de implementação.**

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| [docs/guides/POSTGRESQL.md](docs/guides/POSTGRESQL.md) | **PostgreSQL Completo** - Railway, schema, queries, troubleshooting | ~400 |
| [docs/guides/INTEGRATION.md](docs/guides/INTEGRATION.md) | Integração com API - JavaScript e React | ~1276 |
| [docs/guides/USER_MODEL.md](docs/guides/USER_MODEL.md) | Documentação do Modelo User | ~495 |
| [docs/guides/TESTING.md](docs/guides/TESTING.md) | Guia de Testes | ~360 |

**Principais tópicos:**
- 🐘 PostgreSQL no Railway (SSL, connection pooling)
- 🔌 Integração frontend/backend
- 📊 Schema do banco de dados
- 🧪 Testes automatizados e manuais

---

### 📊 Monitoramento

**Logs, auditoria e compliance.**

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| [docs/monitoring/AUDIT_LOGS.md](docs/monitoring/AUDIT_LOGS.md) | **Sistema de Logs** - Auditoria, LGPD/GDPR, análise de padrões suspeitos | ~600 |

**Principais tópicos:**
- 📝 Logs de login (sucesso/falha)
- 🔍 Detecção de ataques (brute force, credential stuffing)
- ⚖️ Compliance LGPD/GDPR
- 🚨 Análise de padrões suspeitos

---

### 🎨 Frontend & UX

**Interfaces web e decisões de design.**

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| [public/README.md](public/README.md) | Documentação das Interfaces Web | ~418 |
| [public/docs/UX_DECISIONS.md](public/docs/UX_DECISIONS.md) | **Decisões de UX/UI** - Login + Cadastro (com dados de pesquisa) | ~800 |

**Principais tópicos:**
- 🎨 Paleta de cores (Roxo/Índigo)
- ♿ Acessibilidade WCAG 2.1 AAA
- 📱 Mobile-first design
- 🔐 Toggle mostrar/ocultar senha
- 📊 Indicador de força de senha
- ⚡ Performance (Lighthouse 95+)

---

### ⚛️ React

**Projeto React separado.**

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| [react-login/README.md](react-login/README.md) | Documentação do Sistema React | ~592 |
| [react-login/ARCHITECTURE.md](react-login/ARCHITECTURE.md) | Arquitetura React Completa | ~891 |

**Principais tópicos:**
- 🏗️ Arquitetura de componentes
- 🪝 Custom hooks (useAuth, useForm)
- 🌐 Integração com API
- 🎯 Context API para autenticação

---

## 🗂️ Estrutura de Arquivos

### Backend (API)

```
src/
├── config/
│   ├── database.js          # Conexão PostgreSQL
│   ├── jwt.js               # Configuração JWT
│   └── security.js          # Políticas de segurança
├── middlewares/
│   ├── auth.js              # protect, restrictTo, checkOwnership
│   ├── rateLimiter.js       # Rate limiting por rota
│   ├── validateInput.js     # Validação Joi
│   └── errorHandler.js      # Tratamento global de erros
├── models/
│   └── User.js              # Modelo de usuário
├── controllers/
│   └── authController.js    # Lógica HTTP
├── services/
│   └── authService.js       # Lógica de negócio
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   └── index.js             # Agregador
├── validators/
│   └── authValidator.js     # Schemas Joi
├── utils/
│   ├── logger.js            # Winston logger
│   └── constants.js         # Constantes
└── app.js                   # Configuração Express
```

### Frontend (Interfaces Web)

```
public/
├── login.html               # Página de login
├── register.html            # Página de cadastro
├── dashboard.html           # Dashboard
├── css/
│   ├── login.css            # Estilos login
│   └── register.css         # Estilos cadastro
└── js/
    ├── login.js             # Validação login
    └── register.js          # Validação cadastro
```

### Banco de Dados

```
database/
└── schema.sql               # Schema PostgreSQL (users + refresh_tokens)
```

### Testes

```
tests/
├── integration/
│   └── auth.test.js         # Testes de integração
└── unit/
    └── authService.test.js  # Testes unitários
```

### Scripts Utilitários

```
scripts/
├── testConnection.js        # Teste de conexão DB
└── testUserModel.js         # Teste modelo User
```

### Exemplos de Uso

```
examples/
├── accessControlExamples.js # Exemplos RBAC
├── authLogs.js              # Exemplos de logs
├── databaseUsage.js         # Exemplos de queries
├── jwtUsage.js              # Exemplos JWT
├── protectedRoutes.js       # Rotas protegidas
├── testAccessControl.js     # Teste controle acesso
├── testLoginRoute.js        # Teste rota login
├── testRateLimiting.js      # Teste rate limiting
└── testRegisterRoute.js     # Teste rota cadastro
```

---

## 📚 Documentação (Organizada)

```
docs/
├── security/
│   ├── SECURITY.md              # Guia completo de segurança
│   ├── ACCESS_CONTROL.md        # RBAC e IDOR
│   └── SECURITY_CHECKLIST.md    # Checklist pré-deploy
├── guides/
│   ├── POSTGRESQL.md            # Setup PostgreSQL
│   ├── INTEGRATION.md           # Integração API
│   ├── USER_MODEL.md            # Modelo User
│   └── TESTING.md               # Guia de testes
└── monitoring/
    └── AUDIT_LOGS.md            # Logs e auditoria
```

---

## 🎯 Fluxos Principais

### 1. Fluxo de Autenticação

```
1. Usuário acessa /login.html
2. Digita email + senha
3. Frontend valida formato
4. POST /api/auth/login
5. Backend:
   - Rate limiting (5/15min)
   - Valida input (Joi)
   - Busca usuário no DB
   - Compara senha (bcrypt)
   - Gera JWT tokens
   - Registra log
6. Frontend:
   - Armazena tokens
   - Redireciona para /dashboard.html
```

**Documentação:** [docs/security/SECURITY.md](docs/security/SECURITY.md#-segurança-de-rotas)

### 2. Fluxo de Cadastro

```
1. Usuário acessa /register.html
2. Preenche formulário
3. Frontend valida:
   - Nome completo (mín 2 palavras)
   - Email válido
   - Senha forte (5 requisitos)
   - Confirmação de senha
4. POST /api/auth/register
5. Backend:
   - Rate limiting (3/hora)
   - Valida input
   - Verifica email duplicado
   - Hash senha (bcrypt 12 rounds)
   - Cria usuário no DB
   - Gera JWT tokens
   - Registra log
6. Frontend:
   - Armazena tokens
   - Redireciona para /dashboard.html
```

**Documentação:** [docs/security/SECURITY.md](docs/security/SECURITY.md#cadastro)

### 3. Fluxo de Acesso a Rota Protegida

```
1. Frontend faz GET /api/auth/me
2. Envia JWT no header:
   Authorization: Bearer <token>
3. Backend (middleware protect):
   - Extrai token
   - Verifica assinatura HMAC-SHA256
   - Verifica expiração
   - Busca usuário no DB
   - Verifica se conta ativa
   - Verifica se senha mudou
4. Se válido: retorna dados
5. Se inválido: HTTP 401
```

**Documentação:** [docs/security/SECURITY.md](docs/security/SECURITY.md#-autenticação-jwt)

---

## 🔑 Variáveis de Ambiente

**Arquivo:** `.env` (⚠️ NUNCA commitar!)

```env
# Servidor
NODE_ENV=production
PORT=5000

# PostgreSQL (Railway)
DATABASE_URL=postgresql://postgres:senha@host.railway.app:6543/railway

# JWT Secrets (gerar aleatórios!)
JWT_SECRET=<64+ caracteres aleatórios>
JWT_REFRESH_SECRET=<64+ caracteres aleatórios>
JWT_EXPIRE=30m
JWT_REFRESH_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://seuapp.com
```

**Como gerar secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Documentação:** [docs/guides/POSTGRESQL.md](docs/guides/POSTGRESQL.md#-variáveis-de-ambiente)

---

## 📊 API Endpoints

### Autenticação

| Método | Endpoint | Descrição | Rate Limit | Auth |
|--------|----------|-----------|------------|------|
| `POST` | `/api/auth/register` | Cadastrar usuário | 3/hora | ❌ |
| `POST` | `/api/auth/login` | Login | 5/15min | ❌ |
| `POST` | `/api/auth/logout` | Logout | - | ✅ |
| `POST` | `/api/auth/refresh` | Renovar token | - | ❌ |
| `GET` | `/api/auth/me` | Dados do usuário | - | ✅ |
| `PUT` | `/api/auth/update-password` | Atualizar senha | - | ✅ |

### Usuários (Admin)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/api/users` | Listar usuários | `admin` |
| `GET` | `/api/users/:id` | Buscar por ID | `admin` |
| `PUT` | `/api/users/:id` | Atualizar | `admin` |
| `DELETE` | `/api/users/:id` | Deletar | `admin` |

**Documentação completa:** [README.md](README.md#-api-endpoints)

---

## 🧪 Como Testar

### Testes Automatizados

```bash
# Todos os testes
npm test

# Com coverage
npm test -- --coverage

# Modo watch
npm run test:watch
```

### Testes Manuais

```bash
# Conexão PostgreSQL
npm run db:test

# Modelo User
npm run test:user

# Interface web
npm run dev
# Acesse: http://localhost:5000/login.html
```

**Documentação:** [docs/guides/TESTING.md](docs/guides/TESTING.md)

---

## 🚀 Deploy

### Railway (Recomendado)

1. Criar conta em [railway.app](https://railway.app/)
2. Adicionar PostgreSQL
3. Adicionar aplicação (conectar GitHub)
4. Configurar variáveis de ambiente
5. Executar migrations
6. Deploy automático via Git push

**Documentação:** [README.md](README.md#-deploy)

---

## 📈 Métricas de Segurança

### OWASP Top 10 - Pontuação

| Categoria | Nota | Status |
|-----------|------|--------|
| A01 - Broken Access Control | 9/10 | ✅ Forte |
| A02 - Cryptographic Failures | 9/10 | ✅ Forte |
| A03 - Injection | 10/10 | ✅ Perfeito |
| A04 - Insecure Design | 9/10 | ✅ Forte |
| A07 - Authentication Failures | 9/10 | ✅ Forte |
| A09 - Logging Failures | 9/10 | ✅ Forte |
| **GERAL** | **8.7/10** | ✅ Aprovado |

**Documentação:** [docs/security/SECURITY.md](docs/security/SECURITY.md#-auditoria-owasp-top-10)

---

## 🎯 Checklist de Produção

Antes de colocar em produção:

**Obrigatório:**
- [ ] `JWT_SECRET` aleatório (64+ chars)
- [ ] `JWT_REFRESH_SECRET` aleatório
- [ ] `DATABASE_URL` do Railway
- [ ] HTTPS configurado
- [ ] Helmet middleware ativado
- [ ] CORS com origem específica
- [ ] Rate limiting ativo
- [ ] Logs funcionando

**Recomendado:**
- [ ] Monitoramento externo
- [ ] Backup automático DB
- [ ] Renovação de secrets (90 dias)
- [ ] Pentest
- [ ] `npm audit`

**Documentação:** [docs/security/SECURITY_CHECKLIST.md](docs/security/SECURITY_CHECKLIST.md)

---

## 📚 Recursos Externos

### Segurança
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

### PostgreSQL
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [node-postgres (pg)](https://node-postgres.com/)
- [Railway Docs](https://docs.railway.app/)

### UX/UI
- [Nielsen Norman Group](https://www.nngroup.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Baymard Institute](https://baymard.com/)

---

## 🤝 Manutenção

### Atualizar Documentação

Ao adicionar novas features, atualize:

1. [README.md](README.md) - Se feature é importante
2. [docs/security/SECURITY.md](docs/security/SECURITY.md) - Se relacionado a segurança
3. [docs/guides/INTEGRATION.md](docs/guides/INTEGRATION.md) - Se muda API
4. Este arquivo - Adicione à categoria apropriada

### Versionamento

Use [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Mudanças breaking
- **MINOR** (0.1.0): Novas features compatíveis
- **PATCH** (0.0.1): Bug fixes

---

## 📞 Suporte

- 📧 **Issues:** [GitHub Issues](https://github.com/LeonardoFabretti/Sistema-de-Login/issues)
- 📖 **Documentação:** Consulte os arquivos listados acima
- 🔒 **Segurança:** Leia [docs/security/SECURITY.md](docs/security/SECURITY.md)

---

**Última atualização:** 17 de Fevereiro de 2026  
**Versão do Projeto:** 1.0.0
