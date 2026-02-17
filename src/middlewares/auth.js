/**
 * MIDDLEWARE: AUTENTICAÇÃO
 * 
 * Responsabilidades:
 * - Verificar presença de token JWT
 * - Validar assinatura do token
 * - Decodificar payload e anexar usuário ao request
 * - Verificar se usuário ainda existe e está ativo
 * - Verificar se senha foi alterada após emissão do token
 * - Proteger rotas que requerem autenticação
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenService = require('../services/tokenService');
const logger = require('../utils/logger');

/**
 * Middleware para proteger rotas (requer autenticação)
 * 
 * COMO FUNCIONA:
 * 1. Extrai token do Authorization header OU cookie
 * 2. Verifica assinatura JWT (previne falsificação)
 * 3. Verifica expiração (previne replay attacks)
 * 4. Busca usuário no banco (verifica existência)
 * 5. Verifica se conta está ativa (soft delete)
 * 6. Verifica se senha mudou (invalida tokens antigos)
 * 7. Anexa usuário ao req.user (controladores acessam)
 * 
 * SEGURANÇA:
 * - Aceita token de 2 fontes: header Authorization OU cookie
 * - Header: Melhor para APIs (mobile, SPA)
 * - Cookie: Melhor para SSR (httpOnly previne XSS)
 * - Verifica assinatura HMAC-SHA256 (timing-safe)
 * - Verifica expiração automaticamente (jwt.verify)
 * - Valida que usuário ainda existe (delete de conta)
 * - Valida que senha não mudou (change password invalida tokens)
 * 
 * USO:
 * router.get('/profile', protect, getProfile);
 * router.put('/settings', protect, updateSettings);
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Próximo middleware
 */
const protect = async (req, res, next) => {
  try {
    // ========================================================================
    // PASSO 1: EXTRAIR TOKEN
    // ========================================================================
    let token;
    
    // Fonte 1: Authorization header (Bearer token)
    // Exemplo: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      logger.debug('Token extraído do Authorization header');
    } 
    // Fonte 2: Cookie (httpOnly)
    // Exemplo: Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
      logger.debug('Token extraído do cookie');
    }
    
    // Se token não foi fornecido em nenhuma fonte
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado. Token de acesso não fornecido.',
      });
    }
    
    // ========================================================================
    // PASSO 2: VERIFICAR E DECODIFICAR TOKEN JWT
    // ========================================================================
    // tokenService.verifyAccessToken() faz:
    // 1. Decodifica header e payload (base64)
    // 2. Recalcula assinatura HMAC-SHA256 com secret
    // 3. Compara assinatura (constant-time comparison)
    // 4. Verifica expiração (exp claim)
    // 5. Verifica issuer/audience (previne token de outro sistema)
    // 6. Retorna payload OU lança erro
    const decoded = tokenService.verifyAccessToken(token);
    
    // Payload decodificado contém:
    // - userId: ID do usuário
    // - role: Papel (user, admin)
    // - iat: Issued At (timestamp de emissão)
    // - exp: Expiration (timestamp de expiração)
    
    // ========================================================================
    // PASSO 3: BUSCAR USUÁRIO NO BANCO
    // ========================================================================
    // Verifica se usuário ainda existe
    // (pode ter sido deletado após emissão do token)
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado. Token inválido.',
      });
    }
    
    // ========================================================================
    // PASSO 4: VERIFICAR SE CONTA ESTÁ ATIVA
    // ========================================================================
    // Soft delete: is_active = false
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.',
      });
    }
    
    // ========================================================================
    // PASSO 5: VERIFICAR SE SENHA FOI ALTERADA
    // ========================================================================
    // Se usuário mudou senha, todos os tokens antigos devem ser invalidados
    // Comparamos password_changed_at com iat (issued at) do token
    if (user.password_changed_at) {
      const changedTimestamp = Math.floor(user.password_changed_at.getTime() / 1000);
      const tokenIssuedAt = decoded.iat;
      
      // Se senha foi mudada DEPOIS da emissão do token
      if (changedTimestamp > tokenIssuedAt) {
        logger.warn(`Token invalidado por mudança de senha. User: ${user.email}`);
        return res.status(401).json({
          success: false,
          message: 'Senha foi alterada recentemente. Faça login novamente.',
        });
      }
    }
    
    // ========================================================================
    // PASSO 6: ANEXAR USUÁRIO AO REQUEST
    // ========================================================================
    // Controladores podem acessar req.user
    // IMPORTANTE: Remover password antes de anexar
    delete user.password;
    req.user = user;
    
    logger.debug(`Usuário autenticado: ${user.email} (${user.id})`);
    
    // Prosseguir para próximo middleware/controlador
    next();
    
  } catch (error) {
    // ========================================================================
    // TRATAMENTO DE ERROS ESPECÍFICOS
    // ========================================================================
    
    // Erro 1: Token expirado (exp claim passou)
    if (error.name === 'TokenExpiredError') {
      logger.warn('Tentativa de acesso com token expirado');
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Renove usando refresh token.',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    // Erro 2: Token inválido ou adulterado (assinatura não bate)
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Tentativa de acesso com token inválido');
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou adulterado.',
        code: 'TOKEN_INVALID',
      });
    }
    
    // Erro 3: Token ainda não é válido (nbf claim)
    if (error.name === 'NotBeforeError') {
      logger.warn('Tentativa de acesso com token prematuro');
      return res.status(401).json({
        success: false,
        message: 'Token ainda não é válido.',
        code: 'TOKEN_NOT_BEFORE',
      });
    }
    
    // Erro genérico
    logger.error('Erro ao verificar autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar autenticação.',
    });
  }
};

/**
 * Middleware para restringir acesso por papel (role)
 * 
 * COMO FUNCIONA:
 * - Retorna um middleware que verifica req.user.role
 * - Se role não está na lista permitida, retorna 403 Forbidden
 * - Deve ser usado DEPOIS de protect
 * 
 * SEGURANÇA:
 * - 401 Unauthorized: Não autenticado (sem token ou token inválido)
 * - 403 Forbidden: Autenticado mas sem permissão (role errado)
 * - Previne privilege escalation
 * - Baseado em claim 'role' do JWT
 * 
 * USO:
 * // Apenas admins podem acessar
 * router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);
 * 
 * // Admins e moderadores podem acessar
 * router.put('/posts/:id', protect, restrictTo('admin', 'moderator'), editPost);
 * 
 * @param {...string} roles - Lista de roles permitidos
 * @returns {Function} Middleware do Express
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Verifica se usuário foi anexado pelo middleware protect
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação requerida. Use o middleware protect antes de restrictTo.',
      });
    }
    
    // Verifica se role do usuário está na lista permitida
    if (!roles.includes(req.user.role)) {
      logger.warn(`Acesso negado: ${req.user.email} (${req.user.role}) tentou acessar recurso restrito a [${roles.join(', ')}]`);
      
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar este recurso.',
        requiredRoles: roles,
        yourRole: req.user.role,
      });
    }
    
    // Role permitido, prosseguir
    logger.debug(`Acesso autorizado: ${req.user.email} (${req.user.role})`);
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
