# 🔐 FLUXO COMPLETO DE RECUPERAÇÃO DE SENHA - IMPLEMENTADO

## ✅ IMPLEMENTAÇÃO COMPLETA

Sistema de recuperação de senha seguindo as melhores práticas de segurança, utilizando:
- Tabela `password_resets` dedicada
- Códigos de 6 dígitos hasheados com bcrypt
- Expiração de 15 minutos
- Nodemailer para envio de emails
- Validação completa (backend + frontend)
- Mensagens genéricas (previne enumeração de usuários)

---

## 📋 ARQUIVOS CRIADOS/MODIFICADOS

### 1️⃣ BACKEND - Models

#### ✨ **NOVO:** `src/models/PasswordReset.js`
Model dedicado para tabela `password_resets`:

**Funções:**
- `create(email, codeHash, expiresAt)` - Cria novo código (apaga antigos automaticamente)
- `findByEmail(email)` - Busca código válido (não expirado)
- `validateCode(code, codeHash)` - Valida código com bcrypt
- `deleteByEmail(email)` - Invalida código após uso
- `deleteById(id)` - Deleta código específico
- `cleanupExpired()` - Remove códigos expirados (cron job)

**Segurança:**
- ✅ Prepared statements (previne SQL Injection)
- ✅ Bcrypt para hash de código
- ✅ Validação de expiração no banco
- ✅ Email sempre lowercase
- ✅ Remove códigos antigos antes de criar novo

---

#### 🔧 **ATUALIZADO:** `src/models/User.js`

**Nova função adicionada:**
```javascript
updatePasswordChangedAt(userId)
```

**Propósito:**
- Marca quando senha foi alterada
- Invalida tokens JWT antigos
- Previne reuso de tokens após reset

---

### 2️⃣ BACKEND - Services

#### 🔧 **ATUALIZADO:** `src/services/authService.js`

**Mudanças:**
1. Importa `PasswordReset` model
2. `requestPasswordReset(email)` agora usa `PasswordReset.create()`
3. `resetPasswordWithCode(email, code, newPassword)` refatorado:
   - Busca código na tabela `password_resets`
   - Valida com `PasswordReset.validateCode()`
   - Atualiza senha do usuário
   - Atualiza `password_changed_at`
   - Invalida código com `PasswordReset.deleteByEmail()`

**Segurança implementada:**
- ✅ Sempre retorna sucesso (não revela se email existe)
- ✅ Código expira em 15 minutos
- ✅ Código hasheado (nunca em texto plano)
- ✅ Validação de força de senha (8+ chars, maiúscula, minúscula, número, especial)
- ✅ Código invalidado após uso (uso único)

---

#### 🔧 **ATUALIZADO:** `src/services/emailService.js`

**Implementação completa do Nodemailer:**

