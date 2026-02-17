/**
 * EXEMPLO: USO DE JWT
 * 
 * Este arquivo demonstra como usar JWT para autenticação
 * incluindo geração, validação e proteção de rotas
 * 
 * NÃO EXECUTE ESTE ARQUIVO DIRETAMENTE
 * Use como referência para entender o fluxo
 */

const tokenService = require('../src/services/tokenService');
const jwt = require('jsonwebtoken');

// ============================================================================
// EXEMPLO 1: GERAR ACCESS TOKEN (no login)
// ============================================================================
console.log('='.repeat(60));
console.log('EXEMPLO 1: Gerar Access Token');
console.log('='.repeat(60));

// Simular usuário que fez login
const user = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'joao@example.com',
  role: 'user',
};

// Gerar token JWT
const accessToken = tokenService.generateAccessToken(user.id, user.role);

console.log('\n📝 Usuário:', user.email);
console.log('🔑 Access Token gerado:', accessToken);
console.log('\n📦 Estrutura do token:');
console.log('   Header.Payload.Signature');
console.log('   ', accessToken.split('.')[0]); // Header
console.log('   .', accessToken.split('.')[1]); // Payload
console.log('   .', accessToken.split('.')[2]); // Signature

// Decodificar token (SEM validar - apenas para debug)
const decoded = tokenService.decodeToken(accessToken);
console.log('\n🔍 Payload decodificado:');
console.log(JSON.stringify(decoded, null, 2));

console.log('\n⏱️  Expiração:');
const expiresAt = new Date(decoded.exp * 1000);
console.log('   Emitido em:', new Date(decoded.iat * 1000).toLocaleString('pt-BR'));
console.log('   Expira em:', expiresAt.toLocaleString('pt-BR'));
console.log('   Válido por:', ((decoded.exp - decoded.iat) / 60), 'minutos');

// ============================================================================
// EXEMPLO 2: VALIDAR ACCESS TOKEN (no middleware protect)
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('EXEMPLO 2: Validar Access Token');
console.log('='.repeat(60));

try {
  // Validar token (verifica assinatura e expiração)
  const validated = tokenService.verifyAccessToken(accessToken);
  
  console.log('\n✅ Token VÁLIDO!');
  console.log('   User ID:', validated.userId);
  console.log('   Role:', validated.role);
  console.log('   Type:', validated.type);
  
} catch (error) {
  console.log('\n❌ Token INVÁLIDO!');
  console.log('   Erro:', error.message);
}

// ============================================================================
// EXEMPLO 3: TOKEN ADULTERADO (atacante tenta modificar)
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('EXEMPLO 3: Token Adulterado (Ataque Bloqueado)');
console.log('='.repeat(60));

// Atacante tenta mudar role de 'user' para 'admin'
const parts = accessToken.split('.');
const payloadOriginal = JSON.parse(Buffer.from(parts[1], 'base64').toString());

console.log('\n🔓 Payload original:', payloadOriginal.role);

// Atacante modifica payload
payloadOriginal.role = 'admin'; // ← Tentativa de privilege escalation
const payloadAdulterado = Buffer.from(JSON.stringify(payloadOriginal)).toString('base64url');

// Reconstruir token com payload adulterado (mas mesma assinatura)
const tokenAdulterado = parts[0] + '.' + payloadAdulterado + '.' + parts[2];

console.log('🔴 Atacante mudou role para:', payloadOriginal.role);
console.log('🔴 Token adulterado criado');

// Tentar validar token adulterado
try {
  tokenService.verifyAccessToken(tokenAdulterado);
  console.log('\n❌ FALHA DE SEGURANÇA! Token adulterado foi aceito!');
} catch (error) {
  console.log('\n✅ ATAQUE BLOQUEADO!');
  console.log('   Razão:', error.message);
  console.log('   Assinatura não bate (payload foi modificado)');
}

// ============================================================================
// EXEMPLO 4: TOKEN EXPIRADO
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('EXEMPLO 4: Token Expirado');
console.log('='.repeat(60));

