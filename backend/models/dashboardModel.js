const pool = require("../db");

async function getDashboardSummary(userId, recentLimit = 5) {
    const customerStatsPromise = pool.query(
        `SELECT
            COUNT(*)::int AS total_customers,
            COUNT(*) FILTER (WHERE amount > 0)::int AS customers_with_debt,
            COALESCE(SUM(amount), 0)::numeric(12, 2) AS total_outstanding_debt
         FROM public.customers
         WHERE user_id = $1`,
        [userId]
    );

    const transactionStatsPromise = pool.query(
        `SELECT
            COUNT(*)::int AS total_transactions,
            COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0)::numeric(12, 2) AS total_credit,
            COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0)::numeric(12, 2) AS total_payments
         FROM public.transactions
         WHERE user_id = $1`,
        [userId]
    );

    const recentTransactionsPromise = pool.query(
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
         WHERE t.user_id = $1
         ORDER BY t.created_at DESC, t.id DESC
         LIMIT $2`,
        [userId, recentLimit]
    );

    const [customerStatsRes, txStatsRes, recentTxRes] = await Promise.all([
        customerStatsPromise,
        transactionStatsPromise,
        recentTransactionsPromise
    ]);

    const customerStats = customerStatsRes.rows[0];
    const txStats = txStatsRes.rows[0];

    return {
        total_customers: customerStats.total_customers,
        customers_with_debt: customerStats.customers_with_debt,
        total_outstanding_debt: customerStats.total_outstanding_debt,
        total_transactions: txStats.total_transactions,
        total_credit: txStats.total_credit,
        total_payments: txStats.total_payments,
        recent_transactions: recentTxRes.rows
    };
}

module.exports = {
    getDashboardSummary
};
