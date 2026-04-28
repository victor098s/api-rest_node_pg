require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, 
  port: parseInt(process.env.DB_PORT), 
});


pool.connect((erro, client, release) => {
  if (erro) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', erro.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL!');
    release();
  }
});


module.exports = pool;
