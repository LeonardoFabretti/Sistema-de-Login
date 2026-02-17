/**
 * ROUTES: USER (com controle de permissões completo)
 * 
 * Demonstra implementação de rotas protegidas com:
 * - Autenticação (middleware protect)
 * - Autorização por role (middleware restrictTo)
 * - Validação de propriedade (IDOR protection)
 * - Whitelist de campos (mass assignment protection)
 * - Auditoria de ações sensíveis
 */

const express = require('express');
const { protect, restrictTo } = require('../middlewares/auth');
const { validate } = require('../middlewares/validateInput');
const logger = require('../utils/logger');
const User = require('../models/User');

const router = express.Router();

// ============================================================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================================================

/**
 * GET /api/users/count
 * Contador público de usuários registrados
 */
router.get('/count', async (req, res) => {
  try {
    const count = await User.count();
    
    res.json({
      success: true,
      data: { totalUsers: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contador'
    });
  }
});

// ============================================================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================================================

/**
 * GET /api/users/me
 * Retorna dados do usuário autenticado
 * 
 * PROTEÇÃO:
 * - protect: Valida JWT e anexa req.user
 */
router.get('/me', protect, async (req, res) => {
  try {
    // req.user já vem do middleware protect
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          is_email_verified: req.user.is_email_verified,
          created_at: req.user.created_at
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil'
    });
  }
});

/**
 * GET /api/users/:id
 * Retorna dados de um usuário específico
 * 
 * PROTEÇÃO:
 * - protect: Valida JWT
 * - IDOR: Usuário só pode ver próprio perfil (ou admin vê qualquer)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;
    
    // ✅ IDOR PROTECTION: Validar propriedade
    const isOwner = currentUser.id === targetUserId;
    const isAdmin = currentUser.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn(`IDOR ATTEMPT: ${currentUser.email} tentou acessar perfil ${targetUserId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Você só pode acessar seu próprio perfil',
        code: 'IDOR_PROTECTION'
      });
    }
    
    // Buscar usuário
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Log de auditoria (admin acessando perfil de outro)
    if (isAdmin && !isOwner) {
      logger.info(`AUDIT: Admin ${currentUser.email} acessou perfil de ${user.email}`);
    }
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    logger.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário'
    });
  }
});

/**
 * PUT /api/users/:id
 * Atualiza dados de um usuário
 * 
 * PROTEÇÃO:
 * - protect: Valida JWT
 * - IDOR: Usuário só pode editar próprio perfil
 * - Privilege Escalation: Apenas admin pode mudar role
 * - Mass Assignment: Whitelist de campos por role
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;
    const updates = req.body;
    
    // ✅ IDOR PROTECTION: Validar propriedade
    const isOwner = currentUser.id === targetUserId;
    const isAdmin = currentUser.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn(`IDOR ATTEMPT: ${currentUser.email} tentou editar perfil ${targetUserId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Você só pode editar seu próprio perfil',
        code: 'IDOR_PROTECTION'
      });
    }
    
    // ✅ PRIVILEGE ESCALATION PROTECTION: Apenas admin pode mudar role
    if (updates.role && currentUser.role !== 'admin') {
      logger.warn(`PRIVILEGE ESCALATION ATTEMPT: ${currentUser.email} tentou mudar role de ${targetUserId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem alterar roles',
        code: 'PRIVILEGE_ESCALATION_ATTEMPT'
      });
    }
    
    // ✅ MASS ASSIGNMENT PROTECTION: Whitelist de campos
    const allowedFields = isAdmin
      ? ['name', 'email', 'role', 'is_active', 'is_email_verified']
      : ['name', 'email'];
    
    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    // Detectar tentativas suspeitas
    const suspiciousFields = Object.keys(updates)
      .filter(field => !allowedFields.includes(field));
    
    if (suspiciousFields.length > 0) {
      logger.warn(`SUSPICIOUS UPDATE: ${currentUser.email} tentou atualizar campos não permitidos: ${suspiciousFields.join(', ')}`);
    }
    
    // Atualizar usuário
    const updatedUser = await User.update(targetUserId, filteredUpdates);
    
    // Log de auditoria (mudanças de role)
    if (filteredUpdates.role) {
      logger.info(`AUDIT: Admin ${currentUser.email} alterou role de ${updatedUser.email} para ${filteredUpdates.role}`);
    }
    
    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: { user: updatedUser },
      blockedFields: suspiciousFields
    });
    
  } catch (error) {
    logger.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário'
    });
  }
});

// ============================================================================
// ROTAS RESTRITAS (requerem role específico)
// ============================================================================

/**
 * GET /api/users
 * Lista todos os usuários (apenas admin)
 * 
 * PROTEÇÃO:
 * - protect: Valida JWT
 * - restrictTo('admin'): Apenas admin pode listar todos
 */
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const users = await User.findAll({ limit, offset });
    const total = await User.count();
    
    logger.info(`AUDIT: Admin ${req.user.email} listou usuários (página ${page})`);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Deleta um usuário (apenas admin)
 * 
 * PROTEÇÃO:
 * - protect: Valida JWT
 * - restrictTo('admin'): Apenas admin pode deletar
 * - Auditoria: Log completo da ação
 */
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const admin = req.user;
    
    // Buscar usuário antes de deletar (para log)
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Prevenir admin de deletar a si mesmo
    if (admin.id === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode deletar sua própria conta como admin',
        code: 'SELF_DELETE_PREVENTED'
      });
    }
    
    // Soft delete (desativar ao invés de deletar)
    await User.update(targetUserId, { is_active: false });
    
    // ✅ AUDITORIA: Log completo da ação sensível
    logger.warn(`AUDIT: Admin ${admin.email} desativou usuário ${targetUser.email} (ID: ${targetUserId})`);
    
    res.json({
      success: true,
      message: 'Usuário desativado com sucesso',
      data: {
        deletedUser: {
          id: targetUser.id,
          email: targetUser.email
        },
        deletedBy: {
          id: admin.id,
          email: admin.email
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar usuário'
    });
  }
});

/**
 * POST /api/users/:id/activate
 * Reativa um usuário desativado (apenas admin)
 * 
 * PROTEÇÃO:
 * - protect: Valida JWT
 * - restrictTo('admin'): Apenas admin pode reativar
 */
router.post('/:id/activate', protect, restrictTo('admin'), async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const admin = req.user;
    
    const updatedUser = await User.update(targetUserId, { is_active: true });
    
    logger.info(`AUDIT: Admin ${admin.email} reativou usuário ${updatedUser.email}`);
    
    res.json({
      success: true,
      message: 'Usuário reativado com sucesso',
      data: { user: updatedUser }
    });
    
  } catch (error) {
    logger.error('Erro ao reativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reativar usuário'
    });
  }
});

module.exports = router;
