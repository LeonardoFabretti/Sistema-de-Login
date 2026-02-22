/**
 * SERVICE: AUTENTICAÇÃO - PostgreSQL
 * 
 * Responsabilidades:
 * - Lógica de negócio para autenticação
 * - Registro de usuários
 * - Login e validação de credenciais
 * - Integração com tokenService e User model
 * - Não lida diretamente com HTTP (isso é responsabilidade do controller)
 */

const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const tokenService = require('./tokenService');
const emailService = require('./emailService');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Registrar novo usuário
 * 
 * SEGURANÇA:
 * - Verifica duplicação de email (feito no model)
 * - Hasheia senha automaticamente (feito no model)
 * - Gera tokens JWT
 * - Loga evento de registro
 * 
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.name - Nome
 * @param {string} userData.email - Email
 * @param {string} userData.password - Senha em texto plano
 * @returns {Promise<Object>} { user, accessToken, refreshToken }
 */
const registerUser = async ({ name, email, password }) => {
  try {
    console.log('[AUTH SERVICE] Iniciando registro de usuário...');
    console.log('[AUTH SERVICE] Dados recebidos:', { name, email, passwordLength: password?.length });
    
    // 1. Criar usuário no banco
    // SEGURANÇA: User.create já:
    // - Verifica se email existe
    // - Hasheia a senha
    // - Normaliza email (lowercase)
    console.log('[AUTH SERVICE] Chamando User.create...');
    const user = await User.create({
      name,
      email,
      password, // Será hasheada automaticamente
      role: 'user',
    });
    console.log('[AUTH SERVICE] Usuário criado com sucesso:', user.id);
   
    // 2. Gerar tokens JWT
    // SEGURANÇA: Token contém userId e role (para controle de acesso)
    console.log('[AUTH SERVICE] Gerando access token...');
    const accessToken = tokenService.generateAccessToken(user.id, user.role);
    console.log('[AUTH SERVICE] Gerando refresh token...');
    const refreshToken = await tokenService.generateRefreshToken(user.id);
    console.log('[AUTH SERVICE] Tokens gerados com sucesso');
    
    // 3. Logar evento de segurança
    // AUDITORIA: Registro de novo usuário para rastreamento
    logger.info(`[AUTH] Novo usuário registrado | Email: ${email} | UserID: ${user.id} | Role: ${user.role} | Timestamp: ${new Date().toISOString()}`);
    
    // 4. Retornar dados (user já vem SEM senha do model)
    return {
      user,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('[AUTH SERVICE] ERRO:', error);
    console.error('[AUTH SERVICE] Stack:', error.stack);
    logger.error('Erro ao registrar usuário', error);
    throw error;
  }
};

/**
 * Login de usuário
 * 
 * SEGURANÇA:
 * - Validação completa de credenciais (feita no model)
 * - Verifica bloqueio de conta
 * - Incrementa tentativas falhas
 * - Mensagens genéricas
 * - Loga eventos de login
 * 
 * @param {Object} credentials - Credenciais
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Senha
 * @param {string} credentials.ipAddress - IP do cliente
 * @returns {Promise<Object>} { user, accessToken, refreshToken }
 */
const loginUser = async ({ email, password, ipAddress }) => {
  try {
    // 1. Validar credenciais
    // SEGURANÇA: User.validateCredentials já:
    // - Verifica se usuário existe (mensagem genérica)
    // - Verifica se conta está ativa
    // - Verifica se conta está bloqueada
    // - Compara senha com bcrypt
    // - Incrementa tentativas falhas se erro
    // - Reseta tentativas se sucesso
    const user = await User.validateCredentials(email, password);
    
    // 2. Gerar tokens JWT
    // SEGURANÇA: Token contém userId e role (para middleware restrict To)
    const accessToken = tokenService.generateAccessToken(user.id, user.role);
    const refreshToken = await tokenService.generateRefreshToken(user.id, ipAddress);
    
    // 3. Logar evento de segurança
    // AUDITORIA: Login bem-sucedido para detecção de padrões suspeitos
    logger.info(`[AUTH] Login bem-sucedido | Email: ${email} | UserID: ${user.id} | Role: ${user.role} | IP: ${ipAddress} | Timestamp: ${new Date().toISOString()}`);
    
    // 4. Retornar dados (user já vem SEM senha)
    return {
      user,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    // Logar tentativa falha (sem revelar detalhes)
    // AUDITORIA: Falha de login para detecção de ataques brute force
    logger.warn(`[AUTH] Login falhou | Email: ${email} | IP: ${ipAddress} | Erro: ${error.message} | Timestamp: ${new Date().toISOString()}`);
    throw error;
  }
};

/**
 * Obter dados do usuário atual (para rota /me)
 * 
 * @param {string} userId - ID do usuário autenticado
 * @returns {Promise<Object>} Dados do usuário
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  
  return user;
};

/**
 * Atualizar senha do usuário
 * 
 * @param {string} userId - ID do usuário
 * @param {string} currentPassword - Senha atual
 * @param {string} newPassword - Nova senha
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    // 1. Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // 2. Buscar com senha para validar senha atual
    const userWithPassword = await User.findByEmailWithPassword(user.email);
    const isCurrentPasswordValid = await User.comparePassword(
      currentPassword,
      userWithPassword.password
    );
    
    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }
    
    // 3. Atualizar senha
    await User.updatePassword(userId, newPassword);
    
    // 4. Logar evento
    // AUDITORIA: Mudança de senha para detecção de comprometimento
    logger.info(`[AUTH] Senha atualizada | UserID: ${userId} | Timestamp: ${new Date().toISOString()}`);
    
    // SEGURANÇA: password_changed_at é atualizado automaticamente
    // Isso invalida tokens JWT antigos (quando verificados)
    
  } catch (error) {
    logger.error('Erro ao atualizar senha:', error.message);
    throw error;
  }
};

/**
 * Solicitar código de recuperação de senha
 * 
 * SEGURANÇA:
 * - Gera código aleatório de 6 dígitos
 * - Código expira em 15 minutos
 * - Salva hash do código no banco password_resets (não salva código em texto plano)
 * - Apaga códigos antigos do mesmo email
 * - Envia código por email
 * - NÃO revela se email existe (sempre retorna sucesso)
 * 
 * @param {string} email - Email do usuário
 */
const requestPasswordReset = async (email) => {
  try {
    console.log('[AUTH SERVICE] Solicitando reset de senha para:', email);
    
    // 1. Buscar usuário por email
    const user = await User.findByEmail(email);
    
    // SEGURANÇA: Se usuário não existe, retorna sem erro
    // Isso previne que atacantes descubram quais emails estão cadastrados
    if (!user) {
      console.log('[AUTH SERVICE] Email não encontrado (retornando sucesso por segurança)');
      return;
    }
    
    // 2. Gerar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[AUTH SERVICE] Código gerado:', resetCode);
    
    // 3. Hashear código com bcrypt
    const hashedCode = await bcrypt.hash(resetCode, 10);
    
    // 4. Definir expiração (15 minutos)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // 5. Salvar código hasheado na tabela password_resets
    // SEGURANÇA: Apaga automaticamente códigos antigos do mesmo email
    await PasswordReset.create(email, hashedCode, expiresAt);
    console.log('[AUTH SERVICE] Código salvo na tabela password_resets');
    
    // 6. Enviar email com código
    await emailService.sendPasswordResetEmail(user, resetCode);
    console.log('[AUTH SERVICE] Email enviado com código de reset');
    
    // 7. Logar evento
    logger.info(`[AUTH] Código de reset solicitado | Email: ${email} | UserID: ${user.id} | Expira: ${expiresAt.toISOString()}`);
    
  } catch (error) {
    logger.error('[AUTH SERVICE] Erro ao solicitar reset de senha:', error);
    // NÃO propaga erro para não revelar se email existe
    // throw error;
  }
};

/**
 * Redefinir senha usando código de verificação
 * 
 * SEGURANÇA:
 * - Valida código de 6 dígitos
 * - Verifica expiração (15 minutos)
 * - Compara código fornecido com hash no banco
 * - Valida força da nova senha
 * - Hasheia nova senha com bcrypt
 * - Invalida código após uso
 * - Atualiza password_changed_at
 * 
 * @param {string} email - Email do usuário
 * @param {string} code - Código de 6 dígitos
 * @param {string} newPassword - Nova senha
 */
const resetPasswordWithCode = async (email, code, newPassword) => {
  try {
    console.log('[AUTH SERVICE] Redefinindo senha para:', email);
    
    // 1. Buscar código de reset na tabela password_resets
    const resetRecord = await PasswordReset.findByEmail(email);
    
    if (!resetRecord) {
      throw new Error('Código de recuperação inválido ou expirado');
    }
    
    // 2. Validar código fornecido com hash no banco
    const isCodeValid = await PasswordReset.validateCode(code, resetRecord.code_hash);
    
    if (!isCodeValid) {
      console.log('[AUTH SERVICE] Código inválido');
      throw new Error('Código de recuperação inválido');
    }
    
    // 3. Buscar usuário por email
    const user = await User.findByEmail(email);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // 4. Validar força da nova senha
    if (newPassword.length < 8) {
      throw new Error('A senha deve ter no mínimo 8 caracteres');
    }
    
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      throw new Error('A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais');
    }
    
    // 5. Atualizar senha no banco (será hasheada automaticamente)
    await User.updatePassword(user.id, newPassword);
    console.log('[AUTH SERVICE] Senha atualizada');
    
    // 6. Atualizar password_changed_at
    await User.updatePasswordChangedAt(user.id);
    console.log('[AUTH SERVICE] password_changed_at atualizado');
    
    // 7. Invalidar código (deletar da tabela password_resets)
    await PasswordReset.deleteByEmail(email);
    console.log('[AUTH SERVICE] Código invalidado');
    
    // 8. Logar evento
    logger.info(`[AUTH] Senha redefinida via código | Email: ${email} | UserID: ${user.id} | Timestamp: ${new Date().toISOString()}`);
    
  } catch (error) {
    logger.error('[AUTH SERVICE] Erro ao redefinir senha:', error);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updatePassword,
  requestPasswordReset,
  resetPasswordWithCode,
};
