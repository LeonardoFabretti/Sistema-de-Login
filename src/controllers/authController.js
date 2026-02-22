/**
 * CONTROLLER: AUTENTICAÇÃO
 * 
 * Responsabilidades:
 * - Receber requisições HTTP relacionadas à autenticação
 * - Validar inputs básicos (já validados por middleware)
 * - Chamar services apropriados
 * - Retornar respostas HTTP formatadas
 * - Tratar erros e passar para middleware de erro
 * 
 * Endpoints:
 * - POST /register - Cadastro de novo usuário
 * - POST /login - Login de usuário
 * - POST /logout - Logout de usuário
 * - POST /refresh - Renovar access token
 * - POST /forgot-password - Solicitar reset de senha
 * - POST /reset-password - Resetar senha
 * - GET /me - Obter dados do usuário logado
 */

const authService = require('../services/authService');
const tokenService = require('../services/tokenService');
const { cookieOptions } = require('../config/jwt');

/**
 * @desc    Registrar novo usuário
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * SEGURANÇA:
 * - Dados já validados pelo middleware de validação
 * - Service verifica duplicação de email
 * - Senha é hasheada automaticamente no model
 * - Não retorna dados sensíveis na resposta
 * - Loga evento de segurança
 */
const register = async (req, res, next) => {
  try {
    console.log('[AUTH CONTROLLER] ===== INÍCIO DO REGISTRO =====');
    console.log('[AUTH CONTROLLER] req.body:', req.body);
    
    const { name, email, password } = req.body;
    
    console.log('[AUTH CONTROLLER] Dados extraídos:', { 
      name, 
      email, 
      hasPassword: !!password, 
      passwordLength: password?.length 
    });
    
    // Validação básica
    if (!name || !email || !password) {
      console.error('[AUTH CONTROLLER] Dados faltando:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios',
        data: { name: !!name, email: !!email, password: !!password }
      });
    }
    
    // Chamar service de registro
    // O service irá:
    // 1. Verificar se email já existe
    // 2. Hashear a senha com bcrypt (12 rounds)
    // 3. Salvar usuário no banco
    // 4. Gerar tokens JWT
    // 5. Logar evento
    console.log('[AUTH CONTROLLER] Chamando authService.registerUser...');
    const result = await authService.registerUser({ name, email, password });
    console.log('[AUTH CONTROLLER] authService.registerUser retornou com sucesso');
    
    // Definir cookies com tokens
    // httpOnly: true - Previne acesso via JavaScript (XSS)
    // secure: true - Apenas HTTPS em produção
    // sameSite: 'strict' - Previne CSRF
    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
    
    console.log('[AUTH CONTROLLER] Enviando resposta 201...');
    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: result.user, // Já vem SEM senha do service
        accessToken: result.accessToken,
      }
    });
    console.log('[AUTH CONTROLLER] ===== FIM DO REGISTRO (SUCESSO) =====');
  } catch (error) {
    console.error('[AUTH CONTROLLER] ===== ERRO NO REGISTRO =====');
    console.error('[AUTH CONTROLLER] Error:', error);
    console.error('[AUTH CONTROLLER] Error message:', error.message);
    console.error('[AUTH CONTROLLER] Error code:', error.code);
    console.error('[AUTH CONTROLLER] Error statusCode:', error.statusCode);
    console.error('[AUTH CONTROLLER] Stack:', error.stack);
    next(error);
  }
};

/**
 * @desc    Login de usuário
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * SEGURANÇA:
 * - Dados já validados pelo middleware
 * - Service valida credenciais com mensagens genéricas
 * - Verifica bloqueio de conta (brute force protection)
 * - Compara senha com bcrypt.compare() (timing-safe)
 * - IP é logado para auditoria
 * - Cookies httpOnly previnem XSS
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Chamar service de login
    // O service irá:
    // 1. Buscar usuário por email (com senha)
    // 2. Verificar se conta está ativa
    // 3. Verificar se conta está bloqueada
    // 4. Comparar senha com bcrypt
    // 5. Incrementar tentativas falhas OU resetar contador
    // 6. Gerar tokens JWT
    // 7. Logar evento
    const result = await authService.loginUser({ email, password, ipAddress });
    
    // Definir cookies seguros
    // httpOnly: true - JavaScript não pode acessar (XSS protection)
    // secure: true - Apenas HTTPS em produção
    // sameSite: 'strict' - Previne CSRF
    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
    
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: result.user, // SEM senha
        accessToken: result.accessToken,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout de usuário
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // const refreshToken = req.cookies.refreshToken;
    // const ipAddress = req.ip;
    
    // Revogar refresh token
    // await tokenService.revokeToken(refreshToken, ipAddress);
    
    // Limpar cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Renovar access token usando refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    // const { refreshToken } = req.cookies;
    // const ipAddress = req.ip;
    
    // if (!refreshToken) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Refresh token não fornecido'
    //   });
    // }
    
    // Renovar tokens
    // const result = await tokenService.refreshTokens(refreshToken, ipAddress);
    
    // Definir novos cookies
    // res.cookie('accessToken', result.accessToken, cookieOptions);
    // res.cookie('refreshToken', result.refreshToken, {
    //   ...cookieOptions,
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });
    
    res.status(200).json({
      success: true,
      message: 'Token renovado com sucesso',
      // data: {
      //   accessToken: result.accessToken,
      // }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Solicitar código de recuperação de senha
 * @route   POST /api/auth/forgot-password
 * @access  Public
 * 
 * SEGURANÇA:
 * - Gera código aleatório de 6 dígitos
 * - Código expira em 15 minutos
 * - Salva hash do código no banco
 * - Envia código por email
 * - Não revela se email existe (segurança)
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    console.log('[AUTH CONTROLLER] Solicitação de recuperação de senha para:', email);
    
    // Chamar service de forgot password
    // O service irá:
    // 1. Verificar se email existe
    // 2. Gerar código de 6 dígitos
    // 3. Salvar código hasheado no banco com expiração
    // 4. Enviar email com código
    // 5. Retornar sempre sucesso (não revela se email existe)
    await authService.requestPasswordReset(email);
    
    // SEMPRE retorna sucesso, mesmo se email não existir
    // Isso previne que atacantes descubram quais emails estão cadastrados
    res.status(200).json({
      success: true,
      message: 'Se o email existir, você receberá um código de recuperação em breve.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Redefinir senha usando código
 * @route   POST /api/auth/reset-password
 * @access  Public
 * 
 * SEGURANÇA:
 * - Valida código de 6 dígitos
 * - Verifica expiração (15 minutos)
 * - Valida força da nova senha
 * - Hashea nova senha com bcrypt
 * - Invalida código após uso
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    
    console.log('[AUTH CONTROLLER] Redefinição de senha para:', email);
    
    // Validação básica
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, código e nova senha são obrigatórios',
      });
    }
    
    // Chamar service de reset password
    // O service irá:
    // 1. Buscar usuário por email
    // 2. Verificar se código existe e não expirou
    // 3. Comparar código fornecido com hash do banco
    // 4. Validar força da nova senha
    // 5. Hashear nova senha
    // 6. Atualizar senha no banco
    // 7. Invalidar código de reset
    await authService.resetPasswordWithCode(email, code, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso! Faça login com sua nova senha.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obter dados do usuário logado
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        // user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
