/**
 * EXEMPLO: LOGS DE AUTENTICAÇÃO
 * 
 * Este arquivo demonstra os logs gerados pelo sistema de autenticação
 * em diferentes cenários.
 * 
 * Para executar: node examples/authLogs.js
 */

const chalk = require('chalk');

// Simulação de logs gerados pelo sistema
const exampleLogs = [
  {
    tipo: '1. CADASTRO DE NOVO USUÁRIO',
    cenario: 'Usuário João se cadastra no sistema',
    logs: [
      '[INFO] [AUTH] Novo usuário registrado | Email: joao@example.com | UserID: 123 | Role: user | Timestamp: 2026-02-17T10:30:00.000Z'
    ],
    explicacao: [
      '✅ Email registrado (para rastrear ações futuras)',
      '✅ UserID gerado (identificador único)',
      '✅ Role definido (user por padrão)',
      '✅ Timestamp preciso (quando ocorreu)',
      '',
      'Por que é importante:',
      '- Detectar criação em massa de contas (bots)',
      '- Rastreamento de origem de contas maliciosas',
      '- Compliance LGPD/GDPR (registrar criação de dados pessoais)'
    ]
  },
  {
    tipo: '2. LOGIN BEM-SUCEDIDO',
    cenario: 'Usuário João faz login com credenciais corretas',
    logs: [
      '[INFO] [AUTH] Login bem-sucedido | Email: joao@example.com | UserID: 123 | Role: user | IP: 189.50.10.20 | Timestamp: 2026-02-17T10:35:00.000Z'
    ],
    explicacao: [
      '✅ Email identificado',
      '✅ UserID confirmado',
      '✅ Role registrado (para auditoria de privilégios)',
      '✅ IP capturado (origem geográfica)',
      '✅ Timestamp registrado',
      '',
      'Por que é importante:',
      '- Rastrear QUEM acessou',
      '- Rastrear QUANDO acessou',
      '- Rastrear DE ONDE acessou (IP)',
      '- Detectar acessos não autorizados',
      '- Não-repúdio (provar que usuário fez algo)'
    ]
  },
  {
    tipo: '3. LOGIN FALHOU',
    cenario: 'Alguém tenta fazer login com senha errada',
    logs: [
      '[WARN] [AUTH] Login falhou | Email: joao@example.com | IP: 192.168.1.100 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:40:00.000Z'
    ],
    explicacao: [
      '⚠️  Nível WARN (alerta de possível problema)',
      '⚠️  Email tentado (pode ser ataque direcionado)',
      '⚠️  IP registrado (rastrear origem do ataque)',
      '⚠️  Erro genérico (não revela se email existe)',
      '⚠️  Timestamp para análise de padrões',
      '',
      'Por que é importante:',
      '- Detectar tentativas de brute force',
      '- Identificar ataques automatizados',
      '- Alertar usuário sobre tentativas suspeitas',
      '- Correlacionar com outros eventos de segurança'
    ]
  },
  {
    tipo: '4. ATAQUE BRUTE FORCE',
    cenario: 'Múltiplas tentativas de login do mesmo IP',
    logs: [
      '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:00.000Z',
      '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:01.000Z',
      '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:02.000Z',
      '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:03.000Z',
      '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T10:50:04.000Z',
      '[WARN] BRUTE_FORCE_BLOCKED: IP 185.220.101.5 - Email: admin@example.com'
    ],
    explicacao: [
      '🚨 PADRÃO DETECTADO: Ataque Brute Force',
      '🚨 5 tentativas em 5 segundos',
      '🚨 Mesmo email + Mesmo IP = Ataque automatizado',
      '🚨 Rate limiter bloqueou após 5 tentativas',
      '',
      'Ações automáticas tomadas:',
      '✅ IP bloqueado por 15 minutos',
      '✅ Alerta enviado para equipe de segurança',
      '✅ Usuário real notificado sobre tentativas',
      '',
      'Análise:',
      '- IP 185.220.101.5 → Verificar geolocalização',
      '- Email admin@example.com → Conta privilegiada (alvo comum)',
      '- Velocidade de 1 tent/seg → Script automatizado',
      '- Bloqueio preveniu até 43.200 tentativas em 12 horas'
    ]
  },
  {
    tipo: '5. VIAGEM IMPOSSÍVEL',
    cenario: 'Usuário faz login de locais geograficamente distantes em tempo curto',
    logs: [
      '[INFO] [AUTH] Login bem-sucedido | Email: maria@example.com | UserID: 456 | Role: user | IP: 189.50.10.20 | Timestamp: 2026-02-17T11:00:00.000Z',
      '[INFO] [AUTH] Login bem-sucedido | Email: maria@example.com | UserID: 456 | Role: user | IP: 103.76.228.10 | Timestamp: 2026-02-17T11:05:00.000Z'
    ],
    explicacao: [
      '🚨 PADRÃO SUSPEITO: Impossible Travel',
      '',
      'Análise geográfica:',
      '- 11:00:00 → IP 189.50.10.20 (São Paulo, Brasil)',
      '- 11:05:00 → IP 103.76.228.10 (Pequim, China)',
      '',
      'Distância: ~19.000 km',
      'Tempo: 5 minutos',
      'Conclusão: IMPOSSÍVEL fisicamente!',
      '',
      '🚨 ALERTA: Credenciais comprometidas!',
      '',
      'Ações recomendadas:',
      '1. Forçar logout de todas as sessões',
      '2. Exigir MFA adicional',
      '3. Notificar usuária real (maria@example.com)',
      '4. Investigar como credenciais foram roubadas',
      '5. Analisar atividades realizadas na sessão suspeita',
      '',
      'Como detectar automaticamente:',
      '- Calcular distância entre IPs consecutivos',
      '- Se distância > 500km E tempo < 1 hora: ALERTA',
      '- Implementar com API de geolocalização (MaxMind, IPinfo)'
    ]
  },
  {
    tipo: '6. COMPROMETIMENTO DE CONTA',
    cenario: 'Atacante invade conta e troca senha',
    logs: [
      '[INFO] [AUTH] Login bem-sucedido | Email: carlos@example.com | UserID: 789 | Role: admin | IP: 103.76.228.10 | Timestamp: 2026-02-17T03:45:00.000Z',
      '[INFO] [AUTH] Senha atualizada | UserID: 789 | Timestamp: 2026-02-17T03:50:00.000Z',
      '[WARN] [AUTH] Login falhou | Email: carlos@example.com | IP: 189.50.10.20 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T09:00:00.000Z',
      '[WARN] [AUTH] Login falhou | Email: carlos@example.com | IP: 189.50.10.20 | Erro: Credenciais inválidas | Timestamp: 2026-02-17T09:01:00.000Z'
    ],
    explicacao: [
      '🚨 INCIDENTE DE SEGURANÇA: Comprometimento de Conta',
      '',
      'Timeline do ataque:',
      '03:45 → Login de IP suspeito (China, horário incomum)',
      '03:50 → Atacante troca senha (bloqueia usuário real)',
      '09:00 → Usuário real tenta logar e FALHA',
      '09:01 → Usuário real tenta novamente e FALHA',
      '',
      'Indicadores de comprometimento:',
      '🚨 Horário: 3:45 AM (admin nunca acessa de madrugada)',
      '🚨 IP: 103.76.228.10 (China - admin sempre acessa do Brasil)',
      '🚨 Role: admin (conta privilegiada = alvo de alto valor)',
      '🚨 Ação: Senha alterada logo após login (comportamento de atacante)',
      '🚨 Vítima: Usuário real não consegue mais acessar',
      '',
      'Ações de resposta ao incidente:',
      '1. ⚡ URGENTE: Recuperar conta via email de recuperação',
      '2. ⚡ URGENTE: Resetar senha e exigir nova senha forte',
      '3. ⚡ URGENTE: Revogar TODAS sessões (incluindo do atacante)',
      '4. 🔍 Investigar o que foi acessado/modificado entre 03:45-09:00',
      '5. 🔍 Verificar se dados foram exfiltrados',
      '6. 🔍 Analisar como credenciais foram roubadas (phishing? keylogger? vazamento?)',
      '7. 📧 Notificar usuário sobre comprometimento',
      '8. 🛡️  Ativar 2FA obrigatório para contas admin',
      '9. 📊 Gerar relatório de incidente para compliance (LGPD Art. 48)',
      '',
      'Prevenção futura:',
      '- Exigir MFA para contas admin',
      '- Alertar usuário quando senha é alterada (email/SMS)',
      '- Bloquear login de países não autorizados',
      '- Treinar usuários sobre phishing'
    ]
  },
  {
    tipo: '7. MUDANÇA DE SENHA',
    cenario: 'Usuário atualiza sua senha voluntariamente',
    logs: [
      '[INFO] [AUTH] Senha atualizada | UserID: 123 | Timestamp: 2026-02-17T14:30:00.000Z'
    ],
    explicacao: [
      '✅ Mudança legítima de senha',
      '',
      'Informações registradas:',
      '- UserID: 123 (quem mudou)',
      '- Timestamp: 2026-02-17T14:30:00.000Z (quando)',
      '',
      'Nota de segurança:',
      '⚠️  Senha antiga/nova NÃO são logadas (privacidade/segurança)',
      '⚠️  Apenas o EVENTO de mudança é registrado',
      '',
      'Por que é importante:',
      '- Detectar mudanças não autorizadas (atacante trocando senha)',
      '- Invalidar tokens antigos (sessions criadas antes da mudança)',
      '- Notificar usuário sobre mudança (email: "Sua senha foi alterada")',
      '- Compliance (rastreamento de mudanças em dados de autenticação)',
      '',
      'Ações automáticas:',
      '✅ password_changed_at atualizado no banco',
      '✅ Tokens JWT antigos marcados como inválidos',
      '✅ Email de confirmação enviado ao usuário',
      '✅ Se mudança de IP suspeito: alerta enviado'
    ]
  }
];

