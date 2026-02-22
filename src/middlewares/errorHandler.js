/**
 * Global Error Handler Middleware
 * Compatível com Node.js 22 + Express + PostgreSQL
 */

const errorHandler = (err, req, res, next) => {
  console.error('🔥 ERRO GLOBAL:', err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
  });
};

module.exports = errorHandler;