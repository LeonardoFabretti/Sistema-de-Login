# 📋 EXEMPLO: LOGS DE AUTENTICAÇÃO EM PRODUÇÃO

Este arquivo mostra como os logs aparecem em um ambiente real de produção.

---

## 🎬 Cenário: Dia Normal de Trabalho

### Manhã (9h-12h) - Usuários fazendo login

```
[INFO] [AUTH] Login bem-sucedido | Email: alice@empresa.com | UserID: 101 | Role: user | IP: 189.50.10.20 | Timestamp: 2026-02-17T09:00:15.234Z
[INFO] [AUTH] Login bem-sucedido | Email: bob@empresa.com | UserID: 102 | Role: user | IP: 189.50.10.21 | Timestamp: 2026-02-17T09:05:42.567Z
[INFO] [AUTH] Login bem-sucedido | Email: carol@empresa.com | UserID: 103 | Role: admin | IP: 189.50.10.22 | Timestamp: 2026-02-17T09:10:33.891Z
[WARN] [AUTH] Login falhou | Email: david@empresa.com | IP: 189.50.10.23 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T09:15:12.345Z
[INFO] [AUTH] Login bem-sucedido | Email: david@empresa.com | UserID: 104 | Role: user | IP: 189.50.10.23 | Timestamp: 2026-02-17T09:15:45.678Z
```

**Análise:**
- ✅ 4 logins bem-sucedidos (Alice, Bob, Carol, David)
- ✅ 1 falha de login (David errou senha na primeira tentativa, acertou na segunda)
- ✅ Todos os IPs são da rede corporativa (189.50.10.*)
- ✅ Horário normal de trabalho (9h AM)
- ✅ Carol tem role=admin (conta privilegiada)

**Conclusão:** Atividade normal, sem anomalias

---

## 🚨 Cenário: Tentativa de Ataque Brute Force

### Às 10:50 AM - Múltiplas tentativas suspeitas

```
[WARN] [AUTH] Login falhou | Email: admin@empresa.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:00.123Z
[WARN] [AUTH] Login falhou | Email: admin@empresa.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:01.456Z
[WARN] [AUTH] Login falhou | Email: admin@empresa.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:02.789Z
[WARN] [AUTH] Login falhou | Email: admin@empresa.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:03.012Z
[WARN] [AUTH] Login falhou | Email: admin@empresa.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:04.345Z
[WARN] BRUTE_FORCE_BLOCKED: IP 185.220.101.5 - Email: admin@empresa.com
```

**Análise:**
- 🚨 5 tentativas em 5 segundos (1 por segundo)
- 🚨 Mesmo email: admin@empresa.com (conta privilegiada)
- 🚨 Mesmo IP: 185.220.101.5
- 🚨 Intervalo regular de 1 segundo = Script automatizado
- 🚨 IP desconhecido (não é da rede corporativa 189.50.10.*)

**Geolocalização do IP 185.220.101.5:**
```
ISP: Digital Ocean (VPS comum para ataques)
País: Rússia
Cidade: Moscou
Tipo: Data Center (não é IP residencial)
```

**Conclusão:** 🚨 **ATAQUE BRUTE FORCE DETECTADO!**

**Ações automáticas:**
✅ Rate limiter bloqueou IP após 5 tentativas
✅ Log de BRUTE_FORCE_BLOCKED gerado
✅ IP bloqueado por 15 minutos
✅ Alerta enviado para equipe de segurança
✅ Email enviado para admin@empresa.com: "Tentativas suspeitas detectadas"

**Ações manuais recomendadas:**
1. Banir IP 185.220.101.5 permanentemente (firewall)
2. Verificar se admin@empresa.com usa senha forte
3. Ativar MFA obrigatório para contas admin
4. Adicionar Digital Ocean VPS ao blocklist

---

## 🌍 Cenário: Viagem Impossível (Impossible Travel)

### Às 11:00 AM - Login de locais distantes em tempo curto

```
[INFO] [AUTH] Login bem-sucedido | Email: maria@empresa.com | UserID: 105 | Role: user | IP: 189.50.10.24 | Timestamp: 2026-02-17T11:00:00.000Z
[INFO] [AUTH] Login bem-sucedido | Email: maria@empresa.com | UserID: 105 | Role: user | IP: 103.76.228.10 | Timestamp: 2026-02-17T11:05:00.000Z
```