// Função para exibir logs formatados
function displayLogs() {
  console.log('\n' + '='.repeat(100));
  console.log(chalk.bold.cyan('📋 EXEMPLOS DE LOGS DE AUTENTICAÇÃO'));
  console.log('='.repeat(100) + '\n');
  
  exampleLogs.forEach((example, index) => {
    console.log(chalk.bold.yellow(`\n${example.tipo}`));
    console.log(chalk.gray('─'.repeat(100)));
    console.log(chalk.italic(`Cenário: ${example.cenario}\n`));
    
    console.log(chalk.bold('Logs gerados:'));
    example.logs.forEach(log => {
      if (log.includes('[ERROR]')) {
        console.log(chalk.red(log));
      } else if (log.includes('[WARN]')) {
        console.log(chalk.yellow(log));
      } else {
        console.log(chalk.green(log));
      }
    });
    
    console.log(chalk.bold('\n📝 Explicação:'));
    example.explicacao.forEach(linha => {
      if (linha.startsWith('🚨')) {
        console.log(chalk.bold.red(linha));
      } else if (linha.startsWith('✅')) {
        console.log(chalk.green(linha));
      } else if (linha.startsWith('⚠️')) {
        console.log(chalk.yellow(linha));
      } else if (linha.startsWith('⚡')) {
        console.log(chalk.bold.red(linha));
      } else if (linha.startsWith('🔍')) {
        console.log(chalk.cyan(linha));
      } else if (linha.startsWith('📧') || linha.startsWith('🛡️') || linha.startsWith('📊')) {
        console.log(chalk.blue(linha));
      } else {
        console.log(linha);
      }
    });
    
    if (index < exampleLogs.length - 1) {
      console.log('\n' + chalk.gray('─'.repeat(100)));
    }
  });
  
  console.log('\n' + '='.repeat(100));
  console.log(chalk.bold.cyan('🎯 RESUMO'));
  console.log('='.repeat(100));
  console.log(`
${chalk.bold('Logs implementados:')}
✅ Cadastro de novo usuário
✅ Login bem-sucedido
✅ Login falhou
✅ Mudança de senha

${chalk.bold('Informações registradas:')}
✅ Email (quem)
✅ UserID (identificação única)
✅ Role (privilégios)
✅ IP (de onde)
✅ Timestamp (quando)
✅ Erro (diagnóstico)

${chalk.bold('Casos de uso:')}
✅ Detectar brute force (múltiplas falhas)
✅ Detectar viagem impossível (IPs distantes)
✅ Investigar comprometimento de contas
✅ Compliance LGPD/GDPR/PCI-DSS
✅ Não-repúdio (provar ações)

${chalk.bold('Como analisar logs:')}
# Ver logs em tempo real
tail -f logs/combined.log | grep "[AUTH]"

# Detectar brute force
cat logs/combined.log | grep "Login falhou" | awk '{print \\$10}' | sort | uniq -c

# Investigar usuário específico
cat logs/combined.log | grep "joao@example.com"

# Top 10 IPs com mais falhas
cat logs/combined.log | grep "Login falhou" | awk -F'IP: ' '{print \\$2}' | awk '{print \\$1}' | sort | uniq -c | sort -rn | head -10

${chalk.bold('Documentação completa:')}
📖 ${chalk.cyan('AUDITORIA.md')} - Explicação completa de auditoria
📖 ${chalk.cyan('RATE_LIMITING.md')} - Proteção contra brute force
  `);
  console.log('='.repeat(100) + '\n');
}

// Função para demonstrar análise de logs
function demonstrateLogAnalysis() {
  console.log('\n' + '='.repeat(100));
  console.log(chalk.bold.cyan('🔍 DEMONSTRAÇÃO: ANÁLISE DE LOGS PARA DETECTAR ATAQUES'));
  console.log('='.repeat(100) + '\n');
  
  console.log(chalk.bold('Cenário: Analista de segurança investigando logs suspeitos\n'));
  
  // Simular logs
  const mockLogs = [
    '[INFO] [AUTH] Login bem-sucedido | Email: alice@example.com | IP: 189.50.10.20 | Timestamp: 2026-02-17T09:00:00.000Z',
    '[INFO] [AUTH] Login bem-sucedido | Email: bob@example.com | IP: 189.50.10.21 | Timestamp: 2026-02-17T09:05:00.000Z',
    '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Timestamp: 2026-02-17T10:50:00.000Z',
    '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Timestamp: 2026-02-17T10:50:01.000Z',
    '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Timestamp: 2026-02-17T10:50:02.000Z',
    '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Timestamp: 2026-02-17T10:50:03.000Z',
    '[WARN] [AUTH] Login falhou | Email: admin@example.com | IP: 185.220.101.5 | Timestamp: 2026-02-17T10:50:04.000Z',
    '[INFO] [AUTH] Login bem-sucedido | Email: carlos@example.com | IP: 103.76.228.10 | Timestamp: 2026-02-17T03:45:00.000Z',
  ];
  
  console.log(chalk.bold('Passo 1: Filtrar apenas eventos de autenticação\n'));
  console.log(chalk.gray('Comando: grep "[AUTH]" logs/combined.log\n'));
  mockLogs.forEach(log => console.log(log));
  
  console.log(chalk.bold('\n\nPasso 2: Identificar falhas de login\n'));
  console.log(chalk.gray('Comando: grep "Login falhou" logs/combined.log\n'));
  const failures = mockLogs.filter(log => log.includes('Login falhou'));
  failures.forEach(log => console.log(chalk.yellow(log)));
  
  console.log(chalk.bold('\n\nPasso 3: Contar falhas por IP\n'));
  console.log(chalk.gray('Comando: grep "Login falhou" | awk -F\'IP: \' \'{print $2}\' | awk \'{print $1}\' | sort | uniq -c\n'));
  const ipCounts = { '185.220.101.5': 5 };
  Object.entries(ipCounts).forEach(([ip, count]) => {
    console.log(chalk.bold.red(`${count} falhas → IP: ${ip} 🚨 SUSPEITO!`));
  });
  
  console.log(chalk.bold('\n\nPasso 4: Investigar logins em horários suspeitos\n'));
  console.log(chalk.gray('Buscar logins entre 00:00-06:00 (madrugada)\n'));
  const suspiciousTime = mockLogs.filter(log => {
    const match = log.match(/T(\d{2}):/);
    return match && parseInt(match[1]) < 6 && log.includes('Login bem-sucedido');
  });
  suspiciousTime.forEach(log => console.log(chalk.red(log + ' 🚨 HORÁRIO SUSPEITO!')));
  
  console.log(chalk.bold('\n\n📊 RELATÓRIO DE ANÁLISE'));
  console.log('─'.repeat(100));
  console.log(`
${chalk.bold.red('🚨 AMEAÇAS DETECTADAS:')}

1. ${chalk.bold('Ataque Brute Force')}
   - IP: 185.220.101.5
   - Tentativas: 5 falhas em 5 segundos
   - Alvo: admin@example.com (conta privilegiada)
   - Status: ${chalk.green('BLOQUEADO pelo rate limiter')}
   - Ação: Banir IP permanentemente, alertar usuário

2. ${chalk.bold('Login em Horário Suspeito')}
   - Email: carlos@example.com
   - IP: 103.76.228.10 (Pequim, China)
   - Horário: 03:45 AM
   - Status: ${chalk.yellow('INVESTIGAÇÃO NECESSÁRIA')}
   - Ação: Verificar se é padrão normal do usuário ou comprometimento

${chalk.bold.green('✅ LOGINS NORMAIS:')}
- alice@example.com: Login normal (9h AM, IP brasileiro)
- bob@example.com: Login normal (9h AM, IP brasileiro)

${chalk.bold('📋 RECOMENDAÇÕES:')}
1. Bloquear permanentemente IP 185.220.101.5
2. Enviar alerta para carlos@example.com sobre login suspeito
3. Exigir MFA adicional para próximo login de carlos@example.com
4. Monitorar atividades de carlos@example.com na sessão das 3:45 AM
5. Gerar relatório de incidente para compliance
  `);
  console.log('='.repeat(100) + '\n');
}

// Executar demonstrações
if (require.main === module) {
  displayLogs();
  demonstrateLogAnalysis();
  
  console.log(chalk.bold.cyan('📚 Para mais informações, consulte:'));
  console.log(chalk.cyan('  - AUDITORIA.md (documentação completa)'));
  console.log(chalk.cyan('  - RATE_LIMITING.md (proteção brute force)'));
  console.log(chalk.cyan('  - src/services/authService.js (implementação dos logs)\n'));
}

module.exports = { exampleLogs };
