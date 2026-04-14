// Importar o pool de conexões do PostgreSQL
const pool = require('../config/database');

// ============================================================
// FUNÇÃO: listarTodos
// DESCRIÇÃO: Retorna todos os produtos do banco
// RETORNO: Promise com array de produtos
// ============================================================
// pool.query() já retorna uma Promise automaticamente!
// Não precisamos criar new Promise como fizemos no SQLite
async function listarTodos() {
  // PostgreSQL: a query retorna um objeto 'result'
  const result = await pool.query(
    'SELECT * FROM produtos ORDER BY id'
  );
  
  // Os dados ficam em result.rows
  return result.rows;
}

// ============================================================
// FUNÇÃO: buscarPorId
// DESCRIÇÃO: Busca um produto específico
// PARÂMETRO: id (número)
// RETORNO: Promise com o produto ou undefined
// ============================================================
async function buscarPorId(id) {
  // PostgreSQL usa $1, $2, $3... como placeholders
  // (SQLite usava ? ? ?)
  const result = await pool.query(
    'SELECT * FROM produtos WHERE id = $1',
    [id]  // O array com os valores dos placeholders
  );
  
  // Retorna o primeiro resultado (ou undefined se não achar)
  return result.rows[0];
}

// ============================================================
// FUNÇÃO: criar
// DESCRIÇÃO: Insere um novo produto no banco
// PARÂMETRO: dados (objeto)
// RETORNO: Promise com o produto criado (incluindo o ID)
// ============================================================
async function criar(dados) {
  const { nome, preco, estoque, categoria } = dados;
  
  // RETURNING * é um recurso do PostgreSQL que retorna
  // o registro inserido automaticamente!
  const sql = `
    INSERT INTO produtos (nome, preco, estoque, categoria)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  // Executar a query com os valores
  const result = await pool.query(
    sql,
    [nome, preco, estoque, categoria]
  );
  
  // O produto inserido com o ID gerado pelo banco
  return result.rows[0];
}

// ============================================================
// FUNÇÃO: atualizar
// DESCRIÇÃO: Atualiza todos os dados de um produto
// PARÂMETROS: id, dados
// RETORNO: Promise com produto atualizado ou null
// ============================================================
async function atualizar(id, dados) {
  const { nome, preco, estoque, categoria } = dados;
  
  // UPDATE com RETURNING * também retorna o registro atualizado
  const sql = `
    UPDATE produtos
    SET nome = $1, preco = $2, estoque = $3, categoria = $4
    WHERE id = $5
    RETURNING *
  `;
  
  const result = await pool.query(
    sql,
    [nome, preco, estoque, categoria, id]
  );
  
  // Se não atualizou nenhuma linha, retorna null
  return result.rows[0] || null;
}

// ============================================================
// FUNÇÃO: deletar
// DESCRIÇÃO: Remove um produto do banco
// PARÂMETRO: id (número)
// RETORNO: Promise com true/false
// ============================================================
async function deletar(id) {
  const result = await pool.query(
    'DELETE FROM produtos WHERE id = $1',
    [id]
  );
  
  // rowCount indica quantas linhas foram afetadas
  // Se for > 0, significa que deletou algo
  return result.rowCount > 0;
}

// ============================================================
// FUNÇÃO: buscarPorCategoria
// DESCRIÇÃO: Filtra produtos por categoria
// PARÂMETRO: categoria (string)
// RETORNO: Promise com array de produtos
// ============================================================
async function buscarPorCategoria(categoria) {
  // ILIKE é o LIKE case-insensitive do PostgreSQL
  // (no SQLite usávamos LIKE normal)
  const sql = 'SELECT * FROM produtos WHERE categoria ILIKE $1';
  
  const result = await pool.query(
    sql,
    [`%${categoria}%`]  // % = wildcard (qualquer texto)
  );
  
  return result.rows;
}

// ============================================================
// EXPORTAR TODAS AS FUNÇÕES
// ============================================================
module.exports = {
  listarTodos,
  buscarPorId,
  criar,
  atualizar,
  deletar,
  buscarPorCategoria
};
