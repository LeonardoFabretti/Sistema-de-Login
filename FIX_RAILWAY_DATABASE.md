# 🔧 CORRIGIR TABELA PASSWORD_RESETS NO RAILWAY

## 🎯 Problema
A tabela `password_resets` foi criada com tipo **TEXT** na coluna `expires_at`, mas deveria ser **TIMESTAMP**.

**Erro:** `operator does not exist: text > timestamp with time zone`

---

## ✅ Solução: Executar SQL no Railway

### PASSO 1: Acessar Railway Database
1. Vá para: https://railway.app/
2. Entre no projeto: **Sistema-de-Login**
3. Clique em **"Postgres"**
4. Clique na aba **"Data"**
5. Clique em **"Query"** (canto superior direito)

---

### PASSO 2: Executar SQL de Correção

**Copie e cole TODO esse código:**

```sql
-- =============================================
-- FIX: TABELA PASSWORD_RESETS
-- Recriar com tipo TIMESTAMP correto
-- =============================================

-- 1. DELETAR tabela antiga
DROP TABLE IF EXISTS password_resets;

-- 2. CRIAR tabela correta
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX idx_password_resets_email 
    ON password_resets(email);

CREATE INDEX idx_password_resets_expires_at 
    ON password_resets(expires_at);
```

---

### PASSO 3: Clicar em "Run Query"

Você deve ver: ✅ **"Query executed successfully"**

---

### PASSO 4: Verificar Estrutura (Opcional)

Execute para confirmar:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'password_resets';
```

**Deve mostrar:**
```
email       | character varying
code_hash   | character varying
expires_at  | timestamp without time zone  ✅ CORRETO!
created_at  | timestamp without time zone
```

---

## 🎉 Pronto!

Agora você pode testar a recuperação de senha:
1. Acesse: https://leonardofabretti.github.io/Sistema-de-Login/forgot-password.html
2. Digite um email cadastrado
3. Veja o código nos logs do Railway
4. Use o código em reset-password.html

---

## 📋 Arquivo SQL Pronto

Se preferir, o SQL completo está em:
👉 `database/fix_password_resets.sql`
