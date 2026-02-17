<div align="center">

# 🔐 Secure Auth System

**Sistema de autenticação enterprise-grade com Node.js, Express e PostgreSQL**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E?logo=railway&logoColor=white)](https://railway.app/)
[![Security](https://img.shields.io/badge/OWASP-8.7/10-success)](AUDITORIA_OWASP.md)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

[**🚀 Quick Start**](#-quick-start) · [**📖 Documentação**](#-documentação) · [**🔒 Segurança**](#-segurança) · [**🎨 Interface**](#-interface-web)

---

### ⭐ Destaques

✅ **PostgreSQL no Railway** - Banco de dados em nuvem configurado via `DATABASE_URL`  
✅ **OWASP Top 10 Compliance** - Auditoria completa com nota **8.7/10**  
✅ **99.99% Proteção Brute Force** - Rate limiting matemático comprovado  
✅ **Zero SQL Injection** - 100% das queries com prepared statements  
✅ **LGPD Compliant** - Logs de auditoria completos  

</div>

---

## �️ Navegação Rápida

**Novo no projeto?** Comece aqui:

📑 **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Índice completo de toda documentação organizada por categoria  
🎯 **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Visão geral do projeto com diagramas visuais da arquitetura

---

## �📋 Índice

- [Recursos](#-recursos)
- [Quick Start](#-quick-start)
- [Interface Web](#-interface-web)
- [PostgreSQL Railway](#-postgresql-railway)
- [Segurança](#-segurança)
- [API Endpoints](#-api-endpoints)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Deploy](#-deploy)
- [Testes](#-testes)
- [Troubleshooting](#-troubleshooting)
- [Documentação Completa](#-documentação)

---

## ✨ Recursos

### 🔐 Autenticação e Autorização

- **JWT** com access + refresh tokens (rotation automática)
- **Bcrypt** com 12 rounds (4096 iterações)
- **RBAC** (Role-Based Access Control) - `admin`, `user`, `moderator`
- **IDOR Protection** (Insecure Direct Object Reference)
- **HttpOnly cookies** (proteção XSS)

### 🛡️ Segurança (OWASP Top 10)

| Categoria | Nota | Status |
|-----------|------|--------|
| **A01** Broken Access Control | 9/10 | ✅ RBAC + checkOwnership |
| **A02** Cryptographic Failures | 9/10 | ✅ Bcrypt + HMAC-SHA256 |
| **A03** Injection | 10/10 | ✅ Prepared statements 100% |
| **A04** Insecure Design | 9/10 | ✅ Rate limiting + defaults seguros |
| **A07** Authentication Failures | 9/10 | ✅ Política de senha forte |
| **A09** Logging Failures | 9/10 | ✅ Logs LGPD/GDPR compliant |

[📊 Ver auditoria completa](docs/security/SECURITY.md#-auditoria-owasp-top-10)

### 🚦 Rate Limiting

- **Login**: 5 tentativas / 15 minutos
- **Cadastro**: 3 tentativas / hora
- **Reset de senha**: 3 tentativas / hora
- **API geral**: 100 requests / 15 minutos

**Impacto**: Redução de 99.99% em ataques brute force ([análise matemática](RATE_LIMITING.md))

### 📝 Logs de Auditoria

- Login bem-sucedido (email, IP, timestamp)
- Login falhou (detecta tentativas de brute force)
- Novo usuário registrado
- Senha atualizada
- **Formato**: Winston com rotação diária

### 🐘 Banco de Dados

- PostgreSQL 15+ (Railway)
- Connection pooling otimizado
- Prepared statements (100% proteção SQL injection)
- SSL em produção
- Migrações versionadas

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 15+ ([Railway](https://railway.app/) recomendado)
- npm ou yarn

### Instalação (5 minutos)

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd Login

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Edite o .env com suas credenciais
# Especialmente DATABASE_URL do Railway
# Gere JWT_SECRET aleatório (comando abaixo)

# 5. Gerar secrets seguros
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# 6. Crie as tabelas no banco de dados
psql $DATABASE_URL -f database/schema.sql

# 7. Teste a conexão
npm run db:test

# 8. Inicie o servidor
npm run dev

# 9. Acesse a interface
# http://localhost:5000/login.html
```

**✅ Servidor rodando em:** `http://localhost:5000`

---

## 🎨 Interface Web

O projeto inclui **interface moderna e profissional** para autenticação de usuários.

### 🔑 Página de Login

**Características:**
- Design moderno com gradiente animado
- Validação em tempo real
- Toggle "Mostrar/Ocultar senha"
- Rate limiting visual com contador
- Mensagens de erro amigáveis
- WCAG 2.1 AAA Compliant (acessibilidade)

**Arquivos:**
- [public/login.html](public/login.html)
- [public/css/login.css](public/css/login.css)
- [public/js/login.js](public/js/login.js)

**Decisões de UX/UI:** [public/UX_UI_DECISIONS.md](public/UX_UI_DECISIONS.md)

### 📝 Página de Cadastro

**Características:**
- Validação de senha forte (5 requisitos visuais)
- Indicador de força de senha (barra colorida)
- Confirmação de senha bidirecional
- Checkbox para termos de uso
- Feedback visual imediato

**Arquivos:**
- [public/register.html](public/register.html)
- [public/css/register.css](public/css/register.css)
- [public/js/register.js](public/js/register.js)

**Boas práticas UX:** [public/REGISTER_UX.md](public/REGISTER_UX.md)

### 🚀 Como Acessar

**Opção 1: Com o backend rodando**

```bash
npm run dev
# Acesse: http://localhost:5000/login.html
```

**Opção 2: Servidor local separado**

```bash
cd public
npx http-server -p 8000
# Acesse: http://localhost:8000/login.html
# ATENÇÃO: Configure CORS no backend
```

### 🔌 Integração com API

Guia completo de integração com JavaScript e React:

- **JavaScript puro**: [INTEGRATION.md](INTEGRATION.md)
- **React**: [react-login/ARCHITECTURE.md](react-login/ARCHITECTURE.md)

---

## 🐘 PostgreSQL Railway

Este projeto usa **PostgreSQL hospedado no Railway**.

### Por que Railway?

✅ Gratuito (512MB RAM)  
✅ Zero Configuração  
✅ SSL Automático  
✅ Backups automáticos  
✅ Métricas integradas  

### Como Configurar

#### 1. Criar Banco no Railway

1. Acesse [railway.app](https://railway.app/)
2. Crie um novo projeto
3. Adicione PostgreSQL
4. Copie a `DATABASE_URL` gerada

#### 2. Configurar no `.env`

```env
DATABASE_URL=postgresql://postgres:senha@postgres.railway.internal:5432/railway
```

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.env` no Git!

#### 3. Criar Tabelas

```bash
psql $DATABASE_URL -f database/schema.sql
```

#### 4. Verificar

```bash
npm run db:test
```

**Saída esperada:**
```
✅ Conexão com PostgreSQL bem-sucedida!
ℹ️ Database: railway
ℹ️ Host: postgres.railway.internal
```

**Documentação completa:** [docs/guides/POSTGRESQL.md](docs/guides/POSTGRESQL.md)

---

## 🔒 Segurança

### Práticas Implementadas

#### 1. Proteção SQL Injection (10/10)

✅ **100% das queries** usam prepared statements:

```javascript
// ✅ SEGURO - Prepared statement
const user = await query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

#### 2. Autenticação JWT (9/10)

Validação em 6 passos:

1. Extrair token (header OR cookie)
2. Verificar assinatura HMAC-SHA256
3. Verificar expiração (30 min)
4. Buscar usuário no banco
5. Verificar se conta está ativa
6. Verificar se senha mudou

**Documentação:** [docs/security/SECURITY.md](docs/security/SECURITY.md#-autenticação-jwt)

#### 3. Rate Limiting (99.99% proteção)

- **Sem rate limit**: Senha fraca quebrada em **17 minutos**
- **COM rate limit**: Mesma senha leva **5,7 ANOS**

**Análise matemática:** [docs/security/SECURITY.md](docs/security/SECURITY.md#-rate-limiting)

#### 4. Bcrypt 12 Rounds (9/10)

```javascript
// 2^12 = 4.096 iterações
// ~250ms por tentativa
// Brute force de 1 bilhão de senhas = 7,9 ANOS
```

#### 5. RBAC e IDOR Protection (9/10)

```javascript
// Apenas admins
router.get('/admin/users', protect, restrictTo('admin'), getAllUsers);

// Usuários só editam próprios dados
router.put('/me', protect, checkOwnership('user'), updateMe);
```

**Documentação:** [docs/security/ACCESS_CONTROL.md](docs/security/ACCESS_CONTROL.md)

#### 6. Logs de Auditoria (9/10)

```javascript
logger.info('[AUTH] Login bem-sucedido | Email: usuario@example.com | IP: 192.168.1.1');
logger.warn('[AUTH] Login falhou | Email: usuario@example.com | Tentativa: 3/5');
```

**Exemplos:** [docs/monitoring/AUDIT_LOGS.md](docs/monitoring/AUDIT_LOGS.md)

### Auditoria OWASP

**Nota geral: 8.7/10** ✅

[📊 Ver relatório completo](docs/security/SECURITY.md#-auditoria-owasp-top-10)

---

## 📚 API Endpoints

### Autenticação

| Método | Endpoint | Descrição | Rate Limit | Auth |
|--------|----------|-----------|------------|------|
| `POST` | `/api/auth/register` | Cadastrar usuário | 3/hora | Pública |
| `POST` | `/api/auth/login` | Login | 5/15min | Pública |
| `POST` | `/api/auth/logout` | Logout | - | Privada |
| `POST` | `/api/auth/refresh` | Renovar token | - | Pública |
| `GET` | `/api/auth/me` | Dados do usuário | - | Privada |
| `PUT` | `/api/auth/update-password` | Atualizar senha | - | Privada |

### Usuários (Admin)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/api/users` | Listar usuários | `admin` |
| `GET` | `/api/users/:id` | Buscar por ID | `admin` |
| `PUT` | `/api/users/:id` | Atualizar | `admin` |
| `DELETE` | `/api/users/:id` | Deletar | `admin` |

### Exemplos de Uso

#### Cadastrar Usuário

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "SenhaForte@123"
  }'
```

**Response (201):**

```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "João Silva",
      "email": "joao@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "SenhaForte@123"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "João Silva",
      "email": "joao@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Códigos de Erro

- `200` - OK
- `201` - Created
- `400` - Bad Request (validação falhou)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found
- `409` - Conflict (email duplicado)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 📁 Estrutura do Projeto

```
Login/
├── public/                       # Interface Web
│   ├── login.html
│   ├── register.html
│   ├── css/
│   │   ├── login.css
│   │   └── register.css
│   └── js/
│       ├── login.js
│       └── register.js
├── src/                          # Backend (API)
│   ├── config/
│   │   ├── database.js           # Conexão PostgreSQL
│   │   ├── jwt.js                # Configuração JWT
│   │   └── security.js           # Políticas de segurança
│   ├── middlewares/
│   │   ├── auth.js               # protect, restrictTo, checkOwnership
│   │   ├── rateLimiter.js        # Rate limiting por rota
│   │   ├── validateInput.js      # Validação Joi
│   │   └── errorHandler.js       # Tratamento global de erros
│   ├── models/
│   │   └── User.js               # Modelo de usuário
│   ├── controllers/
│   │   └── authController.js     # Lógica HTTP
│   ├── services/
│   │   └── authService.js        # Lógica de negócio
│   ├── routes/
│   │   ├── auth.js               # Rotas de autenticação
│   │   └── index.js              # Agregador de rotas
│   ├── validators/
│   │   └── authValidator.js      # Schemas Joi
│   ├── utils/
│   │   ├── logger.js             # Winston logger
│   │   └── constants.js          # Constantes
│   └── app.js                    # Configuração Express
├── database/
│   └── schema.sql                # Schema PostgreSQL
├── tests/
│   └── auth.test.js              # Testes Jest
├── .env                          # Variáveis de ambiente
├── server.js                     # Entry point
└── package.json
```

---

## 🚀 Deploy

### Railway (Recomendado)

#### 1. Criar Projeto

1. Acesse [railway.app](https://railway.app/)
2. Faça login com GitHub
3. Crie novo projeto

#### 2. Adicionar PostgreSQL

1. "New" → "Database" → "PostgreSQL"
2. Copie a `DATABASE_URL`

#### 3. Adicionar Aplicação

1. "New" → "GitHub Repo"
2. Selecione seu repositório
3. Railway detecta Node.js automaticamente

#### 4. Configurar Variáveis

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<copiar-do-railway>
JWT_SECRET=<gerar-aleatorio>
JWT_REFRESH_SECRET=<gerar-aleatorio>
CORS_ORIGIN=https://seuapp.com
```

#### 5. Executar Migrations

```bash
railway connect
psql $DATABASE_URL -f database/schema.sql
```

#### 6. Deploy

```bash
git push origin main
```

**URL final:** `https://seu-app.up.railway.app`

### Outras opções

- **Heroku**: Guia em [QUICK_START.md](QUICK_START.md)
- **Docker**: Dockerfile incluído no repositório

---

## 🧪 Testes

### Testes Automatizados

```bash
# Executar todos os testes
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
```

### Testar Interface

```bash
npm run dev
# Acesse: http://localhost:5000/login.html

# Credenciais de teste:
# Email: joao@example.com
# Senha: SenhaForte@123
```

---

## 🔧 Troubleshooting

### "Connection refused" ao conectar PostgreSQL

```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT version();"
```

### "JWT malformed" ou "invalid token"

```bash
# Renovar token
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "SEU_REFRESH_TOKEN"}'
```

### "Too many requests" (429)

Aguardar o tempo de janela (15 minutos) ou aumentar limite em desenvolvimento:

```env
RATE_LIMIT_MAX_REQUESTS=1000
```

### Queries lentas

```sql
-- Criar índices (já incluídos em schema.sql)
CREATE INDEX idx_users_email ON users(email);

-- Analisar query
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'joao@example.com';
```

**Mais soluções:** [docs/guides/TESTING.md](docs/guides/TESTING.md)

---

## 📖 Documentação

### � Comece Aqui

- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - 📑 **Índice navegável completo** de toda documentação
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - 🎯 **Visão geral visual** com diagramas de arquitetura

### �🔒 Segurança

- [docs/security/SECURITY.md](docs/security/SECURITY.md) - Guia completo de segurança (OWASP, JWT, Rate Limiting)
- [docs/security/ACCESS_CONTROL.md](docs/security/ACCESS_CONTROL.md) - Controle de permissões e RBAC
- [docs/security/SECURITY_CHECKLIST.md](docs/security/SECURITY_CHECKLIST.md) - Checklist de segurança pré-deploy

### 📊 Auditoria e Logs

- [docs/monitoring/AUDIT_LOGS.md](docs/monitoring/AUDIT_LOGS.md) - Sistema completo de logs e auditoria

### 🛠️ Guias Técnicos

- [docs/guides/POSTGRESQL.md](docs/guides/POSTGRESQL.md) - Configuração PostgreSQL completa
- [docs/guides/INTEGRATION.md](docs/guides/INTEGRATION.md) - Integração com API (HTML + React)
- [docs/guides/USER_MODEL.md](docs/guides/USER_MODEL.md) - Documentação do modelo User
- [docs/guides/TESTING.md](docs/guides/TESTING.md) - Guia de testes
- [QUICK_START.md](QUICK_START.md) - Início rápido (5 minutos)

### 🎨 Frontend e Integração

- [public/docs/UX_DECISIONS.md](public/docs/UX_DECISIONS.md) - Decisões de UX/UI (Login + Cadastro)
- [public/README.md](public/README.md) - Documentação das interfaces web
- [react-login/ARCHITECTURE.md](react-login/ARCHITECTURE.md) - Arquitetura React
- [react-login/README.md](react-login/README.md) - Sistema React - Guia de uso



---

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

**Diretrizes:**
- Escreva testes para novas features
- Mantenha coverage acima de 80%
- Execute `npm test` antes de commitar
- Atualize documentação se necessário

---

## 📄 Licença

Este projeto está sob a licença ISC.

---

## 👨‍💻 Autor

Desenvolvido como projeto de portfólio para demonstrar conhecimentos em:

- **Backend**: Node.js, Express, PostgreSQL
- **Segurança**: OWASP Top 10, JWT, Bcrypt, Rate Limiting
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla e React)
- **DevOps**: Railway, Docker, CI/CD
- **Documentação**: Markdown, README profissional

---

## 🙏 Agradecimentos

- [OWASP](https://owasp.org/) - Padrões de segurança
- [Railway](https://railway.app/) - Hospedagem PostgreSQL
- [Express](https://expressjs.com/) - Framework web
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados
- Comunidade Node.js

---

<div align="center">

**[⬆ Voltar ao topo](#-secure-auth-system)**

Made with ❤️ | 2026

</div>
