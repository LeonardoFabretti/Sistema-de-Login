# 🚀 Quick Start - PostgreSQL

## Setup em 5 Passos

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar `.env`
Crie o arquivo `.env` na raiz com:
```env
DATABASE_URL=postgresql://postgres:IAUrrIqeGpQadMbMlcHASQtlLGpVMVdh@postgres.railway.internal:5432/railway
NODE_ENV=development
PORT=5000
```

### 3. Criar tabelas no PostgreSQL
Conecte ao seu banco e execute o arquivo:
```bash
psql $DATABASE_URL -f database/schema.sql
```

Ou copie e cole o conteúdo de `database/schema.sql` no seu cliente SQL.

### 4. Testar conexão
```bash
npm run db:test
```

Se ver "🎉 TODOS OS TESTES PASSARAM!", está tudo certo!

### 5. Iniciar servidor
```bash
npm run dev
```

---

## 📝 Usando no Código

### Importar módulo
```javascript
const { query, transaction } = require('./src/config/database');
```

### SELECT
```javascript
const user = await query(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);
console.log(user.rows[0]); // Resultado
```

### INSERT
```javascript
const result = await query(
  'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
  ['João', 'joao@example.com', 'hashed_password']
);
console.log(result.rows[0]); // Usuário criado
```

### UPDATE
```javascript
await query(
  'UPDATE users SET last_login = NOW() WHERE id = $1',
  [userId]
);
```

### DELETE
```javascript
await query(
  'DELETE FROM refresh_tokens WHERE token = $1',
  [token]
);
```

### Transação
```javascript
const userId = await transaction(async (client) => {
  const user = await client.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
    ['Ana', 'ana@example.com', 'hash']
  );
  
  await client.query(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
    ['abc123', user.rows[0].id]
  );
  
  return user.rows[0].id;
});
```

---

## ⚠️ Importante

### ✅ SEMPRE use prepared statements
```javascript
// ✅ CORRETO
query('SELECT * FROM users WHERE id = $1', [id]);

// ❌ ERRADO (SQL Injection!)
query(`SELECT * FROM users WHERE id = ${id}`);
```

### 🔒 NUNCA commite o `.env`
O arquivo `.env` já está no `.gitignore`. Ele contém credenciais sensíveis!

---

## 📚 Mais Informações

- 📘 Guia completo: [SETUP_POSTGRESQL.md](SETUP_POSTGRESQL.md)
- 📗 Exemplos: [examples/databaseUsage.js](examples/databaseUsage.js)
- 📙 Schema: [database/schema.sql](database/schema.sql)
- 📕 Resumo: [POSTGRESQL_RESUMO.md](POSTGRESQL_RESUMO.md)

---

## 🆘 Problemas?

### Erro de conexão?
```bash
npm run db:test
```
Veja mensagens de erro detalhadas.

### Tabelas não criadas?
Execute novamente:
```bash
psql $DATABASE_URL -f database/schema.sql
```

### Dúvidas sobre uso?
Veja [examples/databaseUsage.js](examples/databaseUsage.js) - 15 exemplos práticos!

---

**Pronto! Você está pronto para usar PostgreSQL no projeto! 🎉**
