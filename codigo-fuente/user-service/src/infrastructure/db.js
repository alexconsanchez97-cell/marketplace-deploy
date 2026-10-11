require("dotenv").config(); // Lee el archivo .env y lo mete en process.env

const { Pool } = require("pg"); 

const pool = new Pool({
  user: process.env.DB_USER,       // viene del .env, ya no escrito a mano
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,       // 5432 por default en PostgreSQL
});

module.exports = pool;