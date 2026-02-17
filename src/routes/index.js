/**
 * ROUTES: INDEX (Roteador Principal)
 * 
 * Responsabilidades:
 * - Agregar todas as rotas da aplicação
 * - Organizar rotas por recurso/módulo
 * - Aplicar middlewares globais específicos de rotas
 */

const express = require('express');
const authRoutes = require('./auth');

const router = express.Router();

/**
 * Montar rotas por módulo
 */
router.use('/auth', authRoutes);

// Adicionar outras rotas aqui
// router.use('/users', userRoutes);
// router.use('/posts', postRoutes);

module.exports = router;
