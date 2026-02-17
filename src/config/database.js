/**
 * CONFIGURAÇÃO DO BANCO DE DADOS - PostgreSQL
 * 
 * Responsabilidades:
 * - Estabelecer pool de conexões com PostgreSQL
 * - Configurar opções de conexão (SSL, timeout, pool size)
 * - Tratamento de erros de conexão
 * - Logging de status de conexão
 * - Gerenciamento de lifecycle do pool
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

/**
 * Configuração do Pool de Conexões PostgreSQL
 * 
 * Pool oferece melhor performance que conexões individuais,
 * reutilizando conexões existentes ao invés de criar novas.
 */
const pool = new Pool({
  // A connectionString é obtida da variável de ambiente DATABASE_URL
  // Formato: postgresql://username:password@host:port/database
  connectionString: process.env.DATABASE_URL,
  
  // Configurações de SSL
  // Em produção (Railway, Heroku, etc), SSL é geralmente necessário
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false, // Aceita certificados auto-assinados
  } : false,
  
  // Configurações do Pool
  max: 20, // Máximo de conexões no pool
  min: 2,  // Mínimo de conexões mantidas
  idleTimeoutMillis: 30000, // Tempo máximo de conexão ociosa (30s)
  connectionTimeoutMillis: 10000, // Timeout para obter conexão do pool (10s)
  
  // Configuração de statement timeout
  // Previne queries que travam indefinidamente
  statement_timeout: 30000, // 30 segundos
});

/**
 * Eventos do Pool para monitoramento
 */

// Evento disparado quando uma conexão é estabelecida
pool.on('connect', (client) => {
  logger.info('Nova conexão PostgreSQL estabelecida no pool');
});

// Evento disparado quando ocorre erro em conexão ociosa
pool.on('error', (err, client) => {
  logger.error('Erro inesperado em conexão ociosa do PostgreSQL:', err);
  // Não encerrar o processo - o pool tentará recuperar
});

// Evento disparado quando uma conexão é removida do pool
pool.on('remove', (client) => {
  logger.info('Conexão PostgreSQL removida do pool');
});

/**
 * Conecta ao banco de dados e testa a conexão
 */
const connectDB = async () => {
  try {
    // Testar conexão executando uma query simples
    const client = await pool.connect();
    
    // Query de teste
    const result = await client.query('SELECT NOW() as now, version() as version');
    
    logger.info('PostgreSQL conectado com sucesso!');
    logger.info(`Timestamp do servidor: ${result.rows[0].now}`);
    logger.info(`Versão do PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
    
    // Liberar conexão de volta ao pool
    client.release();
    
    // Verificar configurações do pool
    logger.info(`Pool configurado: min=${pool.options.min}, max=${pool.options.max}`);
    
    return pool;
  } catch (error) {
    logger.error('Erro ao conectar ao PostgreSQL:', error.message);
    logger.error('Stack:', error.stack);
    
    // Verificar se é erro de credenciais
    if (error.code === '28P01') {
      logger.error('❌ Credenciais inválidas. Verifique DATABASE_URL no .env');
    }
    // Verificar se é erro de conexão de rede
    else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      logger.error('❌ Não foi possível conectar ao servidor PostgreSQL');
      logger.error('Verifique se o host e porta estão corretos na DATABASE_URL');
    }
    
    throw error;
  }
};

/**
 * Encerra o pool de conexões graciosamente
 * Útil para shutdown da aplicação
 */
const disconnectDB = async () => {
  try {
    await pool.end();
    logger.info('Pool de conexões PostgreSQL encerrado');
  } catch (error) {
    logger.error('Erro ao encerrar pool PostgreSQL:', error);
    throw error;
  }
};

/**
 * Executa uma query no banco de dados
 * 
 * @param {string} text - Query SQL
 * @param {Array} params - Parâmetros para prepared statement
 * @returns {Promise<Object>} Resultado da query
 */
const query = async (text, params) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug(`Query executada em ${duration}ms: ${text}`);
    
    return result;
  } catch (error) {
    logger.error('Erro ao executar query:', error.message);
    logger.error('Query:', text);
    logger.error('Params:', params);
    throw error;
  }
};

/**
 * Obtém um cliente do pool para transações
 * IMPORTANTE: Sempre liberar o cliente depois de usar!
 * 
 * Exemplo de uso:
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   await client.query('INSERT...');
 *   await client.query('UPDATE...');
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 *   throw e;
 * } finally {
 *   client.release();
 * }
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Executa uma transação
 * 
 * @param {Function} callback - Função async que recebe o client
 * @returns {Promise<any>} Resultado da transação
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transação revertida devido a erro:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Verificar saúde da conexão (Health Check)
 */
const healthCheck = async () => {
  try {
    const result = await pool.query('SELECT 1');
    return {
      status: 'healthy',
      message: 'PostgreSQL connection is active',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Exportar pool e funções auxiliares
module.exports = {
  connectDB,
  disconnectDB,
  query,
  getClient,
  transaction,
  healthCheck,
  pool, // Exportar pool para uso direto quando necessário
};
