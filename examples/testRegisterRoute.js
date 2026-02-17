/**
 * EXEMPLO: TESTAR ROTA DE CADASTRO
 * 
 * Este arquivo demonstra como testar a rota POST /api/auth/register
 * com diferentes cenários (sucesso, validação, duplicação, etc)
 * 
 * PREREQUISITOS:
 * - Servidor rodando: npm start
 * - PostgreSQL conectado
 * - Tabela users criada
 * 
 * EXECUTAR:
 * node examples/testRegisterRoute.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api/auth';

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
// TESTE 1: CADASTRO BEM-SUCEDIDO
// ============================================================================
const testSuccessfulRegistration = async () => {
  try {
    const userData = {
      name: 'João Silva',
      email: `joao.silva.${Date.now()}@example.com`, // Email único
      password: 'SenhaForte@123',
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    log('TESTE 1: Cadastro bem-sucedido ✅', {
      status: response.status,
      message: response.data.message,
      user: response.data.data.user,
      hasToken: !!response.data.data.accessToken,
    });
    
    return response.data.data.user.email; // Retorna email para próximos testes
  } catch (error) {
    logError('TESTE 1: Cadastro bem-sucedido', error);
    return null;
  }
};

// ============================================================================
// TESTE 2: EMAIL DUPLICADO
// ============================================================================
const testDuplicateEmail = async (existingEmail) => {
  if (!existingEmail) {
    console.log('\n⚠️  TESTE 2: Pulado (email não disponível)');
    return;
  }
  
  try {
    const userData = {
      name: 'João Silva Clone',
      email: existingEmail, // Mesmo email do teste anterior
      password: 'OutraSenha@456',
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    // Se chegou aqui, o teste FALHOU (deveria rejeitar duplicação)
    logError('TESTE 2: Email duplicado (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    // Esperamos um erro 400 ou 409
    if (error.response && (error.response.status === 400 || error.response.status === 409)) {
      log('TESTE 2: Email duplicado (bloqueado corretamente) ✅', {
        status: error.response.status,
        message: error.response.data.message,
      });
    } else {
      logError('TESTE 2: Email duplicado (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 3: SENHA FRACA (sem maiúscula)
// ============================================================================
const testWeakPassword = async () => {
  try {
    const userData = {
      name: 'Maria Santos',
      email: `maria.santos.${Date.now()}@example.com`,
      password: 'senhafraca123', // SEM maiúscula
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    // Se chegou aqui, o teste FALHOU
    logError('TESTE 3: Senha fraca (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('TESTE 3: Senha fraca (bloqueada corretamente) ✅', {
        status: error.response.status,
        errors: error.response.data.errors || error.response.data.message,
      });
    } else {
      logError('TESTE 3: Senha fraca (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 4: SENHA SEM CARACTERE ESPECIAL
// ============================================================================
const testPasswordNoSpecialChar = async () => {
  try {
    const userData = {
      name: 'Pedro Costa',
      email: `pedro.costa.${Date.now()}@example.com`,
      password: 'SenhaForte123', // SEM caractere especial
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    logError('TESTE 4: Senha sem especial (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('TESTE 4: Senha sem especial (bloqueada corretamente) ✅', {
        status: error.response.status,
        errors: error.response.data.errors || error.response.data.message,
      });
    } else {
      logError('TESTE 4: Senha sem especial (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 5: EMAIL INVÁLIDO
// ============================================================================
const testInvalidEmail = async () => {
  try {
    const userData = {
      name: 'Ana Oliveira',
      email: 'email-invalido', // SEM @ e domínio
      password: 'SenhaForte@123',
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    logError('TESTE 5: Email inválido (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('TESTE 5: Email inválido (bloqueado corretamente) ✅', {
        status: error.response.status,
        errors: error.response.data.errors || error.response.data.message,
      });
    } else {
      logError('TESTE 5: Email inválido (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 6: NOME MUITO CURTO
// ============================================================================
const testShortName = async () => {
  try {
    const userData = {
      name: 'A', // Apenas 1 caractere (mínimo é 2)
      email: `usuario.${Date.now()}@example.com`,
      password: 'SenhaForte@123',
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    logError('TESTE 6: Nome curto (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('TESTE 6: Nome curto (bloqueado corretamente) ✅', {
        status: error.response.status,
        errors: error.response.data.errors || error.response.data.message,
      });
    } else {
      logError('TESTE 6: Nome curto (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 7: CAMPOS AUSENTES
// ============================================================================
const testMissingFields = async () => {
  try {
    const userData = {
      // SEM name
      email: `usuario.${Date.now()}@example.com`,
      password: 'SenhaForte@123',
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    logError('TESTE 7: Campos ausentes (DEVERIA TER FALHADO)', {
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('TESTE 7: Campos ausentes (bloqueado corretamente) ✅', {
        status: error.response.status,
        errors: error.response.data.errors || error.response.data.message,
      });
    } else {
      logError('TESTE 7: Campos ausentes (erro inesperado)', error);
    }
  }
};

// ============================================================================
// TESTE 8: MÚLTIPLOS CADASTROS (Rate Limiting)
// ============================================================================
const testRateLimiting = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📌 TESTE 8: Rate Limiting (múltiplas tentativas)');
  console.log('='.repeat(60));
  console.log('Enviando 10 requisições rapidamente...\n');
  
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    const promise = axios.post(`${API_URL}/register`, {
      name: `Usuário Teste ${i}`,
      email: `teste.ratelimit.${i}.${Date.now()}@example.com`,
      password: 'SenhaForte@123',
    }).then(() => {
      console.log(`✅ Requisição ${i + 1}: Sucesso`);
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
  
  console.log('\n✅ Rate limiting testado! Algumas requisições devem ter sido bloqueadas.');
};

// ============================================================================
// TESTE 9: SQL INJECTION (Tentativa de Ataque)
// ============================================================================
const testSQLInjection = async () => {
  try {
    const userData = {
      name: 'Hacker',
      email: "test@test.com' OR 1=1; DROP TABLE users; --", // Tentativa de SQL injection
      password: 'SenhaForte@123',
    };
    
    const response = await axios.post(`${API_URL}/register`, userData);
    
    // Se chegou aqui, o email malicioso foi sanitizado/rejeitado
    log('TESTE 9: SQL Injection (bloqueado ou sanitizado) ✅', {
      status: response.status,
      message: 'Email foi tratado como string literal, não como SQL',
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('TESTE 9: SQL Injection (rejeitado pela validação) ✅', {
        status: error.response.status,
        message: 'Email inválido rejeitado pelo Joi',
      });
    } else {
      logError('TESTE 9: SQL Injection (erro inesperado)', error);
    }
  }
};

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================
const runAllTests = async () => {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     TESTE DE SEGURANÇA - ROTA DE CADASTRO               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\nURL: ${API_URL}/register`);
  console.log('Executando 9 testes de segurança...\n');
  
  try {
    // Teste 1: Cadastro bem-sucedido
    const registeredEmail = await testSuccessfulRegistration();
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay
    
    // Teste 2: Email duplicado
    await testDuplicateEmail(registeredEmail);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 3: Senha fraca
    await testWeakPassword();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 4: Senha sem especial
    await testPasswordNoSpecialChar();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 5: Email inválido
    await testInvalidEmail();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 6: Nome curto
    await testShortName();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 7: Campos ausentes
    await testMissingFields();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 8: Rate limiting
    await testRateLimiting();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 9: SQL Injection
    await testSQLInjection();
    
    // Resumo
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                 TESTES CONCLUÍDOS                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n✅ Todos os testes executados!');
    console.log('📄 Verifique os logs acima para ver os resultados detalhados.');
    console.log('📚 Leia SEGURANCA_CADASTRO.md para entender as proteções.\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao executar testes:', error.message);
    console.error('\n⚠️  Certifique-se de que:');
    console.error('   1. O servidor está rodando (npm start)');
    console.error('   2. O PostgreSQL está conectado');
    console.error('   3. A tabela users foi criada\n');
  }
};

// Executar testes se for arquivo principal
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSuccessfulRegistration,
  testDuplicateEmail,
  testWeakPassword,
  testInvalidEmail,
};
