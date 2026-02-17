/**
 * ROUTES: AUTENTICAÇÃO
 * 
 * Responsabilidades:
 * - Definir rotas de autenticação
 * - Associar rotas a controllers
 * - Aplicar middlewares específicos (validação, rate limiting)
 * - Documentar endpoints
 */

const express = require('express');
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validateInput');
const { protect } = require('../middlewares/auth');
const {
  loginRateLimiter,
  registerRateLimiter,
} = require('../middlewares/rateLimiter');
const {
  registerSchema,
  loginSchema,
  emailSchema,
} = require('../validators/authValidator');

const router = express.Router();

/**
 * Rotas públicas (sem autenticação)
 */

// POST /api/auth/register
// Cadastro de novo usuário
// SEGURANÇA:
// 1. registerRateLimiter - Limita tentativas (previne spam/DoS)
// 2. validate(registerSchema) - Valida e sanitiza inputs
// 3. authController.register - Processa registro
router.post(
  '/register',
  registerRateLimiter,
  validate(registerSchema),
  authController.register
);

// POST /api/auth/login
// Login de usuário
// SEGURANÇA:
// 1. loginRateLimiter - Previne brute force (5 tentativas/15min)
// 2. validate(loginSchema) - Valida formato (NÃO política de senha)
// 3. authController.login - Processa autenticação
router.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema),
  authController.login
);

// POST /api/auth/refresh
// Renovar access token
router.post(
  '/refresh',
  authController.refreshToken
);

// POST /api/auth/forgot-password
// Solicitar reset de senha
// router.post(
//   '/forgot-password',
//   validate(emailSchema),
//   authController.forgotPassword
// );

// POST /api/auth/reset-password/:token
// Resetar senha
// router.post(
//   '/reset-password/:token',
//   authController.resetPassword
// );

/**
 * Rotas protegidas (requerem autenticação)
 * 
 * MIDDLEWARE PROTECT:
 * - Valida JWT (assinatura HMAC-SHA256)
 * - Verifica expiração do token
 * - Busca usuário no banco
 * - Anexa req.user = { id, name, email, role }
 * 
 * USO:
 * router.get('/rota', protect, controller)
 */

// GET /api/auth/me
// Obter dados do usuário logado
// PROTEÇÃO: Requer token JWT válido
router.get(
  '/me',
  protect,  // ✅ Middleware ativado - valida JWT
  authController.getMe
);

// POST /api/auth/logout
// Logout de usuário (revoga refresh token)
// PROTEÇÃO: Requer token JWT válido
router.post(
  '/logout',
  protect,  // ✅ Middleware ativado - valida JWT
  authController.logout
);

// POST /api/auth/update-password
// Atualizar senha
// router.post(
//   '/update-password',
//   protect,
//   validate(updatePasswordSchema),
//   authController.updatePassword
// );

module.exports = router;
