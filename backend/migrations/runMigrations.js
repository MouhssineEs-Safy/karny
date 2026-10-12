const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function runMigrations({ closePool = true } = {}) {
    const migrationFile = path.join(__dirname, "001_complete_schema.sql");
    const sql = fs.readFileSync(migrationFile, "utf8");

    try {
        await pool.query(sql);
        console.log("Database migration (001_complete_schema.sql) applied successfully.");
    } catch (error) {
        console.error("Database migration failed:", error.message);
        throw error;
    } finally {
        if (closePool) {
            await pool.end();
        }
    }
}

if (require.main === module) {
    runMigrations().catch(() => {
        process.exit(1);
    });
}

module.exports = runMigrations;
