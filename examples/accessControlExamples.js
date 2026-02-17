/**
 * EXEMPLOS: CONTROLE DE ACESSO E PERMISSÕES
 * 
 * Demonstra como implementar controle de acesso baseado em roles
 * e prevenir Broken Access Control (OWASP A01).
 * 
 * Execute: node examples/accessControlExamples.js
 */

const express = require('express');
const { protect, restrictTo } = require('../src/middlewares/auth');

const app = express();
app.use(express.json());

// ============================================================================
// EXEMPLO 1: ROTA PÚBLICA (sem autenticação)
// ============================================================================
app.get('/api/public/status', (req, res) => {
  res.json({
    success: true,
    message: 'API online',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// EXEMPLO 2: ROTA PROTEGIDA (apenas autenticados)
// ============================================================================
app.get('/api/users/me', protect, (req, res) => {
  // req.user foi anexado pelo middleware protect
  // Contém: { id, name, email, role, created_at, ... }
  
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

// ============================================================================
// EXEMPLO 3: ROTA ADMIN (apenas administradores)
// ============================================================================
app.get('/api/admin/users', protect, restrictTo('admin'), async (req, res) => {
  // Apenas admins chegam aqui
  // restrictTo('admin') valida req.user.role
  
  res.json({
    success: true,
    message: 'Lista de todos os usuários (apenas admin)',
    data: {
      users: [
        { id: 1, name: 'João Silva', email: 'joao@example.com', role: 'user' },
        { id: 2, name: 'Maria Admin', email: 'maria@example.com', role: 'admin' }
      ]
    }
  });
});

// ============================================================================
// EXEMPLO 4: MÚLTIPLOS ROLES (admin OU moderator)
// ============================================================================
app.delete('/api/posts/:id', 
  protect, 
  restrictTo('admin', 'moderator'), 
  async (req, res) => {
    // Admin OU moderator podem deletar posts
    
    res.json({
      success: true,
      message: `Post ${req.params.id} deletado`,
      deletedBy: {
        name: req.user.name,
        role: req.user.role
      }
    });
  }
);

// ============================================================================
// EXEMPLO 5: VALIDAÇÃO DE PROPRIEDADE (IDOR Protection)
// ============================================================================
// Usuário só pode editar próprio perfil (ou admin pode editar qualquer)

app.put('/api/users/:id', protect, async (req, res) => {
  const targetUserId = req.params.id;
  const currentUser = req.user;
  
  // ✅ PROTEÇÃO IDOR: Validar propriedade do recurso
  const isOwner = currentUser.id === targetUserId;
  const isAdmin = currentUser.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Você só pode editar seu próprio perfil',
      code: 'IDOR_PROTECTION',
      yourId: currentUser.id,
      targetId: targetUserId
    });
  }
  
  // Atualizar perfil...
  res.json({
    success: true,
    message: 'Perfil atualizado com sucesso',
    updatedBy: currentUser.email
  });
});

// ============================================================================
// EXEMPLO 6: PRIVILEGE ESCALATION PROTECTION
// ============================================================================
// Prevenir usuário de mudar próprio role para admin

app.put('/api/users/:id/update', protect, async (req, res) => {
  const targetUserId = req.params.id;
  const currentUser = req.user;
  const updates = req.body;
  
  // 1. Validar propriedade
  const isOwner = currentUser.id === targetUserId;
  const isAdmin = currentUser.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado',
      code: 'FORBIDDEN'
    });
  }
  
  // 2. ✅ PROTEÇÃO PRIVILEGE ESCALATION: 
  //    Apenas admin pode alterar role
  if (updates.role && currentUser.role !== 'admin') {
    console.warn(`⚠️  PRIVILEGE ESCALATION ATTEMPT: ${currentUser.email} tentou mudar role`);
    
    return res.status(403).json({
      success: false,
      message: 'Apenas administradores podem alterar roles',
      code: 'PRIVILEGE_ESCALATION_ATTEMPT',
      attemptedBy: currentUser.email,
      attemptedRole: updates.role
    });
  }
  
  // 3. ✅ WHITELIST DE CAMPOS: Filtrar apenas campos permitidos
  const allowedFields = isAdmin 
    ? ['name', 'email', 'role', 'is_active']  // Admin pode tudo
    : ['name', 'email'];                       // User só básico
  
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  
  // 4. Detectar tentativas suspeitas
  const suspiciousFields = Object.keys(updates)
    .filter(field => !allowedFields.includes(field));
  
  if (suspiciousFields.length > 0) {
    console.warn(`⚠️  SUSPICIOUS UPDATE: ${currentUser.email} tentou atualizar campos não permitidos: ${suspiciousFields.join(', ')}`);
  }
  
  res.json({
    success: true,
    message: 'Perfil atualizado',
    allowedUpdates: filteredUpdates,
    blockedFields: suspiciousFields
  });
});

