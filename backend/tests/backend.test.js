const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../server");
const pool = require("../db");
const runMigrations = require("../migrations/runMigrations");

let server;
let baseUrl;

const runId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
const merchantAEmail = `merchant_a_${runId}@karny.test`;
const merchantBEmail = `merchant_b_${runId}@karny.test`;
const testPassword = "TestPassword!234";

let merchantAToken = "";
let merchantAUser = null;
let merchantBToken = "";
let merchantBUser = null;

let customerA1Id = null;
let customerA2Id = null;
let customerB1Id = null;
let createdTransactionId = null;

let baselineUserCount = 0;
let baselineCustomerCount = 0;

async function request(method, path, { token, body, rawBody, headers = {} } = {}) {
    const reqHeaders = { ...headers };

    if (token) {
        reqHeaders.Authorization = `Bearer ${token}`;
    }

    let payload;
    if (rawBody !== undefined) {
        payload = rawBody;
        if (!reqHeaders["Content-Type"]) {
            reqHeaders["Content-Type"] = "application/json";
        }
    } else if (body !== undefined) {
        payload = JSON.stringify(body);
        reqHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: reqHeaders,
        body: payload
    });

    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (_) {
        data = text;
    }

    return {
        status: response.status,
        data
    };
}

describe("Karny Backend Comprehensive Verification Suite", () => {
    before(async () => {
        // 1. Apply idempotent schema migrations without closing pool
        await runMigrations({ closePool: false });

        // Clean any residual @karny.test test fixtures from prior interrupted runs
        await pool.query(
            `DELETE FROM public.customers
             WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@karny.test')`
        );
        await pool.query("DELETE FROM public.users WHERE email LIKE '%@karny.test'");

        // Record baseline counts of existing records to verify zero data loss after cleanup
        const usersCountRes = await pool.query("SELECT COUNT(*)::int AS count FROM public.users");
        const customersCountRes = await pool.query("SELECT COUNT(*)::int AS count FROM public.customers");
        baselineUserCount = usersCountRes.rows[0].count;
        baselineCustomerCount = customersCountRes.rows[0].count;

        // 2. Start Express server on an ephemeral port
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
    });

    after(async () => {
        // Clean up only the temporary test users created in this test run
        try {
            await pool.query(
                `DELETE FROM public.customers
                 WHERE user_id IN (SELECT id FROM public.users WHERE email = ANY($1::text[]))`,
                [[merchantAEmail, merchantBEmail]]
            );
            await pool.query(
                "DELETE FROM public.users WHERE email = ANY($1::text[])",
                [[merchantAEmail, merchantBEmail]]
            );

            // Verify pre-existing users and customers remain untouched
            const finalUsersCount = await pool.query("SELECT COUNT(*)::int AS count FROM public.users");
            const finalCustomersCount = await pool.query("SELECT COUNT(*)::int AS count FROM public.customers");
            assert.equal(finalUsersCount.rows[0].count, baselineUserCount);
            assert.equal(finalCustomersCount.rows[0].count, baselineCustomerCount);
        } finally {
            if (server) {
                await new Promise((resolve) => server.close(resolve));
            }
            await pool.end();
        }
    });

    it("1. Starts the application and serves root, health, and 404 routes", async () => {
        const rootRes = await request("GET", "/");
        assert.equal(rootRes.status, 200);
        assert.equal(rootRes.data, "Welcome to Karny!");

        const healthRes = await request("GET", "/health");
        assert.equal(healthRes.status, 200);
        assert.equal(healthRes.data.status, "ok");

        const notFoundRes = await request("GET", "/non-existent-endpoint");
        assert.equal(notFoundRes.status, 404);
        assert.ok(notFoundRes.data.message);
    });

    it("2. Connects to PostgreSQL database KarnyDb and verifies schema integrity", async () => {
        const dbRes = await pool.query("SELECT current_database(), current_user");
        assert.equal(dbRes.rows[0].current_database, "KarnyDb");

        const tablesRes = await pool.query(
            `SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public'
               AND table_name IN ('users', 'customers', 'transactions')
             ORDER BY table_name`
        );
        assert.deepEqual(
            tablesRes.rows.map((r) => r.table_name),
            ["customers", "transactions", "users"]
        );
    });

    it("3. Registers new merchants with valid data and hashes passwords with bcrypt", async () => {
        const regARes = await request("POST", "/auth/register", {
            body: {
                name: "Merchant A Shop",
                email: `  ${merchantAEmail.toUpperCase()}  `,
                password: testPassword
            }
        });

        assert.equal(regARes.status, 201);
        assert.equal(typeof regARes.data.token, "string");
        assert.ok(regARes.data.token.length > 20);
        assert.equal(regARes.data.user.name, "Merchant A Shop");
        assert.equal(regARes.data.user.email, merchantAEmail);
        assert.equal(regARes.data.user.password_hash, undefined);

        merchantAToken = regARes.data.token;
        merchantAUser = regARes.data.user;

        // Verify password hash in DB is a valid bcrypt hash, never plain text
        const dbUser = await pool.query(
            "SELECT password_hash FROM public.users WHERE id = $1",
            [merchantAUser.id]
        );
        assert.notEqual(dbUser.rows[0].password_hash, testPassword);
        assert.match(dbUser.rows[0].password_hash, /^\$2[aby]\$12\$/);

        // Register Merchant B for cross-merchant isolation tests
        const regBRes = await request("POST", "/auth/register", {
            body: {
                name: "Merchant B Shop",
                email: merchantBEmail,
                password: testPassword
            }
        });
        assert.equal(regBRes.status, 201);
        merchantBToken = regBRes.data.token;
        merchantBUser = regBRes.data.user;
    });

    it("4. Rejects duplicate registration (case-insensitive) and invalid registration inputs", async () => {
        const dupRes = await request("POST", "/auth/register", {
            body: {
                name: "Duplicate Merchant",
                email: merchantAEmail.toUpperCase(),
                password: testPassword
            }
        });
        assert.equal(dupRes.status, 409);

        const shortPassRes = await request("POST", "/auth/register", {
            body: {
                name: "Short Pass",
                email: `short_${runId}@karny.test`,
                password: "1234567"
            }
        });
        assert.equal(shortPassRes.status, 400);

        const badEmailRes = await request("POST", "/auth/register", {
            body: {
                name: "Bad Email",
                email: "not-an-email",
                password: testPassword
            }
        });
        assert.equal(badEmailRes.status, 400);
    });

    it("5. Logs in successfully with valid credentials and fetches /auth/me", async () => {
        const loginRes = await request("POST", "/auth/login", {
            body: {
                email: merchantAEmail,
                password: testPassword
            }
        });

        assert.equal(loginRes.status, 200);
        assert.equal(typeof loginRes.data.token, "string");
        assert.equal(loginRes.data.user.id, merchantAUser.id);
        assert.equal(loginRes.data.user.email, merchantAEmail);
        assert.equal(loginRes.data.user.password_hash, undefined);

        merchantAToken = loginRes.data.token;

        const meRes = await request("GET", "/auth/me", {
            token: merchantAToken
        });
        assert.equal(meRes.status, 200);
        assert.equal(meRes.data.user.id, merchantAUser.id);
        assert.equal(meRes.data.user.email, merchantAEmail);
    });

    it("6. Rejects login with invalid password, unknown email, or missing fields", async () => {
        const wrongPassRes = await request("POST", "/auth/login", {
            body: {
                email: merchantAEmail,
                password: "WrongPassword999"
            }
        });
        assert.equal(wrongPassRes.status, 401);

        const unknownEmailRes = await request("POST", "/auth/login", {
            body: {
                email: `nobody_${runId}@karny.test`,
                password: testPassword
            }
        });
        assert.equal(unknownEmailRes.status, 401);

        const missingFieldsRes = await request("POST", "/auth/login", {
            body: {
                email: merchantAEmail
            }
        });
        assert.equal(missingFieldsRes.status, 400);
    });

    it("7. Protected endpoints reject requests without a valid JWT", async () => {
        const protectedChecks = [
            { method: "GET", path: "/customers" },
            { method: "POST", path: "/customers", body: { name: "Test", phone: "0600000000", amount: 10 } },
            { method: "GET", path: "/transactions" },
            { method: "POST", path: "/transactions", body: { customer_id: 1, type: "credit", amount: 10 } },
            { method: "GET", path: "/dashboard" },
            { method: "GET", path: "/auth/me" }
        ];

        for (const check of protectedChecks) {
            const noTokenRes = await request(check.method, check.path, { body: check.body });
            assert.equal(noTokenRes.status, 401, `Expected 401 without token for ${check.method} ${check.path}`);

            const badTokenRes = await request(check.method, check.path, {
                token: "invalid.jwt.token",
                body: check.body
            });
            assert.equal(badTokenRes.status, 401, `Expected 401 with invalid token for ${check.method} ${check.path}`);
        }
    });

    it("8. Performs complete Customer CRUD for the authenticated merchant", async () => {
        // Create Customer 1 for Merchant A with initial debt of 150.50
        const createRes1 = await request("POST", "/customers", {
            token: merchantAToken,
            body: {
                name: "Hassan El Fassi",
                phone: "+212 6 11 22 33 44",
                amount: 150.5,
                user_id: 999999 // Attempt mass-assignment; server must ignore and use JWT user.id
            }
        });
        assert.equal(createRes1.status, 201);
        assert.equal(createRes1.data.name, "Hassan El Fassi");
        assert.equal(createRes1.data.amount, "150.50");
        assert.equal(createRes1.data.user_id, merchantAUser.id);
        customerA1Id = createRes1.data.id;

        // Create Customer 2 for Merchant A with default 0 balance
        const createRes2 = await request("POST", "/customers", {
            token: merchantAToken,
            body: {
                name: "Salma Berrada",
                phone: "0655443322"
            }
        });
        assert.equal(createRes2.status, 201);
        assert.equal(createRes2.data.amount, "0.00");
        assert.equal(createRes2.data.user_id, merchantAUser.id);
        customerA2Id = createRes2.data.id;

        // List Merchant A's customers
        const listRes = await request("GET", "/customers", {
            token: merchantAToken
        });
        assert.equal(listRes.status, 200);
        assert.equal(listRes.data.length, 2);

        // Retrieve individual customer by ID
        const getRes = await request("GET", `/customers/${customerA1Id}`, {
            token: merchantAToken
        });
        assert.equal(getRes.status, 200);
        assert.equal(getRes.data.id, customerA1Id);
        assert.equal(getRes.data.amount, "150.50");
        assert.equal(getRes.data.total_credit, "150.50");
        assert.equal(getRes.data.total_payments, "0.00");

        // Update Customer 1
        const updateRes = await request("PUT", `/customers/${customerA1Id}`, {
            token: merchantAToken,
            body: {
                name: "Hassan El Fassi (Updated)",
                phone: "+212 6 11 22 33 99",
                amount: 200.0
            }
        });
        assert.equal(updateRes.status, 200);
        assert.equal(updateRes.data.name, "Hassan El Fassi (Updated)");
        assert.equal(updateRes.data.amount, "200.00");
    });

    it("9. Enforces strict cross-merchant customer isolation (read, update, delete)", async () => {
        // Create a customer for Merchant B
        const createBRes = await request("POST", "/customers", {
            token: merchantBToken,
            body: {
                name: "Merchant B Customer",
                phone: "0677889900",
                amount: 75
            }
        });
        assert.equal(createBRes.status, 201);
        customerB1Id = createBRes.data.id;

        // Merchant B listing customers only sees Merchant B's customer
        const listBRes = await request("GET", "/customers", {
            token: merchantBToken
        });
        assert.equal(listBRes.status, 200);
        assert.equal(listBRes.data.length, 1);
        assert.equal(listBRes.data[0].id, customerB1Id);

        // Merchant B cannot GET Merchant A's customer
        const getCrossRes = await request("GET", `/customers/${customerA1Id}`, {
            token: merchantBToken
        });
        assert.equal(getCrossRes.status, 404);

        // Merchant B cannot UPDATE Merchant A's customer
        const updateCrossRes = await request("PUT", `/customers/${customerA1Id}`, {
            token: merchantBToken,
            body: {
                name: "Hacked Name",
                phone: "0600000000",
                amount: 0
            }
        });
        assert.equal(updateCrossRes.status, 404);

        // Merchant B cannot DELETE Merchant A's customer
        const deleteCrossRes = await request("DELETE", `/customers/${customerA1Id}`, {
            token: merchantBToken
        });
        assert.equal(deleteCrossRes.status, 404);
    });

    it("10. Prevents a merchant from creating or viewing transactions for another merchant's customer", async () => {
        const crossTxRes = await request("POST", "/transactions", {
            token: merchantBToken,
            body: {
                customer_id: customerA1Id,
                type: "payment",
                amount: 50,
                note: "Unauthorized cross-merchant transaction"
            }
        });
        assert.equal(crossTxRes.status, 404);

        const crossNestedTxRes = await request("POST", `/customers/${customerA1Id}/transactions`, {
            token: merchantBToken,
            body: {
                type: "credit",
                amount: 50
            }
        });
        assert.equal(crossNestedTxRes.status, 404);

        const crossHistoryRes = await request("GET", `/customers/${customerA1Id}/transactions`, {
            token: merchantBToken
        });
        assert.equal(crossHistoryRes.status, 404);
    });

    it("11 & 12. Records credit and payment transactions and calculates outstanding balances accurately", async () => {
        // Customer A1 currently has balance 200.00 (150.50 initial + 49.50 update adjustment)
        // Record a credit of 50.25 via POST /transactions
        const creditRes = await request("POST", "/transactions", {
            token: merchantAToken,
            body: {
                customer_id: customerA1Id,
                type: "credit",
                amount: 50.25,
                note: "Groceries on credit"
            }
        });
        assert.equal(creditRes.status, 201);
        assert.equal(creditRes.data.transaction.type, "credit");
        assert.equal(creditRes.data.transaction.amount, "50.25");
        assert.equal(creditRes.data.customer.amount, "250.25");
        createdTransactionId = creditRes.data.transaction.id;

        // Record a payment of 100.25 via POST /customers/:id/transactions
        const paymentRes = await request("POST", `/customers/${customerA1Id}/transactions`, {
            token: merchantAToken,
            body: {
                type: "payment",
                amount: 100.25,
                note: "Cash partial payment"
            }
        });
        assert.equal(paymentRes.status, 201);
        assert.equal(paymentRes.data.transaction.type, "payment");
        assert.equal(paymentRes.data.transaction.amount, "100.25");
        assert.equal(paymentRes.data.customer.amount, "150.00");

        // Retrieve individual transaction details
        const txDetailRes = await request("GET", `/transactions/${createdTransactionId}`, {
            token: merchantAToken
        });
        assert.equal(txDetailRes.status, 200);
        assert.equal(txDetailRes.data.id, createdTransactionId);
        assert.equal(txDetailRes.data.amount, "50.25");

        // Merchant B cannot view Merchant A's transaction by ID
        const crossTxDetailRes = await request("GET", `/transactions/${createdTransactionId}`, {
            token: merchantBToken
        });
        assert.equal(crossTxDetailRes.status, 404);

        // Retrieve customer transaction history and verify balance formula:
        // total_credit (150.50 + 49.50 + 50.25 = 250.25) - total_payments (100.25) = 150.00
        const historyRes = await request("GET", `/customers/${customerA1Id}/transactions`, {
            token: merchantAToken
        });
        assert.equal(historyRes.status, 200);
        assert.equal(historyRes.data.customer.amount, "150.00");
        assert.equal(historyRes.data.summary.total_credit, "250.25");
        assert.equal(historyRes.data.summary.total_payments, "100.25");
        assert.equal(historyRes.data.summary.outstanding_balance, "150.00");
        assert.equal(historyRes.data.transactions.length, 4);
    });

    it("13. Computes dashboard totals accurately and scopes them to the authenticated merchant", async () => {
        const dashARes = await request("GET", "/dashboard", {
            token: merchantAToken
        });
        assert.equal(dashARes.status, 200);
        assert.equal(dashARes.data.total_customers, 2);
        assert.equal(dashARes.data.customers_with_debt, 1);
        assert.equal(dashARes.data.total_outstanding_debt, "150.00");
        assert.equal(dashARes.data.total_credit, "250.25");
        assert.equal(dashARes.data.total_payments, "100.25");
        assert.equal(dashARes.data.total_transactions, 4);
        assert.ok(Array.isArray(dashARes.data.recent_transactions));
        assert.equal(dashARes.data.recent_transactions.length, 4);

        const dashBRes = await request("GET", "/dashboard", {
            token: merchantBToken
        });
        assert.equal(dashBRes.status, 200);
        assert.equal(dashBRes.data.total_customers, 1);
        assert.equal(dashBRes.data.customers_with_debt, 1);
        assert.equal(dashBRes.data.total_outstanding_debt, "75.00");
        assert.equal(dashBRes.data.total_credit, "75.00");
        assert.equal(dashBRes.data.total_payments, "0.00");
    });

    it("14. Validates invalid inputs, prevents overpayments/negative balances, and handles missing records", async () => {
        // Overpayment exceeding customer's outstanding balance (150.00) must be rejected with 400
        const overpaymentRes = await request("POST", `/customers/${customerA1Id}/transactions`, {
            token: merchantAToken,
            body: {
                type: "payment",
                amount: 150.01,
                note: "Overpayment attempt"
            }
        });
        assert.equal(overpaymentRes.status, 400);

        // Zero or negative transaction amount must be rejected
        const zeroTxRes = await request("POST", `/customers/${customerA1Id}/transactions`, {
            token: merchantAToken,
            body: {
                type: "credit",
                amount: 0
            }
        });
        assert.equal(zeroTxRes.status, 400);

        const negTxRes = await request("POST", `/customers/${customerA1Id}/transactions`, {
            token: merchantAToken,
            body: {
                type: "credit",
                amount: -10
            }
        });
        assert.equal(negTxRes.status, 400);

        // Invalid transaction type must be rejected
        const badTypeRes = await request("POST", `/customers/${customerA1Id}/transactions`, {
            token: merchantAToken,
            body: {
                type: "refund",
                amount: 10
            }
        });
        assert.equal(badTypeRes.status, 400);

        // Invalid customer ID format
        const badIdRes = await request("GET", "/customers/not-a-number", {
            token: merchantAToken
        });
        assert.equal(badIdRes.status, 400);

        // Negative customer amount on creation
        const negCustomerRes = await request("POST", "/customers", {
            token: merchantAToken,
            body: {
                name: "Negative Customer",
                phone: "0612345678",
                amount: -5
            }
        });
        assert.equal(negCustomerRes.status, 400);

        // Malformed JSON request body returns 400 without crashing or leaking stack trace
        const badJsonRes = await request("POST", "/customers", {
            token: merchantAToken,
            rawBody: "{ invalid json "
        });
        assert.equal(badJsonRes.status, 400);

        // Deleting Customer A2 succeeds and returns 200; deleting again returns 404
        const delRes = await request("DELETE", `/customers/${customerA2Id}`, {
            token: merchantAToken
        });
        assert.equal(delRes.status, 200);

        const delAgainRes = await request("DELETE", `/customers/${customerA2Id}`, {
            token: merchantAToken
        });
        assert.equal(delAgainRes.status, 404);
    });

    it("15. Enforces PostgreSQL database constraints directly at the SQL level", async () => {
        // Composite foreign key must reject inserting a transaction where user_id does not match customer's owner
        await assert.rejects(
            async () => {
                await pool.query(
                    `INSERT INTO public.transactions (customer_id, user_id, type, amount)
                     VALUES ($1, $2, 'credit', 10.00)`,
                    [customerA1Id, merchantBUser.id]
                );
            },
            (err) => err.code === "23503"
        );

        // CHECK constraint must reject negative customer amount at SQL level
        await assert.rejects(
            async () => {
                await pool.query(
                    `UPDATE public.customers SET amount = -1.00 WHERE id = $1`,
                    [customerA1Id]
                );
            },
            (err) => err.code === "23514"
        );

        // CHECK constraint must reject non-positive transaction amount at SQL level
        await assert.rejects(
            async () => {
                await pool.query(
                    `INSERT INTO public.transactions (customer_id, user_id, type, amount)
                     VALUES ($1, $2, 'credit', 0.00)`,
                    [customerA1Id, merchantAUser.id]
                );
            },
            (err) => err.code === "23514"
        );
    });
});
