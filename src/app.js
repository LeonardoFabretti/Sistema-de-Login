/**
 * CONFIGURAÇÃO PRINCIPAL DO EXPRESS
 * 
 * Responsabilidades:
 * - Configurar middlewares globais (helmet, cors, parsers, etc)
 * - Configurar rotas
 * - Configurar middleware de erro global
 * - Exportar app configurado
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { rateLimiter } = require('./middlewares/rateLimiter');

const app = express();

/**
 * MIDDLEWARES DE SEGURANÇA
 */

// Helmet: Define headers HTTP seguros (com CSP ajustado para frontend)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS: Controle de origem cruzada
// Configuração para suportar GitHub Pages (produção) e localhost (desenvolvimento)
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5000', 'http://127.0.0.1:5000'];

// Log da configuração CORS na inicialização
console.log('🔐 CORS Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT_SET'}`);
console.log(`   CORS_ORIGIN env: ${process.env.CORS_ORIGIN || 'NOT_SET (using fallback)'}`);
console.log(`   Allowed Origins:`, allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      // Origem está na lista permitida
      console.log(`✅ CORS: Origin ${origin} allowed`);
      callback(null, true);
    } else {
      // Origem não permitida
      console.warn(`❌ CORS BLOCKED: Origin "${origin}" not in allowed list: [${allowedOrigins.join(', ')}]`);
      console.warn(`⚠️  To fix: Set CORS_ORIGIN environment variable in Railway to include: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permite envio de cookies e headers de autenticação
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204, // Para navegadores legados
  maxAge: 86400 // Cache do preflight por 24h
}));

// Rate limiting global
app.use(rateLimiter);

// Body parser
app.use(express.json({ limit: '10kb' })); // Limitar tamanho do body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Sanitização contra XSS
app.use(xss());

// Logger HTTP (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * ARQUIVOS ESTÁTICOS: Servir interface web (frontend)
 */
app.use(express.static(path.join(__dirname, '../public')));

/**
 * ROTAS
 */

// Rota raiz: Redirecionar para página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor funcionando' });
});

// CORS Debug - Verificar configuração
app.get('/api/cors-debug', (req, res) => {
  res.status(200).json({
    success: true,
    corsConfig: {
      allowedOrigins: allowedOrigins,
      corsOriginEnv: process.env.CORS_ORIGIN || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV || 'NOT_SET',
      requestOrigin: req.get('origin') || 'NO_ORIGIN'
    },
    message: 'Se allowedOrigins não contém seu domínio, configure CORS_ORIGIN no Railway'
  });
});

// Rotas da aplicação
app.use('/api', routes);

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.originalUrl} não encontrada`
  });
});

/**
 * MIDDLEWARE DE ERRO GLOBAL
 * Deve ser o último middleware
 */
app.use(errorHandler);

module.exports = app;