**Análise geográfica:**

**Login 1:**
- IP: 189.50.10.24
- Localização: São Paulo, Brasil
- Timestamp: 11:00:00

**Login 2:**
- IP: 103.76.228.10
- Localização: Pequim, China
- Timestamp: 11:05:00

**Cálculo:**
- Distância: ~19.000 km
- Tempo: 5 minutos
- Velocidade necessária: ~228.000 km/h (Mach 187!)
- Comparação: Avião comercial mais rápido = 1.000 km/h

**Conclusão:** 🚨 **IMPOSSÍVEL FISICAMENTE!** Credenciais comprometidas!

**Ações urgentes:**
1. ⚡ Forçar logout de TODAS as sessões de maria@empresa.com
2. ⚡ Resetar senha imediatamente
3. ⚡ Exigir verificação de identidade (perguntas de segurança, email, telefone)
4. 📧 Notificar maria@empresa.com por email E SMS
5. 🔍 Investigar: Como as credenciais foram roubadas? (phishing? malware? vazamento?)
6. 🔍 Auditar ações realizadas na sessão das 11:05 (IP chinês)
7. 🛡️ Ativar MFA obrigatório para maria@empresa.com

---

## 🔐 Cenário: Sequestro de Conta (Account Takeover)

### Madrugada (3h AM) - Atividade suspeita

```
[INFO] [AUTH] Login bem-sucedido | Email: carlos@empresa.com | UserID: 106 | Role: admin | IP: 103.76.228.10 | Timestamp: 2026-02-17T03:45:23.456Z
[INFO] [AUTH] Senha atualizada | UserID: 106 | Timestamp: 2026-02-17T03:50:15.789Z
```

### Manhã (9h AM) - Usuário real tenta acessar

```
[WARN] [AUTH] Login falhou | Email: carlos@empresa.com | IP: 189.50.10.25 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T09:00:12.345Z
[WARN] [AUTH] Login falhou | Email: carlos@empresa.com | IP: 189.50.10.25 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T09:00:45.678Z
[WARN] [AUTH] Login falhou | Email: carlos@empresa.com | IP: 189.50.10.25 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T09:01:23.901Z
```

**Timeline do incidente:**

```
03:45 → Login de IP 103.76.228.10 (Pequim, China) 🚨
        Padrão normal de Carlos: 189.50.10.25 (São Paulo, Brasil)
        
03:50 → Senha alterada 🚨
        Atacante bloqueia acesso do usuário real
        
09:00 → Carlos (usuário real) tenta logar
        Senha não funciona mais (atacante trocou)
        
09:00 → Tentativa 2 - Falha
09:01 → Tentativa 3 - Falha
```

**Análise:**

**Indicadores de comprometimento:**
1. 🚨 Horário incomum: 3:45 AM (Carlos nunca acessa de madrugada)
2. 🚨 IP suspeito: China (Carlos sempre acessa do Brasil)
3. 🚨 Comportamento de atacante: Trocar senha logo após login (bloquear usuário real)
4. 🚨 Conta privilegiada: role=admin (alvo de alto valor)
5. 🚨 Vítima confirmada: Usuário real não consegue mais logar

**Conclusão:** 🚨 **SEQUESTRO DE CONTA CONFIRMADO!**

**Resposta ao incidente:**

**URGENTE (primeiros 15 minutos):**
1. ⚡ Revogar TODAS as sessões de UserID 106
2. ⚡ Recuperar conta via email de recuperação
3. ⚡ Resetar senha via link seguro
4. ⚡ Verificar identidade de Carlos (ligar, perguntas de segurança)
5. ⚡ Bloquear IP 103.76.228.10 no firewall

**Investigação (primeiras 2 horas):**
6. 🔍 Auditar TUDO que foi feito entre 03:45-09:00
   - Dados acessados?
   - Dados modificados?
   - Dados exfiltrados?
   - Novos usuários criados?
   - Privilégios alterados?
