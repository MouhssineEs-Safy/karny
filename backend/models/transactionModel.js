const pool = require("../db");

const MAX_BALANCE_CENTS = 9999999999; // 99,999,999.99 (NUMERIC(10, 2))

/**
 * Records a credit or payment transaction for a merchant's customer
 * and atomically updates the customer's outstanding balance.
 *
 * Accounting Rule:
 *   Outstanding balance = total credit - total payments
 */
async function createTransaction({ customerId, userId, type, amount, note }) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Lock customer row and verify ownership by the authenticated merchant
        const customerResult = await client.query(
            `SELECT id, name, phone, amount, user_id
             FROM public.customers
             WHERE id = $1 AND user_id = $2
             FOR UPDATE`,
            [customerId, userId]
        );

        const customer = customerResult.rows[0];

        if (!customer) {
            await client.query("ROLLBACK");
            const notFoundError = new Error("Customer not found.");
            notFoundError.statusCode = 404;
            throw notFoundError;
        }

        const currentBalanceCents = Math.round(Number(customer.amount) * 100);
        const txAmountCents = Math.round(Number(amount) * 100);

        if (type === "payment" && txAmountCents > currentBalanceCents) {
            await client.query("ROLLBACK");
            const overpaymentError = new Error(
                "Payment amount cannot exceed the customer's outstanding balance."
            );
            overpaymentError.statusCode = 400;
            throw overpaymentError;
        }

        const newBalanceCents =
            type === "credit"
                ? currentBalanceCents + txAmountCents
                : currentBalanceCents - txAmountCents;

        if (newBalanceCents > MAX_BALANCE_CENTS) {
            await client.query("ROLLBACK");
            const overflowError = new Error(
                "Resulting customer balance exceeds maximum allowed limit."
            );
            overflowError.statusCode = 400;
            throw overflowError;
        }

        const normalizedTxAmount = (txAmountCents / 100).toFixed(2);
        const normalizedNewBalance = (newBalanceCents / 100).toFixed(2);

        const txResult = await client.query(
            `INSERT INTO public.transactions
                (customer_id, user_id, type, amount, note)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, customer_id, user_id, type, amount, note, created_at`,
            [customerId, userId, type, normalizedTxAmount, note || null]
        );

        const updatedCustomerResult = await client.query(
            `UPDATE public.customers
             SET amount = $1
             WHERE id = $2 AND user_id = $3
             RETURNING id, name, phone, amount, user_id`,
            [normalizedNewBalance, customerId, userId]
        );

        await client.query("COMMIT");

        return {
            transaction: txResult.rows[0],
            customer: updatedCustomerResult.rows[0]
        };
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (_) {
            // Ignore rollback errors if already rolled back
        }
        throw error;
    } finally {
        client.release();
    }
}

async function getTransactionsByCustomer(customerId, userId) {
    const customerResult = await pool.query(
        `SELECT id, name, phone, amount, user_id
         FROM public.customers
         WHERE id = $1 AND user_id = $2`,
        [customerId, userId]
    );

    const customer = customerResult.rows[0];

    if (!customer) {
        return null;
    }

    const txResult = await pool.query(
        `SELECT id, customer_id, user_id, type, amount, note, created_at
         FROM public.transactions
         WHERE customer_id = $1 AND user_id = $2
         ORDER BY created_at DESC, id DESC`,
        [customerId, userId]
    );

    const summaryResult = await pool.query(
        `SELECT
            COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0)::numeric(10, 2) AS total_credit,
            COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0)::numeric(10, 2) AS total_payments,
            (
                COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0)
            )::numeric(10, 2) AS outstanding_balance,
            COUNT(*)::int AS transaction_count
         FROM public.transactions
         WHERE customer_id = $1 AND user_id = $2`,
        [customerId, userId]
    );

    return {
        customer,
        summary: summaryResult.rows[0],
        transactions: txResult.rows
    };
}

async function getAllTransactions(userId, { customerId, type, limit } = {}) {
    const params = [userId];
    const conditions = ["t.user_id = $1"];

    if (customerId !== undefined) {
        params.push(customerId);
        conditions.push(`t.customer_id = $${params.length}`);
    }

    if (type !== undefined) {
        params.push(type);
        conditions.push(`t.type = $${params.length}`);
    }

    let limitClause = "";
    if (limit !== undefined) {
        params.push(limit);
        limitClause = `LIMIT $${params.length}`;
    }

    const result = await pool.query(
        `SELECT
            t.id,
            t.customer_id,
            c.name AS customer_name,
            c.phone AS customer_phone,
            t.user_id,
            t.type,
            t.amount,
            t.note,
            t.created_at
         FROM public.transactions t
         JOIN public.customers c
           ON c.id = t.customer_id AND c.user_id = t.user_id
         WHERE ${conditions.join(" AND ")}
         ORDER BY t.created_at DESC, t.id DESC
         ${limitClause}`,
        params
    );

    return result.rows;
}

async function getTransactionById(transactionId, userId) {
    const result = await pool.query(
        `SELECT
            t.id,
            t.customer_id,
            c.name AS customer_name,
            c.phone AS customer_phone,
            t.user_id,
            t.type,
            t.amount,
            t.note,
            t.created_at
         FROM public.transactions t
         JOIN public.customers c
           ON c.id = t.customer_id AND c.user_id = t.user_id
         WHERE t.id = $1 AND t.user_id = $2`,
        [transactionId, userId]
    );

    return result.rows[0] || null;
}

module.exports = {
    createTransaction,
    getTransactionsByCustomer,
    getAllTransactions,
    getTransactionById
};
