# 🐘 Guia de Configuração PostgreSQL

Este guia explica passo a passo como configurar e usar PostgreSQL neste projeto.

## 📋 Índice

1. [Instalação de Dependências](#1-instalação-de-dependências)
2. [Configuração da Variável DATABASE_URL](#2-configuração-da-variável-database_url)
3. [Estrutura do Módulo de Conexão](#3-estrutura-do-módulo-de-conexão)
4. [Criação das Tabelas](#4-criação-das-tabelas)
5. [Como Usar no Código](#5-como-usar-no-código)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Instalação de Dependências

### Instalar a biblioteca `pg` (PostgreSQL client para Node.js)

```bash
npm install pg
```

### Dependências já incluídas no `package.json`:

```json
{
  "dependencies": {
    "pg": "^8.11.3"
  }
}
```

---

## 2. Configuração da Variável DATABASE_URL

### 2.1. Onde colocar: Arquivo `.env`

A variável `DATABASE_URL` **DEVE** ficar no arquivo `.env` na raiz do projeto.

**❌ NUNCA commitar o arquivo `.env` no Git!**

O `.env` já está incluído no `.gitignore` para segurança.

### 2.2. Formato da DATABASE_URL

```
DATABASE_URL=postgresql://username:password@host:port/database
```

### 2.3. Sua URL do Railway

```env
# .env (na raiz do projeto)
DATABASE_URL=postgresql://postgres:IAUrrIqeGpQadMbMlcHASQtlLGpVMVdh@postgres.railway.internal:5432/railway
```

### 2.4. Estrutura da URL

| Parte | Valor | Descrição |
|-------|-------|-----------|
| `username` | `postgres` | Usuário do banco |
| `password` | `IAUrrIqeGpQadMbMlcHASQtlLGpVMVdh` | Senha do banco |
| `host` | `postgres.railway.internal` | Host do servidor PostgreSQL |
| `port` | `5432` | Porta padrão do PostgreSQL |
| `database` | `railway` | Nome do banco de dados |

### 2.5. SSL em Produção

Para ambientes de produção (Railway, Heroku, AWS RDS), adicione `?sslmode=require`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

O módulo já detecta automaticamente se está em produção e habilita SSL.

---

## 3. Estrutura do Módulo de Conexão

### 3.1. Arquivo: `src/config/database.js`

```javascript
const { Pool } = require('pg');

// Pool de conexões (mais eficiente que conexões individuais)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,        // Máximo de 20 conexões simultâneas
  min: 2,         // Mínimo de 2 conexões sempre ativas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

### 3.2. Recursos Implementados

✅ **Pool de Conexões**: Reutiliza conexões para melhor performance  
✅ **SSL Automático**: Habilitado em produção, desabilitado em dev  
✅ **Tratamento de Erros**: Logs detalhados de erros de conexão  
✅ **Health Check**: Função para verificar status da conexão  
✅ **Transações**: Suporte completo a transações ACID  
✅ **Query Helper**: Função auxiliar para executar queries  
✅ **Eventos de Monitoramento**: Logs de conexões/desconexões  

---

## 4. Criação das Tabelas

### 4.1. Execute o Script SQL

O arquivo `database/schema.sql` contém todo o schema necessário.

#### Opção 1: Via psql (CLI)

```bash
# Conectar ao banco
psql postgresql://postgres:IAUrrIqeGpQadMbMlcHASQtlLGpVMVdh@postgres.railway.internal:5432/railway

# Executar o script
\i database/schema.sql
```

#### Opção 2: Via cliente gráfico (pgAdmin, DBeaver, etc)

1. Conecte ao banco usando as credenciais
2. Abra o arquivo `database/schema.sql`
3. Execute todo o conteúdo

#### Opção 3: Programaticamente (criar arquivo de migration)

```javascript
// scripts/migrate.js
const { query } = require('./src/config/database');
const fs = require('fs');

async function migrate() {
  const sql = fs.readFileSync('./database/schema.sql', 'utf8');
  await query(sql);
  console.log('✅ Schema criado com sucesso!');
}
```

### 4.2. Tabelas Criadas

- **`users`**: Armazena dados de usuários
- **`refresh_tokens`**: Armazena tokens de autenticação

---

## 5. Como Usar no Código

### 5.1. Conectar ao Banco (Inicialização)

```javascript
// server.js
const { connectDB } = require('./src/config/database');

const startServer = async () => {
  await connectDB(); // Conecta e testa
  app.listen(PORT);
};
```

### 5.2. Executar Queries Simples

```javascript
const { query } = require('../config/database');

// SELECT
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  ['usuario@example.com']
);

// INSERT
const newUser = await query(
  'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
  ['João Silva', 'joao@example.com', 'hashed_password']
);

// UPDATE
await query(
  'UPDATE users SET last_login = NOW() WHERE id = $1',
  [userId]
);

// DELETE
await query(
  'DELETE FROM refresh_tokens WHERE token = $1',
  [token]
);
```

### 5.3. Usar Transações

```javascript
const { transaction } = require('../config/database');

// Transação automática (COMMIT/ROLLBACK)
const result = await transaction(async (client) => {
  const user = await client.query(
    'INSERT INTO users (...) VALUES (...) RETURNING id',
    [...]
  );
  
  await client.query(
    'INSERT INTO refresh_tokens (...) VALUES (...)',
    [user.rows[0].id, ...]
  );
  
  return user.rows[0];
});
```

### 5.4. Usar Cliente Direto (para controle manual)

```javascript
const { getClient } = require('../config/database');

const client = await getClient();

try {
  await client.query('BEGIN');
  // ... suas queries
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release(); // IMPORTANTE: sempre liberar!
}
```

### 5.5. Health Check

```javascript
const { healthCheck } = require('../config/database');

app.get('/health', async (req, res) => {
  const dbStatus = await healthCheck();
  res.json(dbStatus);
});
```

---

## 6. Troubleshooting

### ❌ Erro: "password authentication failed"

**Problema**: Credenciais incorretas na DATABASE_URL

**Solução**:
1. Verifique se copiou corretamente a URL completa no `.env`
2. Certifique-se de que não há espaços extras
3. Verifique se o arquivo `.env` está na raiz do projeto

### ❌ Erro: "ENOTFOUND" ou "ECONNREFUSED"

**Problema**: Não consegue conectar ao host

**Solução**:
1. Verifique se o host `postgres.railway.internal` está correto
2. Se estiver rodando localmente, o Railway pode exigir VPN/proxy interno
3. Verifique se Railway expõe o banco externamente (pode precisar de URL pública)

### ❌ Erro: "SSL required"

**Problema**: Servidor exige SSL mas não está configurado

**Solução**:
```javascript
// Forçar SSL no .env ou no código
ssl: {
  rejectUnauthorized: false
}
```

### ❌ Erro: "database does not exist"

**Problema**: O banco de dados `railway` não existe

**Solução**:
1. Verifique no painel do Railway se o banco foi criado
2. Execute o schema.sql para criar as tabelas

### ❌ Pool esgotado (timeout ao obter conexão)

**Problema**: Muitas conexões abertas sem serem liberadas

**Solução**:
1. Sempre use `client.release()` após obter um cliente
2. Use a função `transaction()` que libera automaticamente
3. Aumente o `max` do pool se necessário

---

## 📊 Monitoramento

### Ver status do Pool

```javascript
console.log('Total conexões:', pool.totalCount);
console.log('Conexões ociosas:', pool.idleCount);
console.log('Aguardando conexão:', pool.waitingCount);
```

### Logs Automáticos

O módulo já loga automaticamente:
- ✅ Conexões estabelecidas
- ❌ Erros em conexões
- 🔌 Conexões removidas do pool
- ⏱️ Tempo de execução de queries (modo debug)

---

## 🔐 Segurança

### ✅ Boas Práticas Implementadas

1. **Variáveis de Ambiente**: Credenciais nunca no código
2. **Prepared Statements**: Uso de `$1, $2...` previne SQL Injection
3. **SSL em Produção**: Comunicação criptografada
4. **Pool Limits**: Previne esgotamento de recursos
5. **Statement Timeout**: Queries não travam indefinidamente
6. **Error Logging**: Sem expor credenciais nos logs

### ⚠️ Lembre-se

- Sempre usar parameterized queries: `query('SELECT * FROM users WHERE id = $1', [id])`
- Nunca concatenar strings em SQL: ❌ `'SELECT * FROM users WHERE id = ' + id`
- Validar inputs antes de passar ao banco
- Fazer sanitização contra XSS nos dados retornados

---

## 📚 Referências

- [Documentação node-postgres (pg)](https://node-postgres.com/)
- [PostgreSQL Connection Pool](https://node-postgres.com/features/pooling)
- [PostgreSQL SSL Modes](https://www.postgresql.org/docs/current/libpq-ssl.html)

---

## ✅ Checklist de Setup

- [ ] `npm install` executado
- [ ] Arquivo `.env` criado na raiz
- [ ] `DATABASE_URL` configurada no `.env`
- [ ] Schema SQL executado (`database/schema.sql`)
- [ ] Tabelas `users` e `refresh_tokens` criadas
- [ ] Teste de conexão executado com sucesso
- [ ] `.env` está no `.gitignore`
- [ ] Secrets JWT gerados (ver .env.example)

🎉 **Setup completo! Seu projeto está pronto para usar PostgreSQL.**
