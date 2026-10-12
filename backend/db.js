const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5433,
    database: process.env.DB_NAME || "KarnyDb",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD
});

module.exports = pool;