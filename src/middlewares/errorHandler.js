/**
 * MIDDLEWARE: TRATAMENTO DE ERROS GLOBAL
 *
 * Compatível com:
 * - Node.js 22
 * - Express
 * - PostgreSQL
 *
 * Responsabilidades:
 * - Capturar todos os erros não tratados
 * - Padronizar respostas de erro
 * - Diferenciar desenvolvimento e produção
 * - Tratar erros comuns (PostgreSQL, JWT)
 */

/**
 * Tratamento de erro de duplicação no PostgreSQL
 * Código 23505 = unique_violation
 */
const handleDuplicateFieldsPostgreSQL = (err) => {
  if (err.detail && err.detail.includes('email')) {
    return {
      message: 'Este email já está cadastrado. Faça login ou use outro email.',
      statusCode: 409,
    };
  }

  return {
    message: 'Valor duplicado. Este dado já está em uso.',
    statusCode: 409,
  };
};

/**
 * Tratamento de erros de JWT
 */
const handleJWTError = () => ({
  message: 'Token inválido. Faça login novamente.',
  statusCode: 401,
});

const handleJWTExpiredError = () => ({
  message: 'Token expirado. Faça login novamente.',
  statusCode: 401,
});

/**
 * Resposta de erro em desenvolvimento (detalhada)
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

/**
 * Resposta de erro em produção (segura)
 */
const sendErrorProd = (err, res) => {
  // Erro operacional conhecido
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Erro desconhecido (não vazar detalhes)
  console.error('🔥 ERRO NÃO OPERACIONAL:', err);

  return res.status(500).json({
    success: false,
    message: 'Algo deu errado. Tente novamente mais tarde.',
  });
};

/**
 * Middleware global de tratamento de erros
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.isOperational = err.isOperational || false;

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // PostgreSQL: violação de chave única
    if (err.code === '23505') {
      const handled = handleDuplicateFieldsPostgreSQL(err);
      error.message = handled.message;
      error.statusCode = handled.statusCode;
      error.isOperational = true;
    }

    // JWT inválido
    if (err.name === 'JsonWebTokenError') {
      const handled = handleJWTError();
      error.message = handled.message;
      error.statusCode = handled.statusCode;
      error.isOperational = true;
    }

    // JWT expirado
    if (err.name === 'TokenExpiredError') {
      const handled = handleJWTExpiredError();
      error.message = handled.message;
      error.statusCode = handled.statusCode;
      error.isOperational = true;
    }

    return sendErrorProd(error, res);
  }
};

module.exports = errorHandler;