// Criar token já expirado (expiresIn: -1 segundo)
const expiredToken = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '-1s' } // ← Já expirado!
);

console.log('\n⏱️  Token criado com expiração: -1 segundo (já expirado)');

try {
  tokenService.verifyAccessToken(expiredToken);
  console.log('\n❌ FALHA! Token expirado foi aceito!');
} catch (error) {
  console.log('\n✅ Token expirado rejeitado:');
  console.log('   Erro:', error.message);
}

// ============================================================================
// EXEMPLO 5: TOKEN COM SECRET ERRADO
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('EXEMPLO 5: Token com Secret Errado (Ataque Bloqueado)');
console.log('='.repeat(60));

// Atacante tenta criar token com secret que ele inventou
const fakeSecret = 'secret-do-atacante-123';
const fakeToken = jwt.sign(
  { userId: '999', role: 'admin' }, // ← Atacante se dá role admin
  fakeSecret, // ← Secret errado!
  { expiresIn: '1h' }
);

console.log('\n🔴 Atacante criou token com secret próprio');
console.log('   Token:', fakeToken.substring(0, 50) + '...');

try {
  tokenService.verifyAccessToken(fakeToken);
  console.log('\n❌ FALHA DE SEGURANÇA! Token com secret errado foi aceito!');
} catch (error) {
  console.log('\n✅ ATAQUE BLOQUEADO!');
  console.log('   Razão:', error.message);
  console.log('   Assinatura inválida (secret diferente)');
}

// ============================================================================
// EXEMPLO 6: GERAR REFRESH TOKEN
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('EXEMPLO 6: Gerar Refresh Token');
console.log('='.repeat(60));

(async () => {
  const refreshToken = await tokenService.generateRefreshToken(user.id, '192.168.1.1');
  
  console.log('\n🔑 Refresh Token gerado:', refreshToken);
  console.log('   Tipo: Random string (não é JWT)');
  console.log('   Tamanho:', refreshToken.length, 'caracteres');
  console.log('   Bits de entropia:', refreshToken.length * 4, 'bits (40 bytes)');
  console.log('\n📝 Diferenças:');
  console.log('   Access Token:  JWT assinado, stateless, curto (30min)');
  console.log('   Refresh Token: Random, stateful (banco), longo (7 dias)');
})();

// ============================================================================
// EXEMPLO 7: FLUXO COMPLETO DE AUTENTICAÇÃO
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('EXEMPLO 7: Fluxo Completo de Autenticação');
console.log('='.repeat(60));

console.log(`
FLUXO PASSO A PASSO:

1️⃣  LOGIN
    Cliente → POST /api/auth/login { email, password }
    Servidor → Valida credenciais
    Servidor → Gera access token (JWT, 30min)
    Servidor → Gera refresh token (random, 7 dias)
    Servidor → Define cookies httpOnly
    Cliente ← { user, accessToken } + cookies

2️⃣  ACESSO A RECURSO PROTEGIDO
    Cliente → GET /api/users/me
            → Cookie: accessToken=...
    
    Middleware protect:
    ├─ Extrai token do cookie
    ├─ Verifica assinatura HMAC-SHA256 ✅
    ├─ Verifica expiração ✅
    ├─ Busca usuário no banco ✅
    ├─ Verifica conta ativa ✅
    ├─ Verifica se senha mudou ✅
    └─ Anexa req.user
    
    Controller:
    └─ Acessa req.user (usuário autenticado)
    
    Cliente ← { success: true, data: { user } }

3️⃣  TOKEN EXPIRADO (após 30min)
    Cliente → GET /api/users/me
            → Cookie: accessToken=... (expirado)
    
    Middleware protect:
    └─ jwt.verify() detecta expiração
    
    Cliente ← 401 { code: 'TOKEN_EXPIRED' }

4️⃣  RENOVAR TOKEN
    Cliente → POST /api/auth/refresh
            → Cookie: refreshToken=...
    
    Servidor → Valida refresh token (banco)
    Servidor → Gera novo access token
    Servidor → Gera novo refresh token
    Servidor → Revoga token antigo (rotation)
    
    Cliente ← Novos tokens + cookies

5️⃣  REQUISIÇÃO COM NOVO TOKEN
    Cliente → GET /api/users/me
            → Cookie: accessToken=... (novo)
    
    Middleware protect → ✅ Válido
    
    Cliente ← { success: true, data: { user } }
`);

