# 🚂 Como Executar SQL no PostgreSQL do Railway

## 📋 Passo a Passo

### **Opção 1: Via Railway Dashboard (Recomendado)**

1. **Acesse o Railway**
   - Vá para: https://railway.app/
   - Faça login na sua conta

2. **Selecione seu Projeto**
   - Clique no projeto do seu backend (`empowering-solace-production`)

3. **Abra o PostgreSQL**
   - Clique no serviço **PostgreSQL** (ícone de banco de dados)
   - Vá para a aba **"Data"** ou **"Query"**

4. **Execute o SQL**
   - Cole o conteúdo do arquivo `database/password_resets.sql`
   - Clique em **"Run Query"** ou **"Execute"**

```sql
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email 
    ON password_resets(email);

CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at 
    ON password_resets(expires_at);
```

5. **Verifique a Criação**
   ```sql
   SELECT * FROM password_resets;
   ```
   - Deve retornar uma tabela vazia (sem erros)

---

### **Opção 2: Via pgAdmin ou DBeaver**

1. **Obtenha as Credenciais do Railway**
   - No Railway, clique no serviço PostgreSQL
   - Vá para a aba **"Variables"** ou **"Connect"**
   - Copie as informações:
     - **Host:** `nozomi.proxy.rlwy.net`
     - **Port:** `10536`
     - **Database:** `railway`
     - **User:** `postgres`
     - **Password:** (sua senha do Railway)

2. **Conecte no pgAdmin/DBeaver**
   - Crie uma nova conexão com as credenciais acima

3. **Execute o SQL**
   - Abra o Query Tool
   - Cole o SQL do arquivo `database/password_resets.sql`
   - Execute (F5 ou botão Run)

---

### **Opção 3: Via Terminal (psql)**

```bash
# Conectar ao PostgreSQL
psql "postgresql://postgres:SENHA@nozomi.proxy.rlwy.net:10536/railway"

# Executar o SQL (dentro do psql)
\i database/password_resets.sql

# Ou copiar e colar direto:
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

# Verificar
\d password_resets
```

---

## ✅ Verificação

Após executar, verifique se a tabela foi criada:

```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'password_resets';

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'password_resets';
```

**Resultado esperado:**
- Tabela `password_resets` com 5 colunas
- 2 índices criados (email e expires_at)

---

## 🔧 Troubleshooting

### Erro: "permission denied"
- Verifique se está usando o usuário `postgres` (admin)

### Erro: "relation already exists"
- A tabela já foi criada, tudo certo! ✅
- Pode pular esta etapa

### Erro de conexão
- Verifique se as credenciais estão corretas
- Confirme que o serviço PostgreSQL está rodando no Railway

---

## 📝 Próximos Passos

Após criar a tabela, você precisará **atualizar o código backend** para usar esta nova tabela ao invés das colunas `password_reset_token` e `password_reset_expire` da tabela `users`.

**Alternativamente**, você pode continuar usando as colunas existentes na tabela `users` (que já estão implementadas no código atual).

Qual abordagem você prefere?
1. ✅ **Usar colunas na tabela `users`** (já funcionando)
2. 🆕 **Usar tabela separada `password_resets`** (precisa atualizar código)
