/**
 * EXEMPLO: ROTAS PROTEGIDAS COM JWT
 * 
 * Demonstra como usar o middleware de autenticação JWT
 * para proteger rotas e controlar acesso por roles.
 * 
 * Execute: node examples/protectedRoutes.js
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const { protect, restrictTo } = require('../src/middlewares/auth');

const app = express();
app.use(express.json());
app.use(cookieParser());

// ============================================================================
// EXEMPLO 1: ROTA PÚBLICA (sem autenticação)
// ============================================================================
app.get('/api/public/info', (req, res) => {
  res.json({
    success: true,
    message: 'Esta rota é pública. Qualquer pessoa pode acessar.',
    data: {
      appName: 'Sistema de Autenticação',
      version: '1.0.0',
      features: ['JWT', 'bcrypt', 'PostgreSQL']
    }
  });
});

// ============================================================================
// EXEMPLO 2: ROTA PROTEGIDA (requer autenticação)
// ============================================================================
// Qualquer usuário autenticado pode acessar
// O middleware 'protect' valida o JWT e anexa req.user
app.get('/api/users/me', protect, (req, res) => {
  // req.user foi anexado pelo middleware protect
  res.json({
    success: true,
    message: 'Perfil do usuário autenticado',
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        created_at: req.user.created_at
      }
    }
  });
});

// ============================================================================
// EXEMPLO 3: ROTA PROTEGIDA + RESTRITA (requer role específico)
// ============================================================================
// Apenas administradores podem acessar
// Usa protect (autentica) + restrictTo (autoriza por role)
app.get('/api/admin/users', protect, restrictTo('admin'), async (req, res) => {
  res.json({
    success: true,
    message: 'Lista de todos os usuários (apenas admin)',
    data: {
      users: [
        { id: 1, name: 'João Silva', email: 'joao@example.com', role: 'user' },
        { id: 2, name: 'Maria Santos', email: 'maria@example.com', role: 'admin' },
      ]
    }
  });
});

// ============================================================================
// EXEMPLO 4: MÚLTIPLOS ROLES PERMITIDOS
// ============================================================================
// Admin OU moderator podem acessar
app.delete('/api/posts/:id', protect, restrictTo('admin', 'moderator'), (req, res) => {
  res.json({
    success: true,
    message: `Post ${req.params.id} deletado por ${req.user.role}`,
    data: {
      deletedBy: req.user.email,
      role: req.user.role
    }
  });
});

// ============================================================================
// EXEMPLO 5: ROTA COM LÓGICA DE AUTORIZAÇÃO CUSTOMIZADA
// ============================================================================
// Usuário só pode editar seu próprio perfil (ou admin pode editar qualquer)
app.put('/api/users/:id', protect, async (req, res) => {
  const targetUserId = req.params.id;
  const currentUser = req.user;
  
  // Verifica permissão: próprio usuário OU admin
  const isOwnProfile = currentUser.id === targetUserId;
  const isAdmin = currentUser.role === 'admin';
  
  if (!isOwnProfile && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Você só pode editar seu próprio perfil',
      code: 'FORBIDDEN'
    });
  }
  
  res.json({
    success: true,
    message: 'Perfil atualizado com sucesso',
    data: {
      updatedBy: currentUser.email,
      targetUser: targetUserId
    }
  });
});

// ============================================================================
// TRATAMENTO DE ERROS
// ============================================================================
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// ============================================================================
// DEMONSTRAÇÃO COM EXEMPLOS DE REQUISIÇÕES
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          EXEMPLOS DE USO: ROTAS PROTEGIDAS COM JWT            ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📌 EXEMPLO 1: Rota Pública (sem token)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET http://localhost:3000/api/public/info');
console.log('Headers: (nenhum)');
console.log('✅ Resultado: 200 OK - Qualquer um pode acessar\n');

console.log('📌 EXEMPLO 2: Rota Protegida (com token válido)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET http://localhost:3000/api/users/me');
console.log('Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
console.log('✅ Resultado: 200 OK - Retorna dados do usuário autenticado\n');

console.log('📌 EXEMPLO 3: Rota Protegida (sem token)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET http://localhost:3000/api/users/me');
console.log('Headers: (nenhum)');
console.log('❌ Resultado: 401 Unauthorized - Token não fornecido\n');

console.log('📌 EXEMPLO 4: Rota Protegida (token expirado)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET http://localhost:3000/api/users/me');
console.log('Headers: Authorization: Bearer <token_expirado>');
console.log('❌ Resultado: 401 Unauthorized - Token expirado\n');

console.log('📌 EXEMPLO 5: Rota Admin (usuário comum tenta acessar)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET http://localhost:3000/api/admin/users');
console.log('Headers: Authorization: Bearer <token_user_comum>');
console.log('❌ Resultado: 403 Forbidden - Permissões insuficientes\n');

console.log('📌 EXEMPLO 6: Rota Admin (admin válido)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET http://localhost:3000/api/admin/users');
console.log('Headers: Authorization: Bearer <token_admin>');
console.log('✅ Resultado: 200 OK - Lista de usuários\n');

console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('📚 COMO FUNCIONA A VALIDAÇÃO JWT:\n');
console.log('1️⃣  Extração: Token vem do header "Authorization: Bearer <token>"');
console.log('              OU do cookie "accessToken"');
console.log('');
console.log('2️⃣  Decodificação: Token JWT = Header.Payload.Signature (Base64)');
console.log('              Header:  {"alg":"HS256","typ":"JWT"}');
console.log('              Payload: {"userId":"123","role":"user","exp":...}');
console.log('              Signature: HMAC-SHA256(Header.Payload, SECRET)');
console.log('');
console.log('3️⃣  Verificação da Assinatura (previne falsificação):');
console.log('              - Recalcula: HMAC-SHA256(Header.Payload, SECRET)');
console.log('              - Compara com assinatura recebida (timing-safe)');
console.log('              - Se diferente = token foi adulterado ❌');
console.log('');
console.log('4️⃣  Verificação de Expiração:');
console.log('              - Compara exp (do payload) com timestamp atual');
console.log('              - Se expirado = token não é mais válido ❌');
console.log('');
console.log('5️⃣  Busca Usuário no Banco:');
console.log('              - Usa userId do payload para buscar no PostgreSQL');
console.log('              - Se usuário não existe = deletado ❌');
console.log('');
console.log('6️⃣  Verificações Adicionais:');
console.log('              - Conta ativa? (is_active = true)');
console.log('              - Senha mudou? (password_changed_at > token.iat)');
console.log('');
console.log('7️⃣  Anexa Usuário ao Request:');
console.log('              - req.user = { id, name, email, role, ... }');
console.log('              - Controladores podem acessar req.user');
console.log('');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('🔒 POR QUE É SEGURO:\n');
console.log('✅ Assinatura HMAC-SHA256:');
console.log('   - Impossível falsificar sem o secret');
console.log('   - Qualquer alteração no payload invalida a assinatura');
console.log('   - Exemplo: Trocar role="user" para role="admin" = assinatura inválida');
console.log('');
console.log('✅ Secret Forte (256-bit):');
console.log('   - Armazenado em variável de ambiente (.env)');
console.log('   - NUNCA commitado no Git');
console.log('   - Impossível adivinhar por força bruta');
console.log('');
console.log('✅ Expiração Curta (30 minutos):');
console.log('   - Mesmo se token for roubado, expira rápido');
console.log('   - Limita janela de ataque');
console.log('   - Refresh token (7 dias) renovando access token');
console.log('');
console.log('✅ Stateless:');
console.log('   - Servidor não armazena sessões');
console.log('   - Escalável horizontalmente');
console.log('   - Não requer banco de dados para validar token');
console.log('');
console.log('✅ HttpOnly Cookies:');
console.log('   - JavaScript não pode acessar (previne XSS)');
console.log('   - Enviado automaticamente em cada requisição');
console.log('   - Mais seguro que localStorage');
console.log('');
console.log('✅ Comparação Timing-Safe:');
console.log('   - Comparação de assinatura em tempo constante');
console.log('   - Previne timing attacks');
console.log('   - Implementado nativamente pelo jsonwebtoken');
console.log('');
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('📖 DOCUMENTAÇÃO COMPLETA: SEGURANCA_JWT.md');
console.log('🧪 EXEMPLOS DE USO: examples/jwtUsage.js\n');