// ============================================================================
// EXEMPLO 8: MIDDLEWARE EM ROTA
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('EXEMPLO 8: Usar Middleware protect em Rotas');
console.log('='.repeat(60));

console.log(`
// src/routes/user.js
const { protect, restrictTo } = require('../middlewares/auth');

// ❌ Rota PÚBLICA (sem proteção)
router.get('/info', getInfo);

// ✅ Rota PROTEGIDA (apenas autenticados)
router.get('/profile', protect, getProfile);
// Qualquer usuário autenticado pode acessar

// 🔒 Rota RESTRITA (apenas admin)
router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);
// Apenas usuários com role='admin' podem acessar

// 🔒 Rota MÚLTIPLOS ROLES
router.put('/posts/:id', protect, restrictTo('admin', 'moderator'), editPost);
// Admin OU moderator podem acessar
`);

console.log('\nFluxo de execução:');
console.log('  1. protect → Verifica autenticação');
console.log('  2. restrictTo → Verifica permissão (role)');
console.log('  3. controller → Processa requisição');

// ============================================================================
// EXEMPLO 9: DECODIFICAR TOKEN (sem validar)
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('EXEMPLO 9: Decodificar Token (Debug)');
console.log('='.repeat(60));

const tokenParaDebug = accessToken;

console.log('\n⚠️  ATENÇÃO: jwt.decode() NÃO valida o token!');
console.log('   Use apenas para debug, NUNCA para autenticação!\n');

const decodedDebug = jwt.decode(tokenParaDebug);

console.log('Token:', tokenParaDebug.substring(0, 50) + '...');
console.log('\nPayload decodificado:');
console.log(JSON.stringify(decodedDebug, null, 2));

console.log('\n❌ jwt.decode() NÃO verifica:');
console.log('   • Assinatura (pode ser adulterado)');
console.log('   • Expiração (pode estar expirado)');
console.log('   • Secret (pode ter secret errado)');

console.log('\n✅ Para autenticação, SEMPRE use:');
console.log('   tokenService.verifyAccessToken(token)');

// ============================================================================
// RESUMO
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('RESUMO: JWT é Seguro Por Quê?');
console.log('='.repeat(60));

console.log(`
✅ ASSINATURA HMAC-SHA256
   • Impossível falsificar sem o secret
   • Qualquer modificação invalida assinatura
   • Comparação timing-safe

✅ SECRET FORTE (256-bit)
   • Armazenado em variável de ambiente
   • Nunca no código-fonte
   • Diferente em cada ambiente

✅ EXPIRAÇÃO CURTA (30min)
   • Token roubado expira rápido
   • Limita janela de ataque
   • Força renovação frequente

✅ STATELESS
   • Servidor não armazena tokens
   • Escalável horizontalmente
   • Zero queries de sessão

✅ HTTPONLY COOKIES
   • JavaScript não pode acessar
   • Previne XSS
   • sameSite previne CSRF

✅ VALIDAÇÃO RIGOROSA
   • Assinatura + expiração
   • Usuário existe no banco
   • Conta está ativa
   • Senha não foi alterada

✅ REFRESH TOKEN ROTATION
   • Detecta roubo de tokens
   • Revoga tokens comprometidos
   • Força logout global

🔒 RESULTADO: Sistema de autenticação robusto e seguro!
`);

console.log('\n📚 Documentação completa: SEGURANCA_JWT.md');
console.log('🧪 Testes de rota: node examples/testLoginRoute.js\n');
