/**
 * Global error handling middleware
 * Express + Node.js 22
 */

function errorHandler(err, req, res, next) {
  console.error('🔥 ERRO GLOBAL:', err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
  });
}

module.exports = errorHandler; dfd453614a22974050219acf7b65ca6cd5b85249
