# 🐘 Guia PostgreSQL

Configuração e uso do PostgreSQL neste projeto com Railway.

---

## 📋 Índice

- [Por que PostgreSQL](#por-que-postgresql)
- [Configuração Railway](#configuração-railway)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Schema do Banco](#schema-do-banco)
- [Como Usar no Código](#como-usar-no-código)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Por que PostgreSQL?

| Recurso | Benefício |
|---------|-----------|
| **Relacional** | Estrutura de dados clara e consistente |
| **ACID** | Transações seguras e confiáveis |
| **Prepared Statements** | Proteção 100% contra SQL Injection |
| **JSON Support** | Flexibilidade quando necessário |
| **Railway** | Deploy gratuito e fácil |
| **Escalável** | Suporta milhões de registros |

---

## 🚀 Configuração Railway

### Passo 1: Criar Banco

1. Acesse [railway.app](https://railway.app/)
2. Faça login com GitHub
3. Crie um novo projeto
4. Clique em "New" → "Database" → "PostgreSQL"
5. Copie a `DATABASE_URL` gerada

### Passo 2: Obter DATABASE_URL

No Railway Dashboard:

1. Clique no serviço PostgreSQL
2. Aba "Connect"
3. Copie a **PostgreSQL Connection URL**

Formato:
```
postgresql://postgres:senha@containers-us-west-123.railway.app:6543/railway
```

---

## 🔑 Variáveis de Ambiente

### Arquivo `.env`

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
# PostgreSQL (Railway)
DATABASE_URL=postgresql://postgres:sua_senha@host.railway.app:6543/railway

# Outros configs
NODE_ENV=production
PORT=5000
JWT_SECRET=<seu_secret_aleatorio>
JWT_REFRESH_SECRET=<seu_refresh_secret_aleatorio>
```

**⚠️ IMPORTANTE:**
- **NUNCA** commite o `.env` no Git
- O `.gitignore` já está configurado para ignorá-lo
- Use `.env.example` como template

### Formato da DATABASE_URL

```
postgresql://username:password@host:port/database
          ↓          ↓         ↓     ↓      ↓
       postgres   senha123  host   6543  railway
```

---

## 📊 Schema do Banco

### Tabelas Criadas

#### 1. Tabela `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  password_changed_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Campos:**
- `id`: UUID v4 (único, não sequencial)
- `name`: Nome completo do usuário
- `email`: Email único (usado no login)
- `password_hash`: Senha com bcrypt (12 rounds)
- `role`: Papel do usuário (`user`, `admin`, `moderator`)
- `is_active`: Flag de conta ativa/inativa
- `created_at`: Data de criação
- `updated_at`: Data da última atualização
- `password_changed_at`: Rastreia mudanças de senha (invalida JWTs antigos)

#### 2. Tabela `refresh_tokens` (opcional)

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### Executar Schema

**Opção A - Via linha de comando:**

```bash
psql $DATABASE_URL -f database/schema.sql
```

**Opção B - Via cliente SQL (DBeaver, pgAdmin, TablePlus):**

1. Conecte usando a `DATABASE_URL`
2. Abra o arquivo `database/schema.sql`
3. Execute o SQL

**Opção C - Via Railway Dashboard:**

1. Acesse o banco no Railway
2. Clique em "Query"
3. Cole o conteúdo de `database/schema.sql`
4. Execute

---

## 💻 Como Usar no Código

### Conexão com Pool

**Arquivo:** `src/config/database.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Máximo de 20 conexões simultâneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Função auxiliar para queries
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
```

### Exemplos de Uso

#### Buscar Usuário por Email

```javascript
const { query } = require('../config/database');

const findByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};
```

**✅ Prepared Statement:** PostgreSQL escapa automaticamente o parâmetro `$1`.

#### Criar Novo Usuário

```javascript
const create = async (name, email, passwordHash) => {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email.toLowerCase(), passwordHash, 'user']
  );
  return result.rows[0];
};
```

**⚠️ Nota:** `RETURNING` retorna os dados inseridos (evita SELECT adicional).

#### Atualizar Usuário

```javascript
const update = async (userId, updates) => {
  const result = await query(
    `UPDATE users
     SET name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, updated_at`,
    [updates.name, userId]
  );
  return result.rows[0];
};
```

#### Deletar Usuário

```javascript
const deleteUser = async (userId) => {
  await query('DELETE FROM users WHERE id = $1', [userId]);
};
```

#### Buscar Todos Usuários (com paginação)

```javascript
const findAll = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const result = await query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  
  return result.rows;
};
```

---

## 🧪 Testes

### Testar Conexão

```bash
npm run db:test
```

**Script:** `scripts/testConnection.js`

```javascript
const { pool } = require('../src/config/database');

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL bem-sucedida!');
    console.log('ℹ️ Timestamp:', result.rows[0].now);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    process.exit(1);
  }
};

testConnection();
```

**Saída esperada:**
```
✅ Conexão com PostgreSQL bem-sucedida!
ℹ️ Timestamp: 2026-02-17T18:30:00.000Z
```

### Verificar Tabelas

```bash
psql $DATABASE_URL -c "\dt"
```

**Saída esperada:**
```
 Schema |     Name       | Type  |  Owner
--------+----------------+-------+---------
 public | users          | table | postgres
 public | refresh_tokens | table | postgres
```

---

## 🔧 Troubleshooting

### Erro: "Connection refused"

**Problema:** Servidor PostgreSQL não acessível.

**Soluções:**

1. Verificar se `DATABASE_URL` está correto:
   ```bash
   echo $DATABASE_URL
   ```

2. Testar conexão manual:
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

3. Verificar se serviço está online no Railway Dashboard

### Erro: "password authentication failed"

**Problema:** Senha incorreta na `DATABASE_URL`.

**Solução:** Copiar novamente do Railway Dashboard (Connect → PostgreSQL Connection URL).

### Erro: "relation 'users' does not exist"

**Problema:** Tabelas não criadas.

**Solução:** Executar `database/schema.sql`:
```bash
psql $DATABASE_URL -f database/schema.sql
```

### Queries Lentas

**Problema:** Ausência de índices.

**Solução:** Verificar e criar índices:

```sql
-- Verificar índices existentes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**Analisar query:**
```sql
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'joao@example.com';
```

### Pool Esgotado ("remaining connection slots reserved")

**Problema:** Mais de 20 conexões simultâneas.

**Solução:** Aumentar `max` ou fechar conexões não usadas:

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50, // Aumentar limite
});
```

---

## 📚 Boas Práticas

### 1. Sempre Use Prepared Statements

```javascript
// ✅ CORRETO
await query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ ERRADO (SQL Injection)
await query(`SELECT * FROM users WHERE id = '${userId}'`);
```

### 2. Use Transações para Operações Múltiplas

```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO refresh_tokens ...');
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 3. Feche Conexões Adequadamente

```javascript
// Ao encerrar a aplicação
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
```

### 4. Use Connection Pooling

✅ **Já implementado** via `pg.Pool`.

Benefícios:
- Reutiliza conexões
- Reduz overhead
- Melhora performance

---

## 📖 Recursos

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [node-postgres (pg)](https://node-postgres.com/)
- [Railway Docs](https://docs.railway.app/databases/postgresql)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Última atualização:** 17 de Fevereiro de 2026