// ============================================================================
// EXEMPLO 7: AUTORIZAÇÃO EM RECURSOS ANINHADOS
// ============================================================================
// Usuário só pode acessar próprios pedidos (ou admin vê todos)

app.get('/api/users/:userId/orders', protect, async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUser = req.user;
  
  const canAccess = (currentUser.id === targetUserId) || (currentUser.role === 'admin');
  
  if (!canAccess) {
    return res.status(403).json({
      success: false,
      message: 'Você só pode ver seus próprios pedidos',
      code: 'FORBIDDEN'
    });
  }
  
  // Buscar pedidos...
  res.json({
    success: true,
    data: {
      orders: [
        { id: 1, product: 'Notebook', price: 3000, status: 'delivered' },
        { id: 2, product: 'Mouse', price: 50, status: 'pending' }
      ]
    }
  });
});

// ============================================================================
// EXEMPLO 8: SOFT DELETE (apenas admin pode ver recursos deletados)
// ============================================================================
app.get('/api/posts', protect, async (req, res) => {
  const currentUser = req.user;
  const includeDeleted = req.query.includeDeleted === 'true';
  
  // Apenas admin pode ver posts deletados
  if (includeDeleted && currentUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Apenas administradores podem ver recursos deletados',
      code: 'ADMIN_ONLY_FEATURE'
    });
  }
  
  // Query condicional
  const posts = includeDeleted 
    ? await getAllPostsIncludingDeleted()
    : await getActivePosts();
  
  res.json({ success: true, data: { posts } });
});

// ============================================================================
// EXEMPLO 9: RATE LIMITING POR ROLE (admin sem limite)
// ============================================================================
const rateLimit = require('express-rate-limit');

const createRateLimiter = (maxRequests) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: maxRequests,
    skip: (req) => req.user?.role === 'admin', // ✅ Admin não tem limite
    message: {
      success: false,
      message: 'Muitas requisições. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  });
};

// Usuários comuns: 100 req/15min
// Admins: sem limite
app.get('/api/data', 
  protect, 
  createRateLimiter(100), 
  (req, res) => {
    res.json({ success: true, data: 'Dados sensíveis' });
  }
);

// ============================================================================
// EXEMPLO 10: AUDITORIA DE AÇÕES SENSÍVEIS
// ============================================================================
const logAudit = (action, userId, targetId, result) => {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action} - User: ${userId} - Target: ${targetId} - Result: ${result}`);
  
  // Em produção, salvar no banco:
  // await AuditLog.create({ action, userId, targetId, result });
};

app.delete('/api/users/:id', 
  protect, 
  restrictTo('admin'), 
  async (req, res) => {
    const targetUserId = req.params.id;
    const admin = req.user;
    
    try {
      // Deletar usuário...
      // await User.delete(targetUserId);
      
      // ✅ LOG DE AUDITORIA
      logAudit('DELETE_USER', admin.id, targetUserId, 'SUCCESS');
      
      res.json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });
    } catch (error) {
      logAudit('DELETE_USER', admin.id, targetUserId, 'FAILED');
      throw error;
    }
  }
);

// ============================================================================
// MOCK FUNCTIONS (para demonstração)
// ============================================================================
const getAllPostsIncludingDeleted = async () => [
  { id: 1, title: 'Post 1', deleted: false },
  { id: 2, title: 'Post 2', deleted: true }
];

const getActivePosts = async () => [
  { id: 1, title: 'Post 1', deleted: false }
];

// ============================================================================
// DEMONSTRAÇÃO COM EXEMPLOS
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║        EXEMPLOS: CONTROLE DE ACESSO E PERMISSÕES              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📌 EXEMPLO 1: Rota Pública');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET /api/public/status');
console.log('✅ Qualquer pessoa pode acessar (sem autenticação)\n');

console.log('📌 EXEMPLO 2: Rota Protegida');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET /api/users/me');
console.log('Headers: Authorization: Bearer <token>');
console.log('✅ Apenas usuários autenticados\n');

console.log('📌 EXEMPLO 3: Rota Admin');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET /api/admin/users');
console.log('Middleware: protect + restrictTo("admin")');
console.log('✅ Apenas role=admin');
console.log('❌ Se user: 403 Forbidden - Permissões insuficientes\n');

console.log('📌 EXEMPLO 4: Múltiplos Roles');
console.log('─────────────────────────────────────────────────────────────────');
console.log('DELETE /api/posts/:id');
console.log('Middleware: protect + restrictTo("admin", "moderator")');
console.log('✅ Admin OU moderator podem deletar');
console.log('❌ User comum: 403 Forbidden\n');

console.log('📌 EXEMPLO 5: Proteção IDOR');
console.log('─────────────────────────────────────────────────────────────────');
console.log('PUT /api/users/456 (logado como user 123)');
console.log('Validação: req.user.id === targetId || req.user.role === "admin"');
console.log('❌ 403 Forbidden - Você só pode editar seu próprio perfil');
console.log('✅ Admin pode editar qualquer perfil (auditoria)\n');

console.log('📌 EXEMPLO 6: Privilege Escalation Protection');
console.log('─────────────────────────────────────────────────────────────────');
console.log('PUT /api/users/123 { role: "admin" } (usuário comum)');
console.log('Validação: if (updates.role && user.role !== "admin") → 403');
console.log('❌ 403 Forbidden - Apenas administradores podem alterar roles');
console.log('⚠️  LOG: "PRIVILEGE ESCALATION ATTEMPT: user@example.com tentou mudar role"\n');

console.log('📌 EXEMPLO 7: Recursos Aninhados');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET /api/users/456/orders (logado como user 123)');
console.log('❌ 403 Forbidden - Você só pode ver seus próprios pedidos');
console.log('GET /api/users/123/orders (próprio usuário)');
console.log('✅ 200 OK - Lista de pedidos\n');

console.log('📌 EXEMPLO 8: Soft Delete (admin only)');
console.log('─────────────────────────────────────────────────────────────────');
console.log('GET /api/posts?includeDeleted=true (usuário comum)');
console.log('❌ 403 Forbidden - Apenas administradores podem ver recursos deletados');
console.log('GET /api/posts?includeDeleted=true (admin)');
console.log('✅ 200 OK - Retorna posts ativos + deletados\n');

console.log('📌 EXEMPLO 9: Rate Limiting por Role');
console.log('─────────────────────────────────────────────────────────────────');
console.log('User comum: 100 requisições / 15 minutos');
console.log('Admin: sem limite (skip: req.user.role === "admin")');
console.log('✅ Admin pode fazer requisições ilimitadas (tarefas administrativas)\n');

console.log('📌 EXEMPLO 10: Auditoria');
console.log('─────────────────────────────────────────────────────────────────');
console.log('DELETE /api/users/456 (admin)');
console.log('Log: [AUDIT] DELETE_USER - User: admin_id - Target: 456 - Result: SUCCESS');
console.log('✅ Todas as ações sensíveis são auditadas\n');

console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('🔒 PROTEÇÕES IMPLEMENTADAS:\n');
console.log('1️⃣  Autenticação: Middleware protect valida JWT');
console.log('2️⃣  Autorização: Middleware restrictTo valida role');
console.log('3️⃣  IDOR Protection: Valida propriedade do recurso');
console.log('4️⃣  Privilege Escalation: Whitelist de campos por role');
console.log('5️⃣  Auditoria: Log de ações sensíveis');
console.log('6️⃣  Rate Limiting: Admins sem limite, users limitados');
console.log('7️⃣  Soft Delete: Apenas admin vê recursos deletados');
console.log('8️⃣  Validação de Role: Role vem do banco, não do client\n');

console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('⚠️  VULNERABILIDADES PREVENIDAS:\n');
console.log('❌ IDOR: Insecure Direct Object Reference');
console.log('   Solução: Validar propriedade antes de qualquer operação\n');
console.log('❌ Privilege Escalation: Virar admin mudando próprio role');
console.log('   Solução: Apenas admin pode alterar roles + whitelist de campos\n');
console.log('❌ Missing Function Level Access Control');
console.log('   Solução: Middleware restrictTo em rotas sensíveis\n');
console.log('❌ Forced Browsing: Acessar áreas restritas sem autenticação');
console.log('   Solução: Middleware protect em todas as rotas não-públicas\n');
console.log('❌ Mass Assignment: Atualizar campos sensíveis via req.body');
console.log('   Solução: Whitelist de campos permitidos por role\n');

console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('📚 DOCUMENTAÇÃO COMPLETA: BROKEN_ACCESS_CONTROL.md\n');

// Iniciar servidor (opcional)
if (require.main === module) {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de exemplos rodando em http://localhost:${PORT}`);
    console.log(`📖 Teste os endpoints acima para ver as proteções em ação\n`);
  });
}

module.exports = app;