**Configuração:**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.PORTA_DE_EMAIL || '587'),
  secure: process.env.PORTA_DE_EMAIL === '465',
  auth: {
    user: process.env.USUÁRIO_DE_EMAIL,
    pass: process.env.SENHA_DE_EMAIL,
  },
});
```

**Funções:**
- `verifyTransporter()` - Verifica configuração SMTP ao iniciar
- `sendEmail({ to, subject, text, html })` - Função genérica de envio
- `sendPasswordResetEmail(user, resetCode)` - Email de recuperação com template HTML responsivo

**Modo Fallback:**
- Se SMTP não configurado, loga email no console (desenvolvimento)
- Produção: Sempre tenta enviar via Nodemailer

**Template HTML:**
- Design profissional com gradiente roxo/azul
- Código destacado em caixa com bordas tracejadas
- Avisos de segurança
- Responsivo
- Informações de expiração

---

### 3️⃣ BACKEND - Validators

#### 🔧 **ATUALIZADO:** `src/validators/authValidator.js`

**Schemas criados/corrigidos:**

1. **`emailSchema`** (CORRIGIDO - estava vazio `{}`)
```javascript
Joi.object({
  email: Joi.string().trim().lowercase().email().required()
})
```

2. **`resetPasswordSchema`** (NOVO)
```javascript
Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  code: Joi.string().pattern(/^\d{6}$/).required(),
  newPassword: passwordSchema // 8+ chars, força completa
})
```

3. **`updatePasswordSchema`** (DESCOMENTADO)
```javascript
Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema,
  confirmNewPassword: Joi.ref('newPassword')
})
```

**Erro corrigido:**
- ❌ Antes: `schema.validate is not a function` (schema estava `{}`)
- ✅ Depois: Joi configurado corretamente com schemas completos

---

### 4️⃣ BACKEND - Routes

#### 🔧 **ATUALIZADO:** `src/routes/auth.js`

**Mudanças:**
1. Importa `resetPasswordSchema`
2. Adiciona validação à rota `/reset-password`:

```javascript
router.post(
  '/reset-password',
  validate(resetPasswordSchema), // ✅ ADICIONADO
  authController.resetPassword
);
```

**Rotas finais:**
- `POST /api/auth/forgot-password` - Valida email → Envia código
- `POST /api/auth/reset-password` - Valida email + código + senha → Atualiza senha

---

### 5️⃣ FRONTEND

#### ✅ **VERIFICADO:** `js/forgot-password.js`

**Status:** ✅ Já implementado corretamente

**Validação:**
- ❌ NÃO usa `schema.validate` (correto!)
- ✅ Usa regex simples: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- ✅ Mensagens de erro amigáveis
- ✅ Loading states
- ✅ Redirecionamento para `redefinir-senha.html`

**Fluxo:**
1. Usuário digita email
2. Validação local (formato)
3. POST `/api/auth/forgot-password`
4. Salva email no localStorage
5. Redireciona para reset-password

---

#### ✅ **VERIFICADO:** `js/reset-password.js`

**Status:** ✅ Já implementado corretamente

**Validação:**
- ❌ NÃO usa `schema.validate` (correto!)
- ✅ Validação de código: `/^\d{6}$/`
- ✅ Validação de senha forte (8+ chars, maiúscula, minúscula, número, especial)
- ✅ Feedback visual em tempo real (requisitos de senha)
- ✅ Toggle de visualização de senha
- ✅ Confirmação de senha

**Fluxo:**
1. Lê email do localStorage
2. Usuário insere código + nova senha
3. Validação local (formato + força)
4. POST `/api/auth/reset-password`
5. Remove email do localStorage
6. Redireciona para login

---

### 6️⃣ CONFIGURAÇÃO

#### 🔧 **ATUALIZADO:** `.env.example`

**Variáveis de email adicionadas:**
```bash
# Configurações de Email (OBRIGATÓRIO PARA RECUPERAÇÃO DE SENHA)
EMAIL_HOST=smtp.gmail.com
PORTA_DE_EMAIL=587
USUÁRIO_DE_EMAIL=seu.email@gmail.com
SENHA_DE_EMAIL=sua_senha_de_app
E_MAIL_DE=seu.email@gmail.com

# Frontend URL (para emails com links)
FRONTEND_URL=http://localhost:3000
```

**Exemplos documentados:**
- Gmail
- Mailtrap (desenvolvimento)

---

## 🔒 SEGURANÇA IMPLEMENTADA

### ✅ Proteções contra ataques

1. **Enumeração de usuários**
   - Sempre retorna sucesso em `/forgot-password`
   - Mensagens genéricas ("Se o email existir...")
   - Não revela se email está cadastrado

2. **Brute Force**
   - Rate limiting em rotas de auth
   - Códigos expiram em 15 minutos
   - Código invalidado após 1 uso

3. **SQL Injection**
   - Prepared statements em todos os models
   - Validação Joi no backend
   - Sanitização de inputs

4. **XSS/Injection**
   - Joi valida e sanitiza inputs
   - HTML escapado em templates
   - Headers de segurança

5. **Timing Attacks**
   - bcrypt.compare (timing-safe)
   - Mensagens sempre levam tempo similar

6. **Password Strength**
   - Política forte: 8+ chars
   - Maiúscula, minúscula, número, especial
   - Validação backend + frontend

7. **Token Reuse**
   - `password_changed_at` atualizado
   - Invalida tokens JWT antigos
   - Logout forçado em outras sessões

---

## 📊 FLUXO COMPLETO

### Parte 1: Solicitação de Código

```
1. Usuário → esqueceu-a-senha.html
   ↓
2. Digite email → Validação frontend (regex)
   ↓
3. POST /api/auth/forgot-password { email }
   ↓
4. [BACKEND]
   ├─ Valida email (Joi)
   ├─ Busca usuário (se não existe, retorna sucesso)
   ├─ Gera código 6 dígitos (Math.random)
   ├─ Hash bcrypt(code, 10)
   ├─ Apaga códigos antigos (PasswordReset.create)
   ├─ Salva na tabela password_resets
   ├─ Envia email (Nodemailer)
   └─ Retorna 200 (sempre)
   ↓
