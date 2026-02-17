/**
 * EXEMPLO: TESTAR ROTA DE LOGIN
 * 
 * Este arquivo demonstra como testar a rota POST /api/auth/login
 * com diferentes cenários incluindo brute force protection
 * 
 * PREREQUISITOS:
 * - Servidor rodando: npm start
 * - PostgreSQL conectado
 * - Usuário já cadastrado (usar testRegisterRoute.js primeiro)
 * 
 * EXECUTAR:
 * node examples/testLoginRoute.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api/auth';

// Credenciais de teste (cadastre primeiro com testRegisterRoute.js)
let TEST_EMAIL = null;
let TEST_PASSWORD = 'SenhaForte@123';

// Helper para exibir resultados
const log = (title, data) => {
  console.log('\n' + '='.repeat(60));
  console.log(`📌 ${title}`);
  console.log('='.repeat(60));
  console.log(JSON.stringify(data, null, 2));
};

const logError = (title, error) => {
  console.log('\n' + '='.repeat(60));
  console.log(`❌ ${title}`);
  console.log('='.repeat(60));
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.log('Erro:', error.message);
  }
};

// ============================================================================
// SETUP: CRIAR USUÁRIO DE TESTE
// ============================================================================
const setupTestUser = async () => {
  try {
    const userData = {
      name: 'Usuário Teste Login',
      email: `teste.login.${Date.now()}@example.com`,
      password: TEST_PASSWORD,
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    TEST_EMAIL = userData.email;
    
    log('SETUP: Usuário de teste criado', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      userId: response.data.data.user.id,
    });
    
    return TEST_EMAIL;
  } catch (error) {
    logError('SETUP: Erro ao criar usuário de teste', error);
    throw error;
  }
};

// ============================================================================
// TESTE 1: LOGIN BEM-SUCEDIDO
// ============================================================================
const testSuccessfulLogin = async () => {
  try {
    const credentials = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    };
    
    const response = await axios.post(`${API_URL}/login`, credentials);
    
    log('TESTE 1: Login bem-sucedido ✅', {
      status: response.status,
      message: response.data.message,
      user: response.data.data.user,
      hasToken: !!response.data.data.accessToken,
      cookies: response.headers['set-cookie'] ? 'Cookies definidos' : 'Sem cookies',
    });
    
    return true;
  } catch (error) {
    logError('TESTE 1: Login bem-sucedido (FALHOU)', error);
    return false;
  }
};

// ============================================================================
// TESTE 2: SENHA INCORRETA (Mensagem Genérica)
// ============================================================================
const testWrongPassword = async () => {
  try {
    const credentials = {
      email: TEST_EMAIL,
      password: 'SenhaErrada@999', // Senha incorreta
    };
    
    const response = await axios.post(`${API_URL}/login`, credentials);
    
    // Se chegou aqui, o teste FALHOU (deveria rejeitar)
    logError('TESTE 2: Senha incorreta (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('TESTE 2: Senha incorreta (bloqueada corretamente) ✅', {
        status: error.response.status,
        message: error.response.data.message,
        note: 'Mensagem deve ser GENÉRICA (não revela que email existe)',
      });
    } else {
      logError('TESTE 2: Senha incorreta (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 3: EMAIL INEXISTENTE (Mesma Mensagem Genérica)
// ============================================================================
const testNonExistentEmail = async () => {
  try {
    const credentials = {
      email: `naoexiste.${Date.now()}@example.com`, // Email não cadastrado
      password: TEST_PASSWORD,
    };
    
    const response = await axios.post(`${API_URL}/login`, credentials);
    
    logError('TESTE 3: Email inexistente (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('TESTE 3: Email inexistente (bloqueado corretamente) ✅', {
        status: error.response.status,
        message: error.response.data.message,
        note: 'Mensagem deve ser IGUAL ao erro de senha (não revela se email existe)',
      });
    } else {
      logError('TESTE 3: Email inexistente (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 4: EMAIL INVÁLIDO (Formato)
// ============================================================================
const testInvalidEmail = async () => {
  try {
    const credentials = {
      email: 'email-invalido-sem-arroba', // Formato inválido
      password: TEST_PASSWORD,
    };
    
    const response = await axios.post(`${API_URL}/login`, credentials);
    
    logError('TESTE 4: Email inválido (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('TESTE 4: Email inválido (bloqueado pela validação) ✅', {
        status: error.response.status,
        errors: error.response.data.errors || error.response.data.message,
      });
    } else {
      logError('TESTE 4: Email inválido (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 5: CAMPOS AUSENTES
// ============================================================================
const testMissingFields = async () => {
  try {
    const credentials = {
      email: TEST_EMAIL,
      // SEM senha
    };
    
    const response = await axios.post(`${API_URL}/login`, credentials);
    
    logError('TESTE 5: Campos ausentes (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('TESTE 5: Campos ausentes (bloqueado pela validação) ✅', {
        status: error.response.status,
        errors: error.response.data.errors || error.response.data.message,
      });
    } else {
      logError('TESTE 5: Campos ausentes (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 6: BRUTE FORCE PROTECTION (5 Tentativas)
// ============================================================================
const testBruteForceProtection = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📌 TESTE 6: Brute Force Protection (5 tentativas)');
  console.log('='.repeat(60));
  console.log('⚠️  Este teste irá BLOQUEAR a conta de teste!');
  console.log('Fazendo 5 tentativas com senha incorreta...\n');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const credentials = {
        email: TEST_EMAIL,
        password: `SenhaErrada${i}@123`,
      };
      
      await axios.post(`${API_URL}/login`, credentials);
      console.log(`❌ Tentativa ${i}: Deveria ter falhado!`);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data.message;
        
        if (status === 401) {
          console.log(`🔴 Tentativa ${i}: Senha incorreta (esperado)`);
        } else if (status === 429 || message.includes('bloqueada')) {
          console.log(`🛑 Tentativa ${i}: CONTA BLOQUEADA (esperado após 5 tentativas)`);
          break;
        }
      }
    }
    
    // Delay para não confundir com rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Brute force protection testado!');
  console.log('ℹ️  Aguarde 15 minutos para desbloquear a conta automaticamente.');
};

// ============================================================================
// TESTE 7: LOGIN APÓS BLOQUEIO
// ============================================================================
const testLoginWhileBlocked = async () => {
  try {
    const credentials = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD, // Senha CORRETA, mas conta bloqueada
    };
    
    const response = await axios.post(`${API_URL}/login`, credentials);
    
    logError('TESTE 7: Login bloqueado (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.data.message.includes('bloqueada')) {
      log('TESTE 7: Login bloqueado (funcionando corretamente) ✅', {
        status: error.response.status,
        message: error.response.data.message,
        note: 'MESMO com senha correta, login bloqueado por brute force',
      });
    } else {
      logError('TESTE 7: Login bloqueado (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 8: RATE LIMITING (Múltiplas Requisições)
// ============================================================================
const testRateLimiting = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📌 TESTE 8: Rate Limiting (múltiplas requisições)');
  console.log('='.repeat(60));
  console.log('Enviando 10 requisições rapidamente...\n');
  
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    const promise = axios.post(`${API_URL}/login`, {
      email: `ratelimit.${i}.${Date.now()}@example.com`,
      password: 'Qualquer@123',
    }).then(() => {
      console.log(`✅ Requisição ${i + 1}: Passou (não bloqueada)`);
    }).catch((error) => {
      if (error.response && error.response.status === 429) {
        console.log(`🛑 Requisição ${i + 1}: Rate limit atingido (esperado)`);
      } else {
        console.log(`❌ Requisição ${i + 1}: Erro ${error.response?.status || error.message}`);
      }
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  
  console.log('\n✅ Rate limiting testado!');
};

// ============================================================================
// TESTE 9: TIMING ATTACK (Avançado)
// ============================================================================
const testTimingAttack = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📌 TESTE 9: Timing Attack Protection');
  console.log('='.repeat(60));
  console.log('Medindo tempo de resposta para diferentes cenários...\n');
  
  // Cenário 1: Email existe, senha errada
  const start1 = Date.now();
  try {
    await axios.post(`${API_URL}/login`, {
      email: TEST_EMAIL,
      password: 'SenhaErrada@999',
    });
  } catch (error) {
    const time1 = Date.now() - start1;
    console.log(`⏱️  Email EXISTE + senha errada: ${time1}ms`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Cenário 2: Email não existe
  const start2 = Date.now();
  try {
    await axios.post(`${API_URL}/login`, {
      email: `naoexiste.${Date.now()}@example.com`,
      password: 'Qualquer@123',
    });
  } catch (error) {
    const time2 = Date.now() - start2;
    console.log(`⏱️  Email NÃO EXISTE: ${time2}ms`);
  }
  
  console.log('\n✅ Timing attack testado!');
  console.log('ℹ️  Tempos devem ser similares (~250ms) devido ao bcrypt.compare()');
  console.log('ℹ️  Diferenças <50ms são normais (latência de rede)');
};

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================
const runAllTests = async () => {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       TESTE DE SEGURANÇA - ROTA DE LOGIN               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\nURL: ${API_URL}/login`);
  console.log('Executando 9 testes de segurança...\n');
  
  try {
    // Setup: Criar usuário de teste
    await setupTestUser();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 1: Login bem-sucedido
    await testSuccessfulLogin();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 2: Senha incorreta
    await testWrongPassword();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 3: Email inexistente
    await testNonExistentEmail();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 4: Email inválido
    await testInvalidEmail();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 5: Campos ausentes
    await testMissingFields();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 6: Brute force (5 tentativas)
    await testBruteForceProtection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 7: Login enquanto bloqueado
    await testLoginWhileBlocked();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 8: Rate limiting
    await testRateLimiting();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 9: Timing attack
    await testTimingAttack();
    
    // Resumo
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                 TESTES CONCLUÍDOS                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n✅ Todos os testes executados!');
    console.log('📄 Verifique os logs acima para ver os resultados detalhados.');
    console.log('📚 Leia SEGURANCA_LOGIN.md para entender as proteções.\n');
    console.log('⚠️  IMPORTANTE:');
    console.log(`   - Conta de teste: ${TEST_EMAIL}`);
    console.log('   - Conta está BLOQUEADA (teste de brute force)');
    console.log('   - Aguarde 15 minutos para desbloquear automaticamente');
    console.log('   - Ou delete manualmente no banco: DELETE FROM users WHERE email = ...\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao executar testes:', error.message);
    console.error('\n⚠️  Certifique-se de que:');
    console.error('   1. O servidor está rodando (npm start)');
    console.error('   2. O PostgreSQL está conectado');
    console.error('   3. A tabela users foi criada');
    console.error('   4. A rota de cadastro está funcionando\n');
  }
};

// Executar testes se for arquivo principal
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSuccessfulLogin,
  testWrongPassword,
  testBruteForceProtection,
};
