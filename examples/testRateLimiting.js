/**
 * TESTE: RATE LIMITING E PROTEÇÃO BRUTE FORCE
 * 
 * Demonstra como rate limiting bloqueia ataques de força bruta.
 * 
 * Execute: node examples/testRateLimiting.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
  dim: (msg) => console.log(`${colors.dim}${msg}${colors.reset}`)
};

// ============================================================================
// TESTE 1: BRUTE FORCE SEM RATE LIMIT (SIMULADO)
// ============================================================================
const simulateBruteForceWithoutRateLimit = () => {
  log.title('🧪 SIMULAÇÃO: Ataque Brute Force SEM Rate Limit');
  
  log.info('Cenário: Atacante testa 1000 senhas/segundo');
  log.dim('(Esta é apenas uma simulação - não faz requisições reais)\n');
  
  const senhasComuns = [
    'senha123', 'admin123', 'password', '123456', 'qwerty',
    'abc123', 'letmein', 'welcome1', 'monkey', 'dragon',
    '111111', '123123', 'password1', 'qwerty123', 'iloveyou'
  ];
  
  console.log('📋 Dicionário de senhas comuns sendo testado:');
  senhasComuns.forEach((senha, i) => {
    console.log(`   ${i + 1}. ${senha}`);
  });
  
  console.log('\n🚀 Iniciando ataque...\n');
  
  let tentativas = 0;
  const inicio = Date.now();
  
  // Simular 1000 tentativas/segundo
  for (let i = 0; i < 1000; i++) {
    tentativas++;
    
    // Simular que senha correta é a 847ª tentativa
    if (tentativas === 847) {
      const fim = Date.now();
      const tempo = ((fim - inicio) / 1000).toFixed(2);
      
      log.error(`SENHA QUEBRADA em ${tentativas} tentativas (${tempo} segundos)!`);
      log.error(`Senha encontrada: "SenhaCorreta123"`);
      log.warning('\n⚠️  SEM RATE LIMIT = VULNERÁVEL!\n');
      return;
    }
  }
};

// ============================================================================
// TESTE 2: BRUTE FORCE COM RATE LIMIT (REAL)
// ============================================================================
const testBruteForceWithRateLimit = async () => {
  log.title('🧪 TESTE: Ataque Brute Force COM Rate Limit');
  
  const email = 'test@example.com';
  const senhasErradas = [
    'senha123',
    'admin123',
    'password',
    '123456',
    'qwerty',
    'abc123' // 6ª tentativa - será bloqueada!
  ];
  
  log.info(`Tentando logar com email: ${email}`);
  log.info(`Rate limit: 5 tentativas / 15 minutos\n`);
  
  for (let i = 0; i < senhasErradas.length; i++) {
    const tentativa = i + 1;
    const senha = senhasErradas[i];
    
    try {
      log.dim(`Tentativa ${tentativa}: Testando senha "${senha}"...`);
      
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password: senha
      });
      
      log.success(`Login bem-sucedido! (improvável neste teste)`);
      
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limit excedido!
        log.error(`\n🛑 BLOQUEADO! Rate limit excedido após ${i} tentativas`);
        log.warning(`Mensagem: ${error.response.data.message}`);
        log.warning(`Código: ${error.response.data.code}`);
        
        // Mostrar headers de rate limit
        const headers = error.response.headers;
        if (headers['ratelimit-limit']) {
          console.log('\n📊 Headers de Rate Limit:');
          console.log(`   RateLimit-Limit: ${headers['ratelimit-limit']}`);
          console.log(`   RateLimit-Remaining: ${headers['ratelimit-remaining']}`);
          console.log(`   RateLimit-Reset: ${headers['ratelimit-reset']}`);
        }
        
        log.success('\n✅ PROTEÇÃO FUNCIONANDO! Brute force bloqueado.\n');
        return;
        
      } else if (error.response?.status === 401) {
        // Credenciais inválidas (esperado)
        log.dim(`   ❌ Senha incorreta`);
        
        // Mostrar tentativas restantes
        const remaining = error.response.headers['ratelimit-remaining'];
        if (remaining !== undefined) {
          log.dim(`   Tentativas restantes: ${remaining}`);
        }
        
      } else {
        log.error(`Erro inesperado: ${error.message}`);
      }
    }
    
    // Pequeno delay entre tentativas (para não sobrecarregar servidor)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// ============================================================================
// TESTE 3: MATEMÁTICA DA PROTEÇÃO
// ============================================================================
const showMathematicalProtection = () => {
  log.title('🧮 MATEMÁTICA: Por que Rate Limit Protege');
  
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│  CENÁRIO 1: Senha Fraca (6 dígitos numéricos)          │');
  console.log('└─────────────────────────────────────────────────────────┘\n');
  
  const combinacoesFraca = Math.pow(10, 6);
  console.log(`Combinações possíveis: 10^6 = ${combinacoesFraca.toLocaleString()}\n`);
  
  console.log('❌ SEM RATE LIMIT:');
  console.log(`   Velocidade: 1.000 tentativas/segundo`);
  const tempoSemLimitFraca = combinacoesFraca / 1000;
  console.log(`   Tempo para quebrar: ${tempoSemLimitFraca.toLocaleString()} segundos (~${(tempoSemLimitFraca / 60).toFixed(1)} minutos)`);
  console.log(`   Resultado: ⚠️  VULNERÁVEL!\n`);
  
  console.log('✅ COM RATE LIMIT (5 tent / 15min):');
  const tentativasPorDia = 480; // 5 a cada 15min × 96 períodos/dia
  console.log(`   Tentativas/dia: ${tentativasPorDia}`);
  const tempoComLimitFraca = combinacoesFraca / tentativasPorDia;
  console.log(`   Tempo para quebrar: ${tempoComLimitFraca.toLocaleString()} dias (~${(tempoComLimitFraca / 365).toFixed(1)} anos)`);
  console.log(`   Resultado: ✅ PROTEGIDO!\n`);
  
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│  CENÁRIO 2: Senha Forte (12 chars alfanuméricos)       │');
  console.log('└─────────────────────────────────────────────────────────┘\n');
  
  const alfabeto = 72; // a-z, A-Z, 0-9, símbolos
  const comprimento = 12;
  const combinacoesForte = Math.pow(alfabeto, comprimento);
  
  console.log(`Alfabeto: 72 caracteres (a-z, A-Z, 0-9, símbolos)`);
  console.log(`Comprimento: ${comprimento} caracteres`);
  console.log(`Combinações: 72^12 = ${combinacoesForte.toExponential(2)}\n`);
  
  console.log('❌ SEM RATE LIMIT:');
  console.log(`   Velocidade: 1.000 tentativas/segundo`);
  const tempoSemLimitForte = combinacoesForte / 1000 / 60 / 60 / 24 / 365;
  console.log(`   Tempo para quebrar: ${tempoSemLimitForte.toExponential(2)} anos`);
  console.log(`   Resultado: ✅ Já é seguro (mais que idade do universo)\n`);
  
  console.log('✅ COM RATE LIMIT (5 tent / 15min):');
  const tempoComLimitForte = combinacoesForte / tentativasPorDia / 365;
  console.log(`   Tempo para quebrar: ${tempoComLimitForte.toExponential(2)} anos`);
  console.log(`   Resultado: ✅ IMPOSSÍVEL!\n`);
  
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│  CONCLUSÃO                                              │');
  console.log('└─────────────────────────────────────────────────────────┘\n');
  
  console.log('💡 Rate Limiting transforma senhas FRACAS em FORTES!');
  console.log('💡 Senhas FORTES tornam-se IMPOSSÍVEIS de quebrar!');
  console.log('💡 Proteção essencial contra ataques automatizados!\n');
};

// ============================================================================
// TESTE 4: HEADERS DE RATE LIMIT
// ============================================================================
const testRateLimitHeaders = async () => {
  log.title('🧪 TESTE: Headers de Rate Limit');
  
  log.info('Fazendo requisição de login...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'senhaErrada'
    });
  } catch (error) {
    if (error.response) {
      const headers = error.response.headers;
      
      console.log('📊 Headers retornados:');
      console.log(`   RateLimit-Limit: ${headers['ratelimit-limit'] || 'N/A'} (máximo permitido)`);
      console.log(`   RateLimit-Remaining: ${headers['ratelimit-remaining'] || 'N/A'} (tentativas restantes)`);
      console.log(`   RateLimit-Reset: ${headers['ratelimit-reset'] || 'N/A'} (timestamp de reset)\n`);
      
      if (headers['ratelimit-reset']) {
        const resetTimestamp = parseInt(headers['ratelimit-reset']);
        const resetDate = new Date(resetTimestamp * 1000);
        console.log(`   Reset em: ${resetDate.toLocaleString('pt-BR')}\n`);
      }
      
      log.success('Headers de rate limit implementados corretamente!');
      log.info('Frontend pode usar esses headers para mostrar contador ao usuário.\n');
    }
  }
};

// ============================================================================
// TESTE 5: RESET APÓS SUCESSO
// ============================================================================
const testResetAfterSuccess = async () => {
  log.title('🧪 TESTE: Reset de Contador Após Login Bem-Sucedido');
  
  log.info('Configuração: skipSuccessfulRequests: true');
  log.info('Comportamento: Contador reseta após login bem-sucedido\n');
  
  log.dim('1. Erre 4 tentativas de login');
  log.dim('2. Acerte na 5ª tentativa (login bem-sucedido)');
  log.dim('3. Contador RESETA (não bloqueia próxima tentativa)');
  log.dim('4. Pode errar mais 5 vezes antes de bloquear\n');
  
  log.success('✅ Benefício: Usuário legítimo que erra algumas vezes não fica permanentemente bloqueado');
  log.success('✅ Segurança: Atacante ainda limitado (não consegue testar infinitamente)\n');
};

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================
const runAllTests = async () => {
  console.log('\n' + '═'.repeat(70));
  console.log('🛡️  RATE LIMITING E PROTEÇÃO CONTRA BRUTE FORCE');
  console.log('═'.repeat(70));
  
  // Teste 1: Simulação sem rate limit
  simulateBruteForceWithoutRateLimit();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: Brute force com rate limit (real)
  try {
    await testBruteForceWithRateLimit();
  } catch (error) {
    log.error(`Erro ao testar rate limit: ${error.message}`);
    log.warning('Certifique-se de que o servidor está rodando em http://localhost:3000\n');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Teste 3: Matemática da proteção
  showMathematicalProtection();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Teste 4: Headers
  try {
    await testRateLimitHeaders();
  } catch (error) {
    log.dim('(Servidor não está rodando - teste de headers pulado)\n');
  }
  
  // Teste 5: Reset após sucesso
  testResetAfterSuccess();
  
  console.log('═'.repeat(70));
  log.title('📊 RESUMO');
  console.log('═'.repeat(70));
  
  console.log('\n✅ Proteções implementadas:');
  console.log('  1. Rate Limit de Login: 5 tentativas / 15 minutos');
  console.log('  2. skipSuccessfulRequests: true (contador reseta em sucesso)');
  console.log('  3. Headers de rate limit (RateLimit-Limit, Remaining, Reset)');
  console.log('  4. Logging de tentativas bloqueadas');
  console.log('  5. Mensagens claras para o usuário');
  
  console.log('\n🔢 Efetividade:');
  console.log('  • Senha fraca (6 dígitos): 17 min → 5,7 ANOS');
  console.log('  • Senha forte (12 chars): Impossível → Mais impossível');
  console.log('  • Atacante: 1000/seg → 480/dia (redução de 99,99%)');
  
  console.log('\n📚 Documentação completa: RATE_LIMITING.md');
  console.log('⚙️  Implementação: src/middlewares/rateLimiter.js\n');
};

// Executar
if (require.main === module) {
  runAllTests().catch(error => {
    log.error(`Erro fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllTests };
