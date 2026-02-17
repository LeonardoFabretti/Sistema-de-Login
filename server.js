/**
 * ENTRY POINT DA APLICAÇÃO
 * 
 * Responsabilidades:
 * - Carregar variáveis de ambiente
 * - Inicializar conexão com banco de dados
 * - Configurar e iniciar o servidor Express
 * - Tratamento de erros não capturados
 */

require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

/**
 * Inicialização do servidor
 */
const startServer = async () => {
  try {
    // Conectar ao banco de dados PostgreSQL
    await connectDB();
    
    // Iniciar servidor Express
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando em modo ${process.env.NODE_ENV} na porta ${PORT}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

/**
 * Tratamento de erros não capturados
 */
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Desligando...', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Desligando...', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido. Encerrando graciosamente...');
  const { disconnectDB } = require('./src/config/database');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recebido. Encerrando graciosamente...');
  const { disconnectDB } = require('./src/config/database');
  await disconnectDB();
  process.exit(0);
});

// Iniciar aplicação
startServer();
