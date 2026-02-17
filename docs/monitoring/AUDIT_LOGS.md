# 📊 Logs e Auditoria

Sistema de logs de autenticação e auditoria de segurança.

---

## 📋 Índice

- [O que é Auditoria](#o-que-é-auditoria)
- [Logs Implementados](#logs-implementados)
- [Onde Estão os Logs](#onde-estão-os-logs)
- [Exemplos de Logs](#exemplos-de-logs)
- [Análise de Padrões Suspeitos](#análise-de-padrões-suspeitos)
- [Compliance LGPD/GDPR](#compliance-lgpdgdpr)

---

## 🎯 O que é Auditoria?

Auditoria de autenticação é o processo de **registrar eventos de segurança** relacionados ao acesso ao sistema, criando um **rastro de auditoria** (audit trail).

### Por Que é Importante?

1. **Rastrear ações:** Quem fez o quê, quando e de onde
2. **Detectar anomalias:** Identificar comportamentos suspeitos
3. **Investigar incidentes:** Reconstruir eventos após violações
4. **Compliance:** Atender LGPD, GDPR e outras regulamentações
5. **Resposta rápida:** Tomar ações corretivas imediatamente

### Cenário Sem Auditoria

```
Atacante tenta 1000 senhas diferentes
Nenhum log é criado
Você não sabe que está sob ataque
Ataque continua indefinidamente
```

### Cenário COM Auditoria

```
10:30:00 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:30:01 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:30:02 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100

🚨 ALERTA: 4 falhas em 3 segundos do mesmo IP!
⚡ AÇÃO:  Bloquear IP 192.168.1.100
✅ RESULTADO: Ataque interrompido
```

---

## 📝 Logs Implementados

### 1. Login Bem-Sucedido

**Quando:** Usuário faz login com credenciais corretas

**Log:**
```
[INFO] [AUTH] Login bem-sucedido | Email: joao@example.com | UserID: 550e8400-e29b-41d4-a716-446655440000 | Role: user | IP: 189.50.10.20 | Timestamp: 2026-02-17T10:35:00.000Z
```

**Informações capturadas:**
- ✅ Email (quem acessou)
- ✅ UserID (identificador único)
- ✅ Role (privilégios: user/admin)
- ✅ IP (de onde acessou)
- ✅ Timestamp (quando acessou)

**Por que é importante:**
- Rastrear QUEM, QUANDO e DE ONDE cada acesso ocorreu
- Detectar acessos não autorizados (credenciais roubadas)
- Não-repúdio: Provar que usuário realizou ações
- Compliance LGPD/GDPR: Rastrear acesso a dados pessoais

### 2. Login Falhou

**Quando:** Tentativa de login com credenciais inválidas

**Log:**
```
[WARN] [AUTH] Login falhou | Email: joao@example.com | IP: 189.50.10.20 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:36:00.000Z
```

**Por que é importante:**
- Detectar tentativas de brute force
- Identificar contas sendo alvos de ataque
- Acionar rate limiting automaticamente
- Alertar sobre padrões suspeitos

### 3. Novo Usuário Registrado

**Quando:** Cadastro bem-sucedido

**Log:**
```
[INFO] [AUTH] Novo usuário registrado | Email: maria@example.com | UserID: 660f9511-f30c-42e5-b827-557766551111 | IP: 200.150.30.45 | Timestamp: 2026-02-17T14:20:00.000Z
```

**Por que é importante:**
- Rastrear crescimento de usuários
- Detectar cadastros massivos (bots)
- Compliance: Registrar consentimento LGPD

### 4. Senha Atualizada

**Quando:** Usuário muda senha

**Log:**
```
[INFO] [AUTH] Senha atualizada | Email: joao@example.com | UserID: 550e8400-e29b-41d4-a716-446655440000 | IP: 189.50.10.20 | Timestamp: 2026-02-17T16:45:00.000Z
```

**Por que é importante:**
- Detectar mudanças não autorizadas (conta comprometida)
- Invalidar JWTs antigos automaticamente
- Notificar usuário por email

### 5. Token Inválido/Expirado

**Quando:** Tentativa de usar token inválido

**Log:**
```
[WARN] [AUTH] Token inválido detectado | IP: 189.50.10.20 | Erro: jwt malformed | Timestamp: 2026-02-17T17:00:00.000Z
```

**Por que é importante:**
- Detectar tentativas de falsificação de tokens
- Identificar ataques de replay

---

## 📂 Onde Estão os Logs

### Localização

**Arquivo:** `src/services/authService.js`

### Principais Trechos

#### Login Bem-Sucedido

```javascript
// src/services/authService.js (linha ~45)
logger.info(`[AUTH] Login bem-sucedido | Email: ${user.email} | UserID: ${user.id} | Role: ${user.role} | IP: ${ip}`);
```

#### Login Falhou

```javascript
// src/services/authService.js (linha ~38)
logger.warn(`[AUTH] Login falhou | Email: ${email} | IP: ${ip} | Erro: Credenciais inválidas`);
```

#### Novo Usuário

```javascript
// src/services/authService.js (linha ~70)
logger.info(`[AUTH] Novo usuário registrado | Email: ${newUser.email} | UserID: ${newUser.id} | IP: ${ip}`);
```

#### Senha Atualizada

```javascript
// src/services/authService.js (linha ~120)
logger.info(`[AUTH] Senha atualizada | Email: ${user.email} | UserID: ${user.id} | IP: ${ip}`);
```

### Configuração do Logger

**Arquivo:** `src/utils/logger.js`

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Console (desenvolvimento)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Arquivo (produção)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

module.exports = logger;
```

**Arquivos de log criados:**
- `logs/combined.log` - Todos os logs (info, warn, error)
- `logs/error.log` - Apenas erros
- Console - Desenvolvimento (colorido)

---

## 📊 Exemplos de Logs

### Dia Normal (Sem Ataques)

```
2026-02-17 08:15:23 [INFO] [AUTH] Login bem-sucedido | Email: joao@example.com | UserID: 123 | Role: user | IP: 189.50.10.20
2026-02-17 08:32:10 [INFO] [AUTH] Login bem-sucedido | Email: maria@example.com | UserID: 456 | Role: user | IP: 200.150.30.45
2026-02-17 10:45:00 [INFO] [AUTH] Novo usuário registrado | Email: carlos@example.com | UserID: 789 | IP: 177.20.15.80
2026-02-17 14:20:15 [INFO] [AUTH] Login bem-sucedido | Email: admin@example.com | UserID: 001 | Role: admin | IP: 192.168.1.100
```

**Padrão:** Logins espaçados, IPs diferentes, sem tentativas falhas.

### Ataque de Brute Force Detectado

```
2026-02-17 10:30:00 [WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100 | Erro: Credenciais inválidas
2026-02-17 10:30:01 [WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100 | Erro: Credenciais inválidas
2026-02-17 10:30:02 [WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100 | Erro: Credenciais inválidas
2026-02-17 10:30:03 [WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100 | Erro: Credenciais inválidas
2026-02-17 10:30:04 [WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100 | Erro: Credenciais inválidas
2026-02-17 10:30:05 [WARN] [AUTH] Rate limit atingido | Email: admin@example.com | IP: 192.168.1.100
```

**Padrão Suspeito:**
- ✅ Mesmo email
- ✅ Mesmo IP
- ✅ Tentativas consecutivas (<1s entre cada)
- ✅ 5+ tentativas falhas
- 🚨 **ALERTA:** Provável ataque de brute force

**Ação Automática:** Rate limiting bloqueia IP por 15 minutos após 5 tentativas.

### Credential Stuffing (Senhas Vazadas)

```
2026-02-17 15:10:00 [WARN] [AUTH] Login falhou | Email: user1@example.com | IP: 203.45.67.89 | Erro: Credenciais inválidas
2026-02-17 15:10:02 [WARN] [AUTH] Login falhou | Email: user2@example.com | IP: 203.45.67.89 | Erro: Credenciais inválidas
2026-02-17 15:10:04 [WARN] [AUTH] Login falhou | Email: user3@example.com | IP: 203.45.67.89 | Erro: Credenciais inválidas
2026-02-17 15:10:06 [INFO] [AUTH] Login bem-sucedido | Email: user4@example.com | UserID: 999 | Role: user | IP: 203.45.67.89 ⚠️
2026-02-17 15:10:08 [WARN] [AUTH] Login falhou | Email: user5@example.com | IP: 203.45.67.89 | Erro: Credenciais inválidas
```

**Padrão Suspeito:**
- ✅ Emails diferentes
- ✅ Mesmo IP
- ✅ 1 sucesso entre várias falhas
- 🚨 **ALERTA:** Atacante testando credenciais vazadas de outros sites

**Ação Recomendada:**
1. Bloquear IP `203.45.67.89`
2. Forçar reset de senha de `user4@example.com`
3. Enviar email de alerta ao usuário

### Acesso de Localização Anômala

```
2026-02-17 08:00:00 [INFO] [AUTH] Login bem-sucedido | Email: joao@example.com | UserID: 123 | Role: user | IP: 189.50.10.20 (Brasil)
2026-02-17 08:10:00 [INFO] [AUTH] Login bem-sucedido | Email: joao@example.com | UserID: 123 | Role: user | IP: 45.123.67.89 (China) ⚠️
```

**Padrão Suspeito:**
- ✅ Mesmo usuário
- ✅ IPs de países diferentes
- ✅ Intervalo curto (10 minutos)
- 🚨 **ALERTA:** Fisicamente impossível (credenciais roubadas?)

**Ação Recomendada:**
1. Bloquear segundo acesso
2. Enviar email ao usuário: "Detectamos login da China. Foi você?"
3. Forçar autenticação de dois fatores

---

## 🔍 Análise de Padrões Suspeitos

### Como Analisar Logs

#### 1. Buscar Tentativas Falhas Repetidas

```bash
# Linux/Mac
grep "Login falhou" logs/combined.log | awk '{print $7}' | sort | uniq -c | sort -nr

# Saída:
# 47 joao@example.com
# 12 admin@example.com
#  3 maria@example.com
```

**Interpretação:** Email `joao@example.com` teve 47 tentativas falhas → investigar!

#### 2. IPs com Mais Tentativas

```bash
grep "Login falhou" logs/combined.log | awk '{print $9}' | sort | uniq -c | sort -nr

# Saída:
# 52 192.168.1.100
#  8 203.45.67.89
#  2 189.50.10.20
```

**Interpretação:** IP `192.168.1.100` teve 52 falhas → provável ataque!

#### 3. Logins Fora do Horário Comercial

```bash
grep "Login bem-sucedido" logs/combined.log | grep -E "0[0-6]:|2[2-3]:"

# Logins entre 00h-06h e 22h-23h
```

**Interpretação:** Acessos às 3h da manhã podem ser suspeitos (dependendo do perfil).

---

## ⚖️ Compliance LGPD/GDPR

### Requisitos Legais

**LGPD (Brasil):**
- Art. 37: Registrar acesso a dados pessoais
- Art. 46: Logs para fins de auditoria e segurança
- Art. 48: Notificar titular em caso de incidente

**GDPR (Europa):**
- Art. 32: Medidas técnicas de segurança (incluindo logs)
- Art. 33: Notificação de violações em 72h
- Art. 35: Avaliação de impacto (logs ajudam)

### Conformidade do Sistema

✅ **Registra acesso a dados:** Email, IP, timestamp  
✅ **Log detalhado:** Possibilita reconstrução de eventos  
✅ **Rotação de logs:** Arquivos antigos arquivados  
✅ **Proteção de logs:** Apenas admins acessam  
✅ **Retention policy:** Logs mantidos por 90 dias (configurável)  

### Dados NÃO Registrados (Privacidade)

❌ **Senhas em texto plano** - NUNCA registradas  
❌ **Dados sensíveis** - Token JWT, session IDs (apenas hash)  
❌ **PII desnecessário** - CPF, telefone não registrados  

---

## 📚 Boas Práticas

### 1. Níveis de Log Apropriados

| Nível | Uso | Exemplo |
|-------|-----|---------|
| `error` | Erros críticos | Banco de dados offline |
| `warn` | Eventos suspeitos | Login falhou 5x |
| `info` | Eventos normais | Login bem-sucedido |
| `debug` | Desenvolvimento | Query SQL executada |

### 2. Rotação de Logs

```javascript
new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '90d' // Manter por 90 dias
});
```

### 3. Monitoramento em Tempo Real

**Ferramentas recomendadas:**
- [Logtail](https://logtail.com/) - Logs em tempo real
- [Sentry](https://sentry.io/) - Monitoramento de erros
- [DataDog](https://www.datadoghq.com/) - Enterprise

### 4. Alertas Automáticos

```javascript
// Enviar alerta se >10 falhas em 1 minuto
if (loginFailuresLastMinute > 10) {
  sendAlert('admin@empresa.com', 'Possível ataque de brute force detectado!');
}
```

---

**Última atualização:** 17 de Fevereiro de 2026
