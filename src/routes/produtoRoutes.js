// Importar o Express para criar o router
const express = require('express');
const router = express.Router();

// Importar as funções do Controller
const ProdutoController = require('../controllers/produtoController');

// ============================================================
// DEFINIÇÃO DAS ROTAS
// ============================================================

// GET /produtos - Listar todos os produtos
router.get('/', ProdutoController.listarTodos);

// GET /produtos/categoria/:categoria - Buscar por categoria
router.get('/categoria/:categoria', ProdutoController.buscarPorCategoria);

// GET /produtos/:id - Buscar produto específico por ID
router.get('/:id', ProdutoController.buscarPorId);

// POST /produtos - Criar novo produto
router.post('/', ProdutoController.criar);

// PUT /produtos/:id - Atualizar produto completo
router.put('/:id', ProdutoController.atualizar);

// DELETE /produtos/:id - Deletar produto
router.delete('/:id', ProdutoController.deletar);

// ============================================================
// EXPORTAR O ROUTER
// ============================================================
module.exports = router;
