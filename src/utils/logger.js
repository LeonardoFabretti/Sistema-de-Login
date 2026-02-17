/**
 * UTILITY: LOGGER
 * 
 * Responsabilidades:
 * - Configurar sistema de logging (Winston)
 * - Definir níveis de log (error, warn, info, debug)
 * - Definir formatos de log
 * - Configurar transportes (console, arquivo)
 * - Não logar informações sensíveis
 */

// const winston = require('winston');
// const path = require('path');

/**
 * Definir formato de log
 */
// const logFormat = winston.format.combine(
//   winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//   winston.format.errors({ stack: true }),
//   winston.format.splat(),
//   winston.format.json()
// );

/**
 * Formato para console (mais legível)
 */
// const consoleFormat = winston.format.combine(
//   winston.format.colorize(),
//   winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//   winston.format.printf(({ timestamp, level, message, ...meta }) => {
//     return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
//   })
// );

/**
 * Configurar logger
 */
// const logger = winston.createLogger({
//   level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
//   format: logFormat,
//   transports: [
//     // Logs de erro em arquivo separado
//     new winston.transports.File({
//       filename: path.join(__dirname, '../../logs/error.log'),
//       level: 'error',
//     }),
//     // Todos os logs
//     new winston.transports.File({
//       filename: path.join(__dirname, '../../logs/combined.log'),
//     }),
//   ],
//   exceptionHandlers: [
//     new winston.transports.File({
//       filename: path.join(__dirname, '../../logs/exceptions.log'),
//     }),
//   ],
// });

/**
 * Em desenvolvimento, também logar no console
 */
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new winston.transports.Console({
//     format: consoleFormat,
//   }));
// }

// module.exports = logger;

module.exports = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  debug: (msg) => console.debug(`[DEBUG] ${msg}`),
};
