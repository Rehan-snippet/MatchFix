const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "matchfix",
    password: "rajon1212",
    port: 5432,
});

module.exports = pool;