7. 🔍 Verificar logs de banco de dados
8. 🔍 Verificar logs de firewall
9. 🔍 Analisar como credenciais foram roubadas:
   - Email de phishing?
   - Malware/keylogger?
   - Vazamento de banco de dados?
   - Senha reutilizada de outro site?

**Mitigação (primeiras 24 horas):**
10. 🛡️ Ativar MFA obrigatório para Carlos
11. 🛡️ Ativar MFA para TODAS as contas admin
12. 📧 Notificar todos os usuários sobre incidente
13. 📧 Treinar usuários sobre phishing
14. 📊 Gerar relatório de incidente para LGPD (Art. 48)
15. 📊 Notificar ANPD se dados pessoais foram acessados

**Lições aprendidas:**
- MFA seria ter prevenido o ataque (atacante não tem segundo fator)
- Alertas de login de IPs suspeitos deveriam existir
- Mudança de senha deveria exigir senha atual (atacante não saberia)

---

## 📊 Cenário: Novo Usuário se Cadastrando

### Meio-dia (12h PM) - Cadastro legítimo

```
[INFO] [AUTH] Novo usuário registrado | Email: eva@empresa.com | UserID: 107 | Role: user | Timestamp: 2026-02-17T12:00:00.123Z
[INFO] [AUTH] Login bem-sucedido | Email: eva@empresa.com | UserID: 107 | Role: user | IP: 189.50.10.26 | Timestamp: 2026-02-17T12:00:05.456Z
```

**Análise:**
- ✅ Novo usuário Eva se cadastrou
- ✅ Recebeu UserID 107
- ✅ Role user (não privilegiado, padrão correto)
- ✅ Login automático após cadastro (comportamento esperado)
- ✅ IP da rede corporativa (189.50.10.26)

**Conclusão:** Cadastro legítimo, sem anomalias

---

## 🤖 Cenário: Ataque de Criação em Massa de Contas

### Às 14h PM - Spam de contas

```
[INFO] [AUTH] Novo usuário registrado | Email: bot1234@tempmail.com | UserID: 108 | Role: user | Timestamp: 2026-02-17T14:00:00.100Z
[INFO] [AUTH] Novo usuário registrado | Email: bot1235@tempmail.com | UserID: 109 | Role: user | Timestamp: 2026-02-17T14:00:01.200Z
[INFO] [AUTH] Novo usuário registrado | Email: bot1236@tempmail.com | UserID: 110 | Role: user | Timestamp: 2026-02-17T14:00:02.300Z
[INFO] [AUTH] Novo usuário registrado | Email: bot1237@tempmail.com | UserID: 111 | Role: user | Timestamp: 2026-02-17T14:00:03.400Z
[INFO] [AUTH] Novo usuário registrado | Email: bot1238@tempmail.com | UserID: 112 | Role: user | Timestamp: 2026-02-17T14:00:04.500Z
... (100 contas em 2 minutos)
```

**Análise:**
- 🚨 100 contas criadas em 2 minutos
- 🚨 Emails sequenciais: bot1234, bot1235, bot1236...
- 🚨 Domínio: tempmail.com (emails descartáveis)
- 🚨 Intervalo regular: 1 segundo (script automatizado)

**Conclusão:** 🚨 **ATAQUE DE SPAM DE CONTAS!**

**Objetivos possíveis do atacante:**
- Inflar métricas (número de usuários)
- Abuso de recursos (consumir storage)
- Preparar contas para spam futuro
- Explorar bônus de cadastro (se houver)

**Ações:**
1. ⚡ Bloquear criação de contas de tempmail.com
2. ⚡ Implementar CAPTCHA no registro
3. ⚡ Exigir verificação de email (clicar link de confirmação)
4. ⚡ Rate limit mais agressivo: 1 cadastro/hora por IP
5. 🔍 Deletar contas bot1234-bot1338 (contas falsas)
6. 🛡️ Adicionar tempmail.com, guerrillamail.com à blocklist

---

## 📈 Análise: Padrões ao Longo do Dia

### Distribuição de logins por hora:

```
Hora    | Logins | Falhas | Taxa de Sucesso
--------|--------|--------|----------------
00-06h  |    2   |   0    | 100%   🚨 Suspeito (madrugada)
06-09h  |   45   |   3    |  93%   ✅ Normal (início do expediente)
09-12h  |  120   |   8    |  94%   ✅ Normal (pico da manhã)
12-14h  |   30   |   2    |  94%   ✅ Normal (depois do almoço)
14-18h  |  100   |   6    |  94%   ✅ Normal (tarde)
18-24h  |   15   |   1    |  94%   ✅ Normal (fim do expediente)

TOTAL   |  312   |  20    |  94%
```

**Análise:**
- ✅ Taxa de sucesso global: 94% (excelente - usuários sabem suas senhas)
- 🚨 2 logins entre 0-6h AM (fora do padrão, investigar)
- ✅ Pico entre 9-12h (horário de trabalho normal)
- ✅ 20 falhas é aceitável (usuários errando senha ocasionalmente)

### Logins por região (IP Geolocation):

```
País          | Logins | Porcentagem
--------------|--------|------------
Brasil        |  300   |  96%   ✅ Esperado
Estados Unidos|    8   |   2.5% ⚠️  Verificar (escritório nos EUA?)
China         |    2   |   0.6% 🚨 SUSPEITO
Rússia        |    2   |   0.6% 🚨 SUSPEITO

TOTAL         |  312   | 100%
```

**Análise:**
- ✅ 96% dos logins do Brasil (esperado, empresa brasileira)
- ⚠️ 8 logins dos EUA (verificar se há escritório/parceiros)
- 🚨 4 logins de China+Rússia (provavelmente ataques)

**Ação:**
- Bloquear logins de China e Rússia (se não há operações lá)
- Implementar geofencing: Permitir apenas Brasil e EUA
- Exigir MFA para logins fora do Brasil

---

## 🎯 Resumo do Dia

### Estatísticas:

```
Total de eventos de autenticação: 332
├── Logins bem-sucedidos: 312 (94%)
├── Login falhou: 15 (4.5%)
├── Novos usuários: 105 (31.6%)
└── Senhas atualizadas: 3 (0.9%)

Incidentes detectados: 4
├── Brute force: 1 (bloqueado automaticamente)
├── Viagem impossível: 1 (credenciais comprometidas)
├── Sequestro de conta: 1 (conta recuperada)
└── Spam de contas: 1 (contas deletadas)

Ações tomadas:
✅ 3 IPs bloqueados permanentemente
✅ 2 contas recuperadas (reset de senha)
✅ 100 contas falsas deletadas
✅ MFA ativado para 5 usuários
✅ 4 relatórios de incidente gerados
```

### Eficácia das medidas de segurança:

```
✅ Rate limiting: Bloqueou 1 ataque brute force
✅ Logs de auditoria: Detectou 4 incidentes
✅ Alertas automáticos: Enviou 4 notificações
✅ Geolocalização: Identificou 4 logins suspeitos
✅ Tempo de detecção: Média de 2 minutos
✅ Tempo de resposta: Média de 15 minutos
```

**Conclusão:** Sistema de auditoria funcionando perfeitamente! 🎉

---

## 📚 Como Ler os Logs

### Formato padrão:

```
[NÍVEL] [CATEGORIA] Ação | Campo1: Valor1 | Campo2: Valor2 | Timestamp: ISO8601
```

### Exemplos:

```
[INFO]  [AUTH] Login bem-sucedido | Email: user@example.com | UserID: 123 | Role: user | IP: 189.50.10.20 | Timestamp: 2026-02-17T10:00:00.000Z
 ^       ^      ^                   ^                         ^              ^           ^                   ^
 |       |      |                   |                         |              |           |                   |
Nível  Cat.   Ação                Email                     UserID         Role         IP               Quando
```

### Níveis:

- **INFO**: Operação normal (login, cadastro)
- **WARN**: Alerta (falha de login, tentativa suspeita)
- **ERROR**: Erro (exceção, falha do sistema)

### Categorias:

- **[AUTH]**: Autenticação (login, cadastro, logout)
- **[ACCESS]**: Controle de acesso (permissões negadas)
- **[DB]**: Banco de dados (queries, erros)

---

**Para documentação completa, consulte [AUDITORIA.md](AUDITORIA.md)**
