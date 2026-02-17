/**
 * VALIDATORS: AUTENTICAÇÃO
 * 
 * Responsabilidades:
 * - Definir schemas de validação Joi
 * - Validação de formatos (email, senha, etc)
 * - Regras de negócio para inputs
 * - Política de senha forte
 */

const Joi = require('joi');
const { passwordPolicy } = require('../config/security');

/**
 * Validação customizada de senha forte
 * 
 * SEGURANÇA:
 * - Força política de senha complexa
 * - Previne senhas fracas comuns
 * - Aplica múltiplos requisitos (maiúscula, minúscula, número, especial)
 * - Limita tamanho para prevenir DoS
 */
const passwordSchema = Joi.string()
  .min(passwordPolicy.minLength)
  .max(passwordPolicy.maxLength)
  .pattern(new RegExp('(?=.*[a-z])')) // Pelo menos uma letra minúscula
  .pattern(new RegExp('(?=.*[A-Z])')) // Pelo menos uma letra maiúscula
  .pattern(new RegExp('(?=.*[0-9])')) // Pelo menos um número
  .pattern(new RegExp(`(?=.*[${passwordPolicy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}])`)) // Pelo menos um caractere especial
  .required()
  .messages({
    'string.min': `Senha deve ter no mínimo ${passwordPolicy.minLength} caracteres`,
    'string.max': `Senha deve ter no máximo ${passwordPolicy.maxLength} caracteres`,
    'string.pattern.base': 'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
    'any.required': 'Senha é obrigatória',
  });

/**
 * Schema de validação para registro
 * 
 * SEGURANÇA:
 * - Valida formato de email
 * - Normaliza email para lowercase (previne duplicação)
 * - Valida força da senha
 * - Remove campos desconhecidos (stripUnknown)
 * - Limita tamanho de strings (previne buffer overflow)
 */
const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nome deve ter no mínimo 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório',
    }),
  
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Email inválido',
      'string.max': 'Email muito longo',
      'any.required': 'Email é obrigatório',
    }),
  
  password: passwordSchema,
});

/**
 * Schema de validação para login
 * 
 * SEGURANÇA:
 * - NÃO valida política de senha forte (apenas se está presente)
 * - Isso previne enumeração de usuários (atacante não sabe se email existe)
 * - Normaliza email (lowercase)
 * - Mensagens genéricas
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha é obrigatória',
    }),
});

/**
 * Schema de validação para atualização de senha
 */
const updatePasswordSchema = {}; // Joi.object({
//   currentPassword: Joi.string()
//     .required()
//     .messages({
//       'any.required': 'Senha atual é obrigatória',
//     }),
//   
//   newPassword: passwordSchema,
//   
//   confirmNewPassword: Joi.string()
//     .valid(Joi.ref('newPassword'))
//     .required()
//     .messages({
//       'any.only': 'Senhas não coincidem',
//       'any.required': 'Confirmação de senha é obrigatória',
//     }),
// });

/**
 * Schema de validação para email
 */
const emailSchema = {}; // Joi.object({
//   email: Joi.string()
//     .trim()
//     .lowercase()
//     .email()
//     .required()
//     .messages({
//       'string.email': 'Email inválido',
//       'any.required': 'Email é obrigatório',
//     }),
// });

module.exports = {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  emailSchema,
};
