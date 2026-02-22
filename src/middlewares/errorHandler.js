/**
 * MIDDLEWARE: TRATAMENTO DE ERROS GLOBAL
 * 
 * Responsabilidades:
 * - Capturar todos os erros não tratados
 * - Formatar respostas de erro consistentes
 * - Logar erros para monitoramento
 * - Diferenciar entre ambiente de desenvolvimento e produção
 * - Tratar erros específicos (MongoDB, JWT, validação, etc)
 */

// const logger = require('../utils/logger');

/**
 * Tratamento de erros de cast do MongoDB
 */
const handleCastErrorDB = (err) => {
  const message = `Valor inválido para ${err.path}: ${err.value}`;
  return { message, statusCode: 400 };
};

/**
 * Tratamento de erros de duplicação do MongoDB
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field} já está em uso. Use outro valor.`;
  return { message, statusCode: 400 };
};

/**
 * Tratamento de erros de duplicação do PostgreSQL
 */
const handleDuplicateFieldsPostgreSQL = (err) => {
  // PostgreSQL error code 23505 = unique_violation
  if (err.message && err.message.includes('email')) {
    return { message: 'Este email já está cadastrado. Faça login ou use outro email.', statusCode: 409 };
  }
  return { message: 'Valor duplicado. Este dado já está em uso.', statusCode: 409 };
};

/**
 * Tratamento de erros de validação do MongoDB
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Dados inválidos: ${errors.join('. ')}`;
  return { message, statusCode: 400 };
};

/**
 * Tratamento de erros de JWT
 */
const handleJWTError = () => {
  return { message: 'Token inválido. Faça login novamente.', statusCode: 401 };
};

const handleJWTExpiredError = () => {
  return { message: 'Token expirado. Faça login novamente.', statusCode: 401 };
};

/**
 * Resposta de erro em desenvolvimento (mais detalhada)
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Resposta de erro em produção (mais genérica)
 */
const sendErrorProd = (err, res) => {
  // Erro operacional confiável: enviar mensagem ao cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } 
  // Erro de programação ou desconhecido: não vazar detalhes
  else {
    // logger.error('ERRO:', err);
    
    res.status(500).json({
      success: false,
      message: 'Algo deu errado. Tente novamente mais tarde.',
    });
  }
};

/**
 * Middleware de tratamento de erros global
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    
    // Tratar erros específicos do PostgreSQL
    if (err.code === '23505') {  // PostgreSQL: unique violation
      const handled = handleDuplicateFieldsPostgreSQL(err);
      error.message = handled.message;
      error.statusCode = handled.statusCode;
      error.isOperational = true;
    }
    
    // Tratar erros específicos do MongoDB (legacy)
    if (err.name === 'CastError') {
      const handled = handleCastErrorDB(err);
      error.message = handled.message;
      error.statusCode = handled.statusCode;
      error.isOperational = true;
    }
      error.isOperational = true;
    }
    if (err.name === 'JsonWebTokenError') {
      const handled = handleJWTError();
      error.message = handled.message;
      error.statusCode = handled.statusCode;
      error.isOperational = true;
    }
    if (err.name === 'TokenExpiredError') {
      const handled = handleJWTExpiredError();
      error.message = handled.message;
      error.statusCode = handled.statusCode;
      error.isOperational = true;
    }
    if (err.name === 'JsonWebTokenError') {
      const handled = handleJWTError();
      error.message = handled.message;
      error.statusCode = handled.statusCode;
    }
    if (err.name === 'TokenExpiredError') {
      const handled = handleJWTExpiredError();
      error.message = handled.message;
      error.statusCode = handled.statusCode;
    }
    
    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;
