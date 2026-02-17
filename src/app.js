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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
