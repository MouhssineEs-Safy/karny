const pool = require("../db");

async function getAllCustomers(userId) {
    const result = await pool.query(
        `SELECT
            c.id,
            c.name,
            c.phone,
            c.amount,
            c.user_id,
            COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0)::numeric(10, 2) AS total_credit,
            COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0)::numeric(10, 2) AS total_payments
         FROM public.customers c
         LEFT JOIN public.transactions t
           ON t.customer_id = c.id AND t.user_id = c.user_id
         WHERE c.user_id = $1
         GROUP BY c.id, c.name, c.phone, c.amount, c.user_id
         ORDER BY c.id`,
        [userId]
    );

    return result.rows;
}

async function getCustomerById(id, userId) {
    const result = await pool.query(
        `SELECT
            c.id,
            c.name,
            c.phone,
            c.amount,
            c.user_id,
            COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0)::numeric(10, 2) AS total_credit,
            COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0)::numeric(10, 2) AS total_payments
         FROM public.customers c
         LEFT JOIN public.transactions t
           ON t.customer_id = c.id AND t.user_id = c.user_id
         WHERE c.id = $1 AND c.user_id = $2
         GROUP BY c.id, c.name, c.phone, c.amount, c.user_id`,
        [id, userId]
    );

    return result.rows[0] || null;
}

async function createCustomer(name, phone, amount, userId) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const normalizedAmount = (Math.round(Number(amount) * 100) / 100).toFixed(2);

        const customerResult = await client.query(
            `INSERT INTO public.customers
                (name, phone, amount, user_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, phone, amount, user_id`,
            [name, phone, normalizedAmount, userId]
        );

        const customer = customerResult.rows[0];

        if (Number(normalizedAmount) > 0) {
            await client.query(
                `INSERT INTO public.transactions
                    (customer_id, user_id, type, amount, note)
                 VALUES ($1, $2, 'credit', $3, $4)`,
                [customer.id, userId, normalizedAmount, "Initial balance"]
            );
        }

        await client.query("COMMIT");

        return customer;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function updateCustomer(id, name, phone, amount, userId) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const existingResult = await client.query(
            `SELECT id, name, phone, amount, user_id
             FROM public.customers
             WHERE id = $1 AND user_id = $2
             FOR UPDATE`,
            [id, userId]
        );

        const existingCustomer = existingResult.rows[0];

        if (!existingCustomer) {
            await client.query("ROLLBACK");
            return null;
        }

        const currentCents = Math.round(Number(existingCustomer.amount) * 100);
        const targetCents =
            amount === undefined
                ? currentCents
                : Math.round(Number(amount) * 100);

        const nextAmount = (targetCents / 100).toFixed(2);
        const diffCents = targetCents - currentCents;

        const updateResult = await client.query(
            `UPDATE public.customers
             SET name = $1, phone = $2, amount = $3
             WHERE id = $4 AND user_id = $5
             RETURNING id, name, phone, amount, user_id`,
            [name, phone, nextAmount, id, userId]
        );

        if (diffCents > 0) {
            await client.query(
                `INSERT INTO public.transactions
                    (customer_id, user_id, type, amount, note)
                 VALUES ($1, $2, 'credit', $3, $4)`,
                [
                    id,
                    userId,
                    (diffCents / 100).toFixed(2),
                    "Balance adjustment via customer update"
                ]
            );
        } else if (diffCents < 0) {
            await client.query(
                `INSERT INTO public.transactions
                    (customer_id, user_id, type, amount, note)
                 VALUES ($1, $2, 'payment', $3, $4)`,
                [
                    id,
                    userId,
                    (Math.abs(diffCents) / 100).toFixed(2),
                    "Balance adjustment via customer update"
                ]
            );
        }

        await client.query("COMMIT");

        return updateResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function deleteCustomer(id, userId) {
    const result = await pool.query(
        `DELETE FROM public.customers
         WHERE id = $1 AND user_id = $2
         RETURNING id, name, phone, amount, user_id`,
        [id, userId]
    );

    return result.rows[0] || null;
}

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