5. Frontend salva email (localStorage)
   ↓
6. Redireciona → redefinir-senha.html
```

### Parte 2: Reset de Senha

```
1. Usuário → redefinir-senha.html
   ↓
2. Lê email do localStorage
   ↓
3. Digite código + nova senha
   ↓
4. Validação frontend (código 6 dígitos, senha forte)
   ↓
5. POST /api/auth/reset-password { email, code, newPassword }
   ↓
6. [BACKEND]
   ├─ Valida inputs (Joi: email, código regex, senha forte)
   ├─ Busca código na password_resets
   ├─ Verifica expiração (expires_at > NOW())
   ├─ Valida código (bcrypt.compare)
   ├─ Hash nova senha (bcrypt, 12 rounds)
   ├─ Atualiza senha (users.password)
   ├─ Atualiza password_changed_at (NOW())
   ├─ Deleta código (password_resets)
   └─ Retorna 200
   ↓
7. Frontend remove email (localStorage)
   ↓
8. Redireciona → index.html (login)
```

---

## 🗄️ TABELA password_resets

**Schema:**
```sql
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_resets_email ON password_resets(email);
CREATE INDEX idx_password_resets_expires ON password_resets(expires_at);
```

**Uso:**
- Email não precisa existir em `users` (previne enumeração)
- `code_hash`: bcrypt do código (nunca salva código plano)
- `expires_at`: NOW() + 15 minutos
- `created_at`: Auditoria

**Limpeza:**
- Códigos apagados automaticamente ao criar novo (mesmo email)
- Códigos apagados após uso
- Recomendado: Cron job para limpar expirados (`PasswordReset.cleanupExpired()`)

---

## 🧪 COMO TESTAR

### 1. Configurar Email

**Desenvolvimento (Mailtrap):**
1. Crie conta em [mailtrap.io](https://mailtrap.io)
2. Copie credenciais SMTP
3. Configure `.env`:
```bash
EMAIL_HOST=smtp.mailtrap.io
PORTA_DE_EMAIL=2525
USUÁRIO_DE_EMAIL=seu_usuario_mailtrap
SENHA_DE_EMAIL=sua_senha_mailtrap
E_MAIL_DE=noreply@test.com
```

**Produção (Gmail):**
1. Ative verificação em 2 fatores
2. Gere "Senha de app" em [myaccount.google.com](https://myaccount.google.com/apppasswords)
3. Configure `.env`:
```bash
EMAIL_HOST=smtp.gmail.com
PORTA_DE_EMAIL=587
USUÁRIO_DE_EMAIL=seu.email@gmail.com
SENHA_DE_EMAIL=senha_de_app_16_digitos
E_MAIL_DE=seu.email@gmail.com
```

### 2. Verificar Tabela

```sql
-- Verificar se tabela existe
SELECT * FROM password_resets LIMIT 1;

-- Verificar índices
\d password_resets
```

### 3. Testar Fluxo

**A. Solicitação de Código:**
```bash
# Teste via curl
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@test.com"}'

# Resposta esperada (sempre 200):
{
  "success": true,
  "message": "Se o email existir, você receberá um código..."
}
```

**B. Verificar Email:**
- Mailtrap: Acesse inbox em mailtrap.io
- Gmail: Verifique caixa de entrada
- Console: Se SMTP não configurado, código aparece no terminal

**C. Reset de Senha:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "code": "123456",
    "newPassword": "NovaSenha@123"
  }'

# Resposta esperada (200):
{
  "success": true,
  "message": "Senha redefinida com sucesso!"
}
```

**D. Testar Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "password": "NovaSenha@123"
  }'
```

### 4. Testar Erros

**Código inválido:**
```bash
# Deve retornar 400
curl -X POST http://localhost:5000/api/auth/reset-password \
  -d '{"email": "usuario@test.com", "code": "000000", "newPassword": "Test@123"}'
```

**Código expirado:**
```sql
-- Forçar expiração
UPDATE password_resets SET expires_at = NOW() - INTERVAL '1 hour' WHERE email = 'usuario@test.com';
```

**Senha fraca:**
```bash
# Deve retornar 400
curl -X POST http://localhost:5000/api/auth/reset-password \
  -d '{"email": "usuario@test.com", "code": "123456", "newPassword": "123"}'
