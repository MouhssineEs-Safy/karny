const pool = require("../db");

async function findUserByEmail(email) {
    const result = await pool.query(
        `SELECT id, name, email, password_hash, created_at
         FROM public.users
         WHERE LOWER(email) = LOWER($1)`,
        [email]
    );

    return result.rows[0] || null;
}

async function findUserById(id) {
    const result = await pool.query(
        `SELECT id, name, email, created_at
         FROM public.users
         WHERE id = $1`,
        [id]
    );

    return result.rows[0] || null;
}

async function createUser(name, email, passwordHash) {
    const result = await pool.query(
        `INSERT INTO public.users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [name, email, passwordHash]
    );

    return result.rows[0];
}

module.exports = {
    findUserByEmail,
    findUserById,
    createUser
};
