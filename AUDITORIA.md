# 🔍 AUDITORIA DE AUTENTICAÇÃO

## 📋 Sumário

- [O que é Auditoria](#o-que-é-auditoria)
- [Por que é Importante](#por-que-é-importante)
- [Logs Implementados](#logs-implementados)
- [Informações Registradas](#informações-registradas)
- [Como Usar os Logs](#como-usar-os-logs)
- [Padrões Suspeitos](#padrões-suspeitos)
- [Compliance e Regulamentação](#compliance-e-regulamentação)
- [Boas Práticas](#boas-práticas)

---

## 🎯 O que é Auditoria

**Auditoria de autenticação** é o processo de **registrar eventos de segurança** relacionados ao acesso ao sistema, criando um **rastro de auditoria** (audit trail) que permite:

- **Rastrear ações**: Quem fez o quê, quando e de onde
- **Detectar anomalias**: Identificar comportamentos suspeitos
- **Investigar incidentes**: Reconstruir eventos após violações de segurança
- **Compliance**: Atender requisitos regulatórios (LGPD, GDPR, etc.)
- **Resposta a incidentes**: Tomar ações corretivas rapidamente

---

## ❓ Por que é Importante

### 1. Detecção de Ataques

**Cenário sem auditoria:**
```
Atacante tenta 1000 senhas diferentes
Nenhum log é criado
Você não sabe que está sob ataque
Ataque continua indefinidamente
```

**Cenário com auditoria:**
```
10:30:00 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:30:01 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:30:02 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:30:03 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100

🚨 ALERTA: 4 falhas de login em 3 segundos do mesmo IP!
⚡ AÇÃO: Bloquear IP 192.168.1.100 automaticamente
✅ RESULTADO: Ataque interrompido
```

**Benefício:** Detecção e resposta em **segundos** ao invés de **dias ou nunca**

---

### 2. Investigação de Incidentes

**Situação:** Conta de administrador comprometida, dados sensíveis foram acessados.

**Pergunta:** Como o atacante entrou? De onde? Quando? O que foi acessado?

**Resposta com auditoria:**
```
2026-02-15 03:45:23 - [AUTH] Login bem-sucedido | Email: admin@example.com | IP: 185.220.101.5 | UserID: 123
                                                                              ^^^^^^^^^^^^^^^^
                                                                              IP suspeito (Tor exit node)

Análise:
✅ Horário: 3h45 AM (fora do horário normal do admin que trabalha 9h-18h)
✅ IP: Localizado na Rússia (admin sempre acessa do Brasil)
✅ Padrão: Primeira vez visto esse IP
✅ Conclusão: Credenciais roubadas, acesso não autorizado

Ações tomadas:
1. Revogar sessão imediatamente
2. Forçar reset de senha
3. Ativar 2FA obrigatório
4. Notificar admin real
5. Investigar origem do vazamento de credenciais
```

**Sem auditoria:** Você nunca saberia como aconteceu, quando aconteceu ou o que foi acessado. **Impossível tomar ações corretivas.**

---

### 3. Compliance e Regulamentação

Várias regulamentações **EXIGEM** auditoria de acesso:

#### LGPD (Lei Geral de Proteção de Dados - Brasil)

**Art. 46:** O controlador deve registrar **"quando, como e por que" dados pessoais foram tratados**.

**Art. 48:** Em caso de incidente de segurança, é necessário **demonstrar quais dados foram acessados e por quem**.

**Penalidade:** Multa de até **R$ 50 milhões** ou **2% do faturamento** por descumprimento.

**Como auditoria ajuda:**
```
Logs de autenticação mostram:
- Quem acessou dados pessoais (UserID)
- Quando acessou (Timestamp)
- De onde acessou (IP)
- Se o acesso foi autorizado ou não
```

---

#### GDPR (General Data Protection Regulation - Europa)

**Art. 30:** Registros de atividades de tratamento de dados devem incluir **"quando e quem acessou"**.

**Art. 33:** Em caso de violação, notificar autoridades em **72 horas** com **detalhes completos do incidente**.

**Penalidade:** Multa de até **€20 milhões** ou **4% do faturamento global**.

**Como auditoria ajuda:**
```
Em caso de vazamento:
1. Logs mostram quando a violação ocorreu
2. Logs mostram origem (IP, horário, conta comprometida)
3. Logs mostram escopo (quantas contas afetadas)
4. Relatório completo entregue às autoridades dentro do prazo
```

---

#### PCI-DSS (Payment Card Industry Data Security Standard)

**Requisito 10:** Rastrear e monitorar **todos os acessos a componentes de sistema e dados de cartão**.

**Requisito 10.2:** Implementar trilhas de auditoria automatizadas para:
- Todos os acessos individuais de usuários
- Ações realizadas por administradores
- Acessos não autorizados
- Criação e exclusão de contas

**Penalidade:** Perda da certificação PCI-DSS = **não pode processar pagamentos com cartão**.

**Como auditoria ajuda:**
```
Logs de autenticação atendem requisito 10.2:
✅ Acesso de usuários individuais (login)
✅ Ações de administradores (role=admin)
✅ Tentativas não autorizadas (login falhou)
✅ Criação de contas (novo usuário registrado)
```

---

### 4. Responsabilização e Não-Repúdio

**Não-repúdio** significa que uma pessoa **não pode negar** que realizou uma ação.

**Cenário sem auditoria:**
```
Funcionário deletou 10.000 registros de clientes.

Funcionário: "Não fui eu!"
Sistema: Sem logs de quem fez o quê...
Resultado: Impossível provar quem foi responsável
          Impossível tomar ações disciplinares
          Impossível recuperar dados (sem saber o que foi deletado)
```

**Cenário com auditoria:**
```
2026-02-16 14:32:18 - [AUTH] Login bem-sucedido | Email: funcionario@empresa.com | UserID: 456
2026-02-16 14:35:27 - [DB] DELETE FROM clientes | UserID: 456 | Rows: 10000

Funcionário: "Não fui eu!"
Sistema: Log mostra que UserID 456 (funcionário@empresa.com) logou às 14:32 e deletou 10.000 registros às 14:35
Resultado: Prova irrefutável
          Ações disciplinares tomadas
          Recuperação de dados de backup do momento exato
```

---

### 5. Detecção de Comprometimento de Contas

**Indicadores de comprometimento:**

```
# Exemplo 1: Acesso de locais geográficos distantes em tempo curto

10:00:00 - [AUTH] Login bem-sucedido | Email: user@example.com | IP: 189.50.10.20 (São Paulo, BR)
10:05:00 - [AUTH] Login bem-sucedido | Email: user@example.com | IP: 185.220.101.5 (Moscou, RU)

🚨 ALERTA: Viagem impossível detectada!
   Usuário não pode estar em São Paulo e Moscou com 5 minutos de diferença.
   
✅ AÇÃO: Forçar logout de todas as sessões
         Exigir verificação de identidade
         Alertar usuário real sobre acesso suspeito
```

```
# Exemplo 2: Mudança de padrão de acesso

Padrão normal (últimos 30 dias):
- Horário: 8h-18h (horário comercial)
- IP: 189.50.10.* (rede corporativa)
- Frequência: 1 login/dia

Padrão suspeito:
03:45:00 - [AUTH] Login bem-sucedido | Email: user@example.com | IP: 103.76.228.10 (China)

🚨 ALERTA: Acesso fora de padrão!
   - Horário: 3h AM (usuário nunca acessa de madrugada)
   - IP: China (usuário sempre acessa do Brasil)
   
✅ AÇÃO: Exigir MFA adicional
         Notificar usuário por email/SMS
         Analisar atividades realizadas nesta sessão
```

---

## 📁 Logs Implementados

### 1. Registro de Novo Usuário

**Quando:** Usuário se cadastra no sistema (POST /api/auth/register)

**Log gerado:**
```
[AUTH] Novo usuário registrado | Email: joao@example.com | UserID: 789 | Role: user | Timestamp: 2026-02-17T10:30:00.000Z
```

**Por que logar:**
- Detectar criação em massa de contas falsas (bots, spam)
- Rastrear origem de contas maliciosas
- Compliance (registrar criação de dados pessoais)
- Auditoria de crescimento do sistema

**Exemplo de uso:**
```
Situação: 1000 contas criadas em 1 hora com emails similares

10:00:00 - [AUTH] Novo usuário registrado | Email: bot1234@tempmail.com
10:00:01 - [AUTH] Novo usuário registrado | Email: bot1235@tempmail.com
10:00:02 - [AUTH] Novo usuário registrado | Email: bot1236@tempmail.com
...

Análise: Padrão de emails temporários, criação rápida
Conclusão: Ataque de criação de contas em massa
Ação: Implementar CAPTCHA, validar emails, bloquear domínio tempmail.com
```

---

### 2. Login Bem-Sucedido

**Quando:** Usuário faz login com sucesso (POST /api/auth/login)

**Log gerado:**
```
[AUTH] Login bem-sucedido | Email: joao@example.com | UserID: 789 | Role: user | IP: 189.50.10.20 | Timestamp: 2026-02-17T10:35:00.000Z
```

**Por que logar:**
- Detectar acessos não autorizados (credenciais roubadas)
- Identificar padrões geográficos suspeitos
- Rastrear atividades de usuários (quem fez o quê)
- Correlacionar ações com sessões específicas
- Compliance (rastrear acesso a dados pessoais)

**Exemplo de uso:**
```
Situação: Usuário reporta "não fui eu que fiz isso!"

Logs:
2026-02-16 14:00:00 - [AUTH] Login bem-sucedido | Email: joao@example.com | IP: 189.50.10.20 (São Paulo)
2026-02-16 14:05:00 - [ACTION] Transferência de R$ 10.000 | UserID: 789 | IP: 189.50.10.20
2026-02-16 14:10:00 - [AUTH] Logout | Email: joao@example.com | IP: 189.50.10.20

Análise: Mesmo IP em todos os eventos, IP conhecido do usuário (São Paulo)
Conclusão: Usuário fez a ação (não-repúdio)
```

---

### 3. Login Falhou

**Quando:** Tentativa de login com credenciais inválidas (POST /api/auth/login)

**Log gerado:**
```
[AUTH] Login falhou | Email: joao@example.com | IP: 192.168.1.100 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:40:00.000Z
```

**Por que logar:**
- **Detectar ataques brute force** (múltiplas tentativas do mesmo IP)
- **Identificar tentativas de credential stuffing** (testar senhas vazadas)
- **Alertar usuários** sobre tentativas de acesso não autorizado
- **Análise forense** após comprometimento
- **Medir eficácia** de proteções (rate limiting)

**Exemplo de uso:**
```
Situação: 100 falhas de login em 5 minutos

10:00:00 - [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5
10:00:01 - [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5
10:00:02 - [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5
...
10:05:00 - [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5

Análise: 100 tentativas de login, mesmo email, mesmo IP, rapidez
Conclusão: Ataque brute force automatizado
Ação: Bloquear IP 185.220.101.5, alertar admin real, analisar senhas testadas
```

---

### 4. Senha Atualizada

**Quando:** Usuário altera sua senha (PUT /api/auth/update-password)

**Log gerado:**
```
[AUTH] Senha atualizada | UserID: 789 | Timestamp: 2026-02-17T10:45:00.000Z
```

**Por que logar:**
- **Detectar sequestro de conta** (atacante troca senha para bloquear usuário real)
- **Invalidar tokens antigos** (sessions criadas antes da mudança de senha)
- **Notificar usuário** sobre mudança de segurança
- **Compliance** (mudanças em dados de autenticação)

**Exemplo de uso:**
```
Situação: Usuário não consegue mais fazer login

15:00:00 - [AUTH] Login bem-sucedido | Email: joao@example.com | IP: 103.76.228.10 (China) 🚨
15:05:00 - [AUTH] Senha atualizada | UserID: 789
15:10:00 - [AUTH] Login falhou | Email: joao@example.com | IP: 189.50.10.20 (São Paulo - usuário real)

Análise: 
1. Login de IP suspeito (China)
2. Senha alterada logo após
3. Usuário real não consegue mais logar
Conclusão: Conta comprometida, atacante trocou senha
Ação: Recuperar conta via email, resetar senha, investigar como credenciais foram roubadas
```

---

## 📊 Informações Registradas

### Campos Padrão em Todos os Logs

| Campo | Exemplo | Por que é importante |
|-------|---------|----------------------|
| **Tipo de evento** | `[AUTH]` | Filtrar logs por categoria |
| **Ação** | `Login bem-sucedido`, `Login falhou` | Identificar tipo de evento |
| **Email** | `joao@example.com` | Rastrear conta afetada |
| **UserID** | `789` | Correlacionar com outras ações no sistema |
| **Role** | `user`, `admin` | Identificar privilégios do usuário |
| **IP** | `189.50.10.20` | Rastrear origem geográfica |
| **Timestamp** | `2026-02-17T10:30:00.000Z` | Ordenar eventos cronologicamente |
| **Erro** (se aplicável) | `Credenciais inválidas` | Diagnosticar problemas |

---

### Por que NÃO Logamos Senhas?

❌ **NUNCA** logue senhas em texto plano, nem hasheadas!

**Motivo:**
- **Violação de privacidade**: Senhas são dados ultra-sensíveis
- **Compliance**: LGPD/GDPR proíbem armazenar senhas em texto claro
- **Segurança**: Logs podem vazar (arquivos, backups, monitoramento)
- **Inútil**: Se atacante vê logs, já está dentro do sistema (comprometimento total)

**O que logar ao invés:**
```
✅ Correto:
[AUTH] Login falhou | Email: admin@example.com | Erro: Credenciais inválidas

❌ NUNCA FAÇA:
[AUTH] Login falhou | Email: admin@example.com | Senha testada: senha123
```

---

## 🔍 Como Usar os Logs

### 1. Monitoramento em Tempo Real

```bash
# Ver logs em tempo real
tail -f logs/combined.log | grep "[AUTH]"

# Filtrar apenas falhas de login
tail -f logs/combined.log | grep "Login falhou"

# Alertar sobre múltiplas falhas
tail -f logs/combined.log | grep "Login falhou" | awk '{print $10}' | \
  sort | uniq -c | awk '$1 > 5 {print "ALERTA: " $1 " tentativas de " $2}'
```

**Output:**
```
ALERTA: 15 tentativas de IP: 185.220.101.5
ALERTA: 8 tentativas de IP: 103.76.228.10
```

---

### 2. Análise de Padrões

```bash
# Contar logins por email
cat logs/combined.log | grep "Login bem-sucedido" | \
  awk -F'Email: ' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn

# Top 10 IPs com mais falhas de login
cat logs/combined.log | grep "Login falhou" | \
  awk -F'IP: ' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Logins por hora do dia
cat logs/combined.log | grep "Login bem-sucedido" | \
  awk '{print $2}' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c
```

---

### 3. Investigação de Incidente

**Cenário:** Usuário reporta: "Minha conta foi invadida!"

**Passos:**

```bash
# 1. Buscar todos os eventos do usuário
cat logs/combined.log | grep "joao@example.com"

# 2. Buscar logins bem-sucedidos
cat logs/combined.log | grep "joao@example.com" | grep "Login bem-sucedido"

# 3. Identificar IPs únicos usados
cat logs/combined.log | grep "joao@example.com" | grep "Login bem-sucedido" | \
  awk -F'IP: ' '{print $2}' | awk '{print $1}' | sort | uniq

# 4. Buscar mudanças de senha suspeitas
cat logs/combined.log | grep "UserID: 789" | grep "Senha atualizada"
```

**Output exemplo:**
```
# IPs usados:
189.50.10.20 (São Paulo, BR) - IP normal do usuário
103.76.228.10 (Pequim, CN) - IP suspeito! 🚨

# Timeline:
2026-02-16 14:00:00 - Login bem-sucedido | IP: 103.76.228.10 (China) 🚨
2026-02-16 14:05:00 - Senha atualizada | UserID: 789 🚨
2026-02-16 14:10:00 - Login falhou | IP: 189.50.10.20 (usuário real tentando entrar)

Conclusão: Conta comprometida por IP da China, senha foi alterada
```

---

### 4. Relatórios de Compliance

```javascript
// Script Node.js para gerar relatório mensal
const fs = require('fs');
const logs = fs.readFileSync('logs/combined.log', 'utf-8').split('\n');

const authEvents = logs.filter(line => line.includes('[AUTH]'));

const report = {
  periodo: 'Fevereiro 2026',
  total_logins_sucesso: authEvents.filter(l => l.includes('Login bem-sucedido')).length,
  total_logins_falha: authEvents.filter(l => l.includes('Login falhou')).length,
  novos_usuarios: authEvents.filter(l => l.includes('Novo usuário registrado')).length,
  mudancas_senha: authEvents.filter(l => l.includes('Senha atualizada')).length,
  ips_suspeitos: ['185.220.101.5', '103.76.228.10'], // IPs com >10 falhas
};

console.log('RELATÓRIO DE AUDITORIA - ' + report.periodo);
console.log('Logins bem-sucedidos:', report.total_logins_sucesso);
console.log('Tentativas falhas:', report.total_logins_falha);
console.log('Novos usuários:', report.novos_usuarios);
console.log('Mudanças de senha:', report.mudancas_senha);
console.log('IPs suspeitos:', report.ips_suspeitos.join(', '));

// Salvar relatório para auditor
fs.writeFileSync('relatorio_auditoria_fev2026.json', JSON.stringify(report, null, 2));
```

---

## 🚨 Padrões Suspeitos

### 1. Brute Force Attack

**Padrão:**
- Múltiplas falhas de login (>5) em curto período (<5 min)
- Mesmo email, mesmo IP
- Erros: "Credenciais inválidas"

**Exemplo:**
```
10:00:00 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:00:01 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:00:02 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:00:03 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
10:00:04 - [AUTH] Login falhou | Email: admin@example.com | IP: 192.168.1.100
```

**Ação:**
- Bloquear IP automaticamente (já feito pelo rate limiter)
- Alertar usuário real sobre tentativas
- Analisar origem do IP (VPN, Tor, botnet)

---

### 2. Credential Stuffing

**Padrão:**
- Falhas de login em **múltiplos emails diferentes**
- Mesmo IP
- Velocidade alta (automatizado)

**Exemplo:**
```
10:00:00 - [AUTH] Login falhou | Email: user1@example.com | IP: 185.220.101.5
10:00:01 - [AUTH] Login falhou | Email: user2@example.com | IP: 185.220.101.5
10:00:02 - [AUTH] Login falhou | Email: user3@example.com | IP: 185.220.101.5
10:00:03 - [AUTH] Login bem-sucedido | Email: user4@example.com | IP: 185.220.101.5 🚨
```

**Explicação:**
Atacante obteve lista de senhas vazadas (outro site) e testa em múltiplas contas (pessoas reutilizam senhas).

**Ação:**
- Bloquear IP
- Forçar reset de senha para user4@example.com (comprometido)
- Notificar todos os usuários para não reutilizar senhas

---

### 3. Viagem Impossível (Impossible Travel)

**Padrão:**
- Dois logins bem-sucedidos do **mesmo usuário**
- IPs de **locais geográficos distantes**
- **Intervalo de tempo** muito curto (fisicamente impossível)

**Exemplo:**
```
10:00:00 - [AUTH] Login bem-sucedido | Email: joao@example.com | IP: 189.50.10.20 (São Paulo, BR)
10:05:00 - [AUTH] Login bem-sucedido | Email: joao@example.com | IP: 185.220.101.5 (Moscou, RU)
```

**Análise:**
Distância São Paulo ↔ Moscou: ~11.500 km
Tempo: 5 minutos
Conclusão: **Impossível** - credenciais roubadas

**Ação:**
- Forçar logout de todas as sessões
- Exigir verificação de identidade (MFA, perguntas de segurança)
- Alertar usuário real
- Investigar como credenciais vazaram

---

### 4. Acesso Fora de Padrão

**Padrão:**
- Login bem-sucedido em **horário incomum** (3h AM quando usuário costuma acessar 9h-18h)
- IP de **país diferente** do habitual
- **Primeira vez** visto esse IP

**Exemplo:**
```
Padrão normal (últimos 30 dias):
09:00:00 - [AUTH] Login bem-sucedido | IP: 189.50.10.20 (São Paulo, BR)
09:00:00 - [AUTH] Login bem-sucedido | IP: 189.50.10.20 (São Paulo, BR)
...

Suspeito:
03:45:00 - [AUTH] Login bem-sucedido | IP: 103.76.228.10 (Pequim, CN) 🚨
```

**Ação:**
- Exigir MFA adicional
- Notificar usuário por email/SMS
- Monitorar atividades desta sessão
- Se atividade maliciosa detectada: revogar sessão

---

### 5. Sequestro de Conta

**Padrão:**
- Login bem-sucedido de IP suspeito
- Logo após: **senha é alterada**
- Logo após: usuário real **não consegue mais logar**

**Exemplo:**
```
15:00:00 - [AUTH] Login bem-sucedido | Email: joao@example.com | IP: 103.76.228.10 (China) 🚨
15:05:00 - [AUTH] Senha atualizada | UserID: 789 🚨
15:10:00 - [AUTH] Login falhou | Email: joao@example.com | IP: 189.50.10.20 (São Paulo - usuário real)
15:11:00 - [AUTH] Login falhou | Email: joao@example.com | IP: 189.50.10.20
```

**Ação urgente:**
- Recuperar conta via email
- Resetar senha
- Revogar todas as sessões do atacante
- Analisar o que foi acessado/modificado durante comprometimento
- Investigar origem do vazamento

---

## 📋 Compliance e Regulamentação

### LGPD (Brasil)

**Artigos relevantes:**

- **Art. 46:** Controlador deve adotar medidas de segurança técnicas adequadas
  - **Como atendemos:** Logs mostram medidas de segurança (rate limiting, validação)

- **Art. 48:** Comunicar à ANPD e ao titular sobre incidentes de segurança
  - **Como atendemos:** Logs permitem identificar escopo do incidente, quais dados foram acessados

- **Art. 50:** Controlador e operador devem manter registro das operações
  - **Como atendemos:** Logs de autenticação registram "quando, como e por que" dados foram acessados

**Penalidades:**
- Advertência
- Multa de até **R$ 50 milhões**
- Multa diária
- Publicização da infração
- Bloqueio dos dados pessoais
- Eliminação dos dados pessoais

---

### GDPR (União Europeia)

**Artigos relevantes:**

- **Art. 30:** Registros de atividades de tratamento
  - **Como atendemos:** Logs registram quem acessou dados, quando e de onde

- **Art. 32:** Segurança do tratamento
  - **Como atendemos:** Logs demonstram processos e medidas de segurança implementadas

- **Art. 33:** Notificação de violação à autoridade em 72 horas
  - **Como atendemos:** Logs permitem análise rápida do escopo do incidente

- **Art. 34:** Comunicação de violação ao titular
  - **Como atendemos:** Logs mostram quais titulares foram afetados

**Penalidades:**
- Advertência
- Multa de até **€20 milhões** ou **4% do faturamento anual global**

---

### PCI-DSS (Pagamentos com Cartão)

**Requisito 10: Rastrear e monitorar todos os acessos**

**10.1:** Implementar trilhas de auditoria
- ✅ **Atendemos:** Logs registram todos os eventos de autenticação

**10.2:** Processos automatizados de trilha de auditoria para:
- ✅ Acesso a dados de cartão: Login bem-sucedido
- ✅ Ações de administradores: Role=admin nos logs
- ✅ Tentativas de acesso: Login falhou
- ✅ Criação/exclusão de contas: Novo usuário registrado

**10.3:** Registrar pelo menos:
- ✅ Identificação do usuário: Email, UserID
- ✅ Tipo de evento: Login bem-sucedido, Login falhou
- ✅ Data e hora: Timestamp ISO 8601
- ✅ Origem: IP address

**10.6:** Revisar logs diariamente
- 📝 **Pendente:** Script automatizado de análise diária

**Penalidade:** Perda da certificação = **não pode processar cartões**

---

### SOX (Sarbanes-Oxley - EUA)

Para empresas públicas nos EUA:

**Seção 404:** Controles internos sobre relatórios financeiros
- **Como atendemos:** Logs de auditoria demonstram controle de acesso a sistemas financeiros

**Requisitos:**
- Rastreabilidade de quem acessou dados financeiros
- Não-repúdio (usuário não pode negar que acessou)
- Segregação de funções (logs mostram role=admin vs role=user)

---

## ✅ Boas Práticas

### 1. O que Logar

✅ **LOGAR:**
- Login bem-sucedido (com IP, timestamp)
- Login falhou (com IP, tentativa)
- Criação/exclusão de contas
- Mudanças de senha
- Mudanças de privilégios (user → admin)
- Logout
- Tentativas de acesso a recursos não autorizados
- Revogação de tokens/sessões

❌ **NUNCA LOGAR:**
- Senhas (texto plano ou hasheadas)
- Tokens JWT completos (apenas hash ou últimos 4 caracteres)
- Números de cartão de crédito completos
- Dados pessoais sensíveis (CPF, RG, etc.) desnecessariamente

---

### 2. Retenção de Logs

**Recomendações:**

| Tipo de Log | Retenção Mínima | Motivo |
|-------------|-----------------|--------|
| **Logs de autenticação** | 90 dias | Compliance (LGPD/GDPR) |
| **Logs de acesso a dados sensíveis** | 1 ano | Auditoria, investigações |
| **Logs de incidentes de segurança** | 7 anos | Requisitos legais, forenses |
| **Logs gerais (debug, info)** | 30 dias | Troubleshooting |

**LGPD:** Retenção apenas pelo tempo necessário, depois **deve ser deletado**.

**Implementação:**
```bash
# cron job para deletar logs antigos (executar diariamente)
find logs/ -name "*.log" -mtime +90 -delete
```

---

### 3. Proteção dos Próprios Logs

**Logs contêm dados sensíveis** (emails, IPs, padrões de comportamento)!

✅ **Proteger:**
- Permissões restritas (apenas root/admin)
- Armazenamento criptografado
- Backup em local seguro
- Acesso auditado (quem viu os logs?)

❌ **NÃO:**
- Deixar logs acessíveis publicamente
- Armazenar em servidor web (risco de vazamento)
- Compartilhar logs por email desprotegido

```bash
# Permissões corretas
chmod 600 logs/*.log  # Apenas owner pode ler/escrever
chown root:root logs/*.log

# Criptografar antes de backup
tar -czf logs-backup.tar.gz logs/
gpg --encrypt --recipient admin@empresa.com logs-backup.tar.gz
```

---

### 4. Centralização de Logs

**Problema:** Logs espalhados em múltiplos servidores/containers são difíceis de analisar.

**Solução:** Centralizar em sistema de gestão de logs (SIEM).

**Opções:**
- **ELK Stack** (Elasticsearch, Logstash, Kibana) - Open source
- **Splunk** - Comercial, poderoso
- **Graylog** - Open source, fácil de usar
- **AWS CloudWatch** - Para ambientes AWS
- **Azure Monitor** - Para ambientes Azure
- **Google Cloud Logging** - Para ambientes GCP

**Benefícios:**
- Busca rápida em milhões de logs
- Dashboards visuais (gráficos, mapas)
- Alertas automatizados (>10 falhas de login → email)
- Correlação de eventos (combinar logs de diferentes sistemas)

---

### 5. Alertas Automatizados

**Configurar alertas para:**

```yaml
# Exemplo de regra (SIEM)
alert: brute_force_attack
condition: count("[AUTH] Login falhou") > 10 em 5 minutos do mesmo IP
acao: 
  - enviar_email: security@empresa.com
  - enviar_slack: #security-alerts
  - bloquear_ip_automaticamente
  - criar_ticket_no_jira

alert: impossible_travel
condition: login bem-sucedido de 2 IPs distantes (>1000km) em <10 minutos
acao:
  - forcar_logout_todas_sessoes
  - exigir_mfa
  - enviar_sms: usuario_real
  - alertar_equipe_seguranca

alert: login_admin_fora_horario
condition: login bem-sucedido com role=admin entre 22h-6h
acao:
  - enviar_email: security@empresa.com
  - exigir_mfa_adicional
  - logar_com_alta_prioridade
```

---

### 6. Anonimização para Desenvolvimento

**Problema:** Desenvolvedores precisam de logs reais para debug, mas logs contêm dados pessoais.

**Solução:** Anonimizar logs antes de compartilhar.

```javascript
// Script de anonimização
const fs = require('fs');
const crypto = require('crypto');

function hashEmail(email) {
  return crypto.createHash('sha256').update(email).digest('hex').substring(0, 8);
}

function hashIP(ip) {
  const parts = ip.split('.');
  return parts.slice(0, 2).join('.') + '.XXX.XXX'; // Manter rede, ocultar host
}

const logs = fs.readFileSync('logs/combined.log', 'utf-8');
const anonLogs = logs
  .replace(/Email: ([^\s]+)/g, (match, email) => `Email: user_${hashEmail(email)}`)
  .replace(/IP: ([^\s]+)/g, (match, ip) => `IP: ${hashIP(ip)}`);

fs.writeFileSync('logs/combined_anon.log', anonLogs);

// Compartilhar combined_anon.log com desenvolvedores
```

**Resultado:**
```
Original:
[AUTH] Login bem-sucedido | Email: joao.silva@example.com | IP: 189.50.10.20

Anonimizado:
[AUTH] Login bem-sucedido | Email: user_a3f8b2e4 | IP: 189.50.XXX.XXX
```

---

## 📊 Métricas e KPIs

**Medir eficácia das medidas de segurança:**

### Taxa de Login Bem-Sucedido
```
Taxa = (Logins bem-sucedidos / Total de tentativas) × 100%

Meta: >95% (maioria dos usuários loga na primeira tentativa)
Valor baixo: Usuários esquecendo senhas (implementar reset fácil) ou ataques
```

### Tentativas de Brute Force Bloqueadas
```
Total de IPs bloqueados por rate limiting / mês

Meta: Tendência decrescente (atacantes aprenderam que não funciona)
Valor alto contínuo: Sistema é alvo frequente (analisar por quê)
```

### Tempo Médio de Detecção (MTTD)
```
MTTD = Tempo entre incidente ocorrer e ser detectado

Meta: <1 minuto (detecção em tempo real)
Valor alto: Melhorar alertas automatizados
```

### Tempo Médio de Resposta (MTTR)
```
MTTR = Tempo entre detecção e ação corretiva

Meta: <5 minutos para incidentes críticos
Valor alto: Melhorar processos de resposta a incidentes
```

---

## 🎯 Resumo Executivo

### Por que Auditoria é Essencial

| Benefício | Impacto |
|-----------|---------|
| **Detectar ataques** | Identificar brute force, credential stuffing em tempo real |
| **Investigar incidentes** | Descobrir como, quando e por que comprometimento ocorreu |
| **Compliance** | Atender LGPD, GDPR, PCI-DSS (evitar multas milionárias) |
| **Não-repúdio** | Provar quem fez o quê (responsabilização) |
| **Detectar comprometimento** | Viagem impossível, padrões suspeitos |

### Logs Implementados

✅ Login bem-sucedido (email, userID, role, IP, timestamp)  
✅ Login falhou (email, IP, erro, timestamp)  
✅ Novo usuário registrado (email, userID, role, timestamp)  
✅ Senha atualizada (userID, timestamp)

### Como Usar

```bash
# Ver logs em tempo real
tail -f logs/combined.log | grep "[AUTH]"

# Detectar brute force
cat logs/combined.log | grep "Login falhou" | awk '{print $10}' | sort | uniq -c

# Investigar usuário específico
cat logs/combined.log | grep "joao@example.com"
```

### Compliance

- **LGPD:** Atende Art. 46, 48, 50 (registro de operações, investigação de incidentes)
- **GDPR:** Atende Art. 30, 32, 33, 34 (segurança, notificação)
- **PCI-DSS:** Atende Requisito 10 (trilhas de auditoria)

### Próximos Passos

1. Implementar alertas automatizados (brute force, viagem impossível)
2. Centralizar logs em SIEM (ELK, Splunk, Graylog)
3. Criar dashboards visuais para monitoramento
4. Automatizar análise diária de logs
5. Implementar sistema de tickets para incidentes detectados

---

**Auditoria transforma segurança de reativa para proativa!** 🛡️