```

---

## 📝 VARIÁVEIS DE AMBIENTE REQUERIDAS

### Obrigatórias para Email:
```bash
EMAIL_HOST=smtp.gmail.com                # Host SMTP
PORTA_DE_EMAIL=587                       # Porta (587 ou 465)
USUÁRIO_DE_EMAIL=seu.email@gmail.com    # Usuário SMTP
SENHA_DE_EMAIL=sua_senha_de_app         # Senha/token SMTP
E_MAIL_DE=seu.email@gmail.com           # Email remetente
```

### Opcionais:
```bash
FRONTEND_URL=http://localhost:3000       # URL do frontend (para links em emails)
```

---

## 🚀 DEPLOY

### 1. Railway (Backend)

**Configurar variáveis de ambiente:**
1. Acesse Railway Dashboard
2. Variables → Add Variables
3. Cole todas as variáveis do `.env.example`
4. Especial atenção para:
   - `EMAIL_HOST`
   - `PORTA_DE_EMAIL`
   - `USUÁRIO_DE_EMAIL`
   - `SENHA_DE_EMAIL`
   - `E_MAIL_DE`

### 2. GitHub Pages (Frontend)

**Já configurado:**
- ✅ HTML files na raiz
- ✅ CSS em `/css`
- ✅ JS em `/js`
- ✅ API URL: `https://empowering-solace-production-c913.up.railway.app`

**URLs finais:**
- Login: `https://leonardofabretti.github.io/Sistema-de-Login/`
- Esqueceu senha: `.../esqueceu-a-senha.html`
- Redefinir senha: `.../redefinir-senha.html`

---

## 📚 DOCUMENTAÇÃO DE CÓDIGO

### Controllers

**authController.js:**
- `forgotPassword` - Handler de solicitação de código
- `resetPassword` - Handler de reset de senha

### Services

**authService.js:**
- `requestPasswordReset(email)` - Lógica de negócio para geração de código
- `resetPasswordWithCode(email, code, newPassword)` - Lógica de reset

**emailService.js:**
- `sendPasswordResetEmail(user, resetCode)` - Envio de email com template

### Models

**PasswordReset.js:**
- `create(email, codeHash, expiresAt)` - Criar código
- `findByEmail(email)` - Buscar código válido
- `validateCode(code, codeHash)` - Validar código
- `deleteByEmail(email)` - Invalidar código

**User.js:**
- `updatePassword(userId, newPassword)` - Atualizar senha (já hasheia)
- `updatePasswordChangedAt(userId)` - Marcar troca de senha

### Validators

**authValidator.js:**
- `emailSchema` - Validação de email
- `resetPasswordSchema` - Validação de reset (email + código + senha)

---

## ✅ CHECKLIST FINAL

### Backend
- [x] Model PasswordReset criado
- [x] authService usa tabela password_resets
- [x] Nodemailer configurado
- [x] Templates HTML responsivos
- [x] Validators corrigidos (emailSchema, resetPasswordSchema)
- [x] Routes com validação
- [x] password_changed_at implementado
- [x] Segurança: mensagens genéricas
- [x] Segurança: códigos hasheados
- [x] Segurança: expiração de 15 minutos
- [x] Segurança: uso único de códigos

### Frontend
- [x] forgot-password.js sem schema.validate
- [x] reset-password.js com validação regex
- [x] Feedback visual de requisitos de senha
- [x] Loading states
- [x] Mensagens de erro amigáveis
- [x] Redirecionamentos corretos
- [x] localStorage para email

### Configuração
- [x] .env.example atualizado
- [x] Variáveis de email documentadas
- [x] Exemplos de Gmail e Mailtrap

### Documentação
- [x] Fluxo completo documentado
- [x] Segurança explicada
- [x] Testes documentados
- [x] Deploy documentado

---

## 🎉 CONCLUSÃO

Sistema de recuperação de senha **COMPLETO** e **PRONTO PARA PRODUÇÃO**.

**Características:**
- ✅ Seguro (bcrypt, prepared statements, rate limiting)
- ✅ Profissional (Nodemailer, templates HTML)
- ✅ Escalável (tabela dedicada, índices)
- ✅ Auditável (logs, timestamps)
- ✅ User-friendly (mensagens claras, validação visual)

**Próximos passos:**
1. Configure SMTP (Gmail ou Mailtrap)
2. Teste localmente
3. Deploy no Railway (configure variáveis)
4. Teste em produção
5. Monitore logs de email

**Suporte:**
- Logs detalhados em console
- Mensagens de erro claras
- Fallback para console em desenvolvimento
