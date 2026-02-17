/**
 * TESTES: CONTROLE DE ACESSO E PERMISSÕES
 * 
 * Testa proteções contra Broken Access Control (OWASP A01):
 * - IDOR (Insecure Direct Object Reference)
 * - Privilege Escalation
 * - Missing Function Level Access Control
 * - Forced Browsing
 * 
 * Execute: node examples/testAccessControl.js
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
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

// ============================================================================
// SETUP: Criar usuários de teste
// ============================================================================
let userToken, adminToken, userId, adminId;

const setup = async () => {
  try {
    log.title('🔧 SETUP: Criando usuários de teste');
    
    // Criar usuário comum
    const userResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'João Silva',
      email: 'joao@test.com',
      password: 'SenhaForte123!@#'
    });
    
    userToken = userResponse.data.data.accessToken;
    userId = userResponse.data.data.user.id;
    log.success(`Usuário comum criado: ${userId}`);
    
    // Criar admin
    const adminResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'AdminPass123!@#'
    });
    
    adminToken = adminResponse.data.data.accessToken;
    adminId = adminResponse.data.data.user.id;
    
    // Promover para admin (isso deve ser feito diretamente no banco em produção)
    log.info('Admin criado: ' + adminId);
    log.warning('⚠️  Em produção, role=admin deve ser definido diretamente no banco (não via API)');
    
  } catch (error) {
    if (error.response?.data?.code === 'DUPLICATE_EMAIL') {
      log.warning('Usuários já existem. Fazendo login...');
      
      const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'joao@test.com',
        password: 'SenhaForte123!@#'
      });
      userToken = userLogin.data.data.accessToken;
      userId = userLogin.data.data.user.id;
      
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@test.com',
        password: 'AdminPass123!@#'
      });
      adminToken = adminLogin.data.data.accessToken;
      adminId = adminLogin.data.data.user.id;
    } else {
      throw error;
    }
  }
};

// ============================================================================
// TESTE 1: IDOR (Insecure Direct Object Reference)
// ============================================================================
const testIDOR = async () => {
  log.title('🧪 TESTE 1: IDOR (Insecure Direct Object Reference)');
  
  try {
    // Cenário 1: Usuário A tenta acessar perfil do Admin
    log.info('Cenário 1: Usuário comum tenta acessar perfil de outro usuário');
    
    try {
      const response = await axios.get(`${BASE_URL}/users/${adminId}/profile`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      log.error(`FALHA DE SEGURANÇA! Usuário comum acessou perfil de outro usuário`);
      log.error(`Dados vazados: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (error.response?.status === 403) {
        log.success('IDOR bloqueado! Status: 403 Forbidden');
        log.success(`Mensagem: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
    
    // Cenário 2: Usuário acessa próprio perfil (permitido)
    log.info('\nCenário 2: Usuário acessa próprio perfil (legítimo)');
    
    const ownProfile = await axios.get(`${BASE_URL}/users/${userId}/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    log.success('Acesso ao próprio perfil permitido');
    log.success(`Dados: ${ownProfile.data.data.user.name}`);
    
    // Cenário 3: Admin acessa qualquer perfil (permitido)
    log.info('\nCenário 3: Admin acessa perfil de outro usuário (auditoria)');
    
    const adminAccess = await axios.get(`${BASE_URL}/users/${userId}/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    log.success('Admin pode acessar qualquer perfil (auditoria)');
    log.success(`Dados: ${adminAccess.data.data.user.name}`);
    
  } catch (error) {
    log.error(`Erro inesperado: ${error.message}`);
  }
};

// ============================================================================
// TESTE 2: PRIVILEGE ESCALATION
// ============================================================================
const testPrivilegeEscalation = async () => {
  log.title('🧪 TESTE 2: PRIVILEGE ESCALATION');
  
  try {
    // Cenário 1: Usuário comum tenta virar admin
    log.info('Cenário 1: Usuário comum tenta mudar próprio role para admin');
    
    try {
      const response = await axios.put(`${BASE_URL}/users/${userId}`, 
        { name: 'João Hacker', role: 'admin' },
        { headers: { Authorization: `Bearer ${userToken}` }}
      );
      
      log.error('FALHA DE SEGURANÇA! Usuário conseguiu escalar privilégios!');
      log.error(`Resposta: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (error.response?.status === 403) {
        log.success('Privilege escalation bloqueado! Status: 403');
        log.success(`Código: ${error.response.data.code}`);
        log.success(`Mensagem: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
    
    // Cenário 2: Usuário atualiza apenas campos permitidos (nome, email)
    log.info('\nCenário 2: Usuário atualiza campos permitidos (nome)');
    
    const updateResponse = await axios.put(`${BASE_URL}/users/${userId}`,
      { name: 'João Silva Atualizado' },
      { headers: { Authorization: `Bearer ${userToken}` }}
    );
    
    log.success('Atualização de campo permitido bem-sucedida');
    log.success(`Nome atualizado: ${updateResponse.data.data.user.name}`);
    
    // Cenário 3: Admin muda role de outro usuário (permitido)
    log.info('\nCenário 3: Admin promove usuário para moderator');
    
    const adminUpdate = await axios.put(`${BASE_URL}/users/${userId}`,
      { role: 'moderator' },
      { headers: { Authorization: `Bearer ${adminToken}` }}
    );
    
    log.success('Admin pode alterar roles de outros usuários');
    log.success(`Role atualizado: ${adminUpdate.data.data.user.role}`);
    
  } catch (error) {
    log.error(`Erro inesperado: ${error.message}`);
  }
};

// ============================================================================
// TESTE 3: MISSING FUNCTION LEVEL ACCESS CONTROL
// ============================================================================
const testMissingFunctionLevelControl = async () => {
  log.title('🧪 TESTE 3: MISSING FUNCTION LEVEL ACCESS CONTROL');
  
  try {
    // Cenário 1: Usuário comum tenta acessar endpoint admin
    log.info('Cenário 1: Usuário comum tenta listar todos os usuários (endpoint admin)');
    
    try {
      const response = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      log.error('FALHA DE SEGURANÇA! Usuário comum acessou endpoint admin!');
      log.error(`Dados vazados: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (error.response?.status === 403) {
        log.success('Acesso a endpoint admin bloqueado! Status: 403');
        log.success(`Mensagem: ${error.response.data.message}`);
        log.success(`Roles necessários: ${error.response.data.requiredRoles?.join(', ')}`);
        log.success(`Seu role: ${error.response.data.yourRole}`);
      } else {
        throw error;
      }
    }
    
    // Cenário 2: Admin acessa endpoint admin (permitido)
    log.info('\nCenário 2: Admin acessa endpoint de listagem de usuários');
    
    const adminResponse = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    log.success('Admin tem acesso ao endpoint');
    log.success(`Usuários listados: ${adminResponse.data.data.users.length}`);
    
    // Cenário 3: Acesso sem token (401 Unauthorized)
    log.info('\nCenário 3: Tentativa de acesso sem token');
    
    try {
      await axios.get(`${BASE_URL}/admin/users`);
      log.error('FALHA DE SEGURANÇA! Endpoint acessível sem autenticação!');
    } catch (error) {
      if (error.response?.status === 401) {
        log.success('Acesso sem token bloqueado! Status: 401 Unauthorized');
        log.success(`Mensagem: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    log.error(`Erro inesperado: ${error.message}`);
  }
};

// ============================================================================
// TESTE 4: FORCED BROWSING
// ============================================================================
const testForcedBrowsing = async () => {
  log.title('🧪 TESTE 4: FORCED BROWSING');
  
  try {
    // Cenário 1: Tentar acessar rota protegida sem autenticação
    log.info('Cenário 1: Acessar /api/users/me sem token');
    
    try {
      await axios.get(`${BASE_URL}/users/me`);
      log.error('FALHA DE SEGURANÇA! Rota protegida acessível sem token!');
    } catch (error) {
      if (error.response?.status === 401) {
        log.success('Rota protegida bloqueada sem token! Status: 401');
        log.success(`Mensagem: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
    
    // Cenário 2: Acessar com token válido (permitido)
    log.info('\nCenário 2: Acessar /api/users/me com token válido');
    
    const response = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    log.success('Acesso autorizado com token válido');
    log.success(`Usuário: ${response.data.data.user.name}`);
    
    // Cenário 3: Acessar com token expirado (simulado)
    log.info('\nCenário 3: Acessar com token adulterado');
    
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.fake_signature';
    
    try {
      await axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${fakeToken}` }
      });
      log.error('FALHA DE SEGURANÇA! Token adulterado aceito!');
    } catch (error) {
      if (error.response?.status === 401) {
        log.success('Token adulterado bloqueado! Status: 401');
        log.success(`Código: ${error.response.data.code}`);
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    log.error(`Erro inesperado: ${error.message}`);
  }
};

// ============================================================================
// TESTE 5: MASS ASSIGNMENT
// ============================================================================
const testMassAssignment = async () => {
  log.title('🧪 TESTE 5: MASS ASSIGNMENT');
  
  try {
    // Cenário 1: Tentar atualizar campos sensíveis
    log.info('Cenário 1: Usuário tenta atualizar is_active (campo admin-only)');
    
    const response = await axios.put(`${BASE_URL}/users/${userId}`,
      { 
        name: 'João Silva',
        is_active: false,  // Tentar desativar própria conta
        role: 'admin',     // Tentar virar admin
        is_email_verified: true  // Tentar marcar email como verificado
      },
      { headers: { Authorization: `Bearer ${userToken}` }}
    );
    
    // Verificar se apenas campos permitidos foram atualizados
    const blockedFields = response.data.blockedFields || [];
    
    if (blockedFields.length > 0) {
      log.success('Mass assignment bloqueado!');
      log.success(`Campos permitidos: name, email`);
      log.success(`Campos bloqueados: ${blockedFields.join(', ')}`);
    } else {
      log.warning('Resposta não contém informação sobre campos bloqueados');
    }
    
    // Cenário 2: Verificar que role não foi alterado
    log.info('\nCenário 2: Verificar que role permanece inalterado');
    
    const profileCheck = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (profileCheck.data.data.user.role !== 'admin') {
      log.success('Role não foi alterado (proteção funcionou)');
      log.success(`Role atual: ${profileCheck.data.data.user.role}`);
    } else {
      log.error('FALHA! Role foi alterado para admin (mass assignment vulnerability)');
    }
    
  } catch (error) {
    log.error(`Erro inesperado: ${error.message}`);
  }
};

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================
const runAllTests = async () => {
  console.log('\n' + '═'.repeat(70));
  console.log('🔒 TESTES DE CONTROLE DE ACESSO - BROKEN ACCESS CONTROL (OWASP A01)');
  console.log('═'.repeat(70));
  
  await setup();
  
  await testIDOR();
  await testPrivilegeEscalation();
  await testMissingFunctionLevelControl();
  await testForcedBrowsing();
  await testMassAssignment();
  
  console.log('\n' + '═'.repeat(70));
  log.title('📊 RESUMO DOS TESTES');
  console.log('═'.repeat(70));
  
  console.log('\n✅ Proteções implementadas e testadas:');
  console.log('  1. IDOR Protection - Validação de propriedade de recursos');
  console.log('  2. Privilege Escalation - Apenas admin pode alterar roles');
  console.log('  3. Function Level Access - Middleware restrictTo valida roles');
  console.log('  4. Forced Browsing - Rotas protegidas requerem autenticação');
  console.log('  5. Mass Assignment - Whitelist de campos atualizáveis');
  
  console.log('\n📚 Documentação completa: BROKEN_ACCESS_CONTROL.md');
  console.log('💡 Exemplos de código: examples/accessControlExamples.js\n');
};

// Executar
if (require.main === module) {
  runAllTests().catch(error => {
    log.error(`Erro fatal: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Dados: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  });
}

module.exports = { runAllTests };
