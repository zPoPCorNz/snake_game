const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: '1494',
    host: 'localhost',
    port: 5432,
    database: 'snake_db'
});

module.exports = pool;