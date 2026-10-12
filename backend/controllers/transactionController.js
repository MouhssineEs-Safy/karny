const {
    createTransaction: createTransactionModel,
    getTransactionsByCustomer,
    getAllTransactions,
    getTransactionById: getTransactionByIdModel
} = require("../models/transactionModel");

const VALID_TYPES = new Set(["credit", "payment"]);
const MAX_AMOUNT = 99999999.99;

function validatePositiveAmount(value) {
    if (value === undefined || value === null || value === "" || typeof value === "boolean") {
        return false;
    }

    const num = Number(value);

    if (!Number.isFinite(num) || num <= 0 || num > MAX_AMOUNT) {
        return false;
    }

    return Math.abs(Math.round(num * 100) - num * 100) < 1e-6;
}

function parseTransactionPayload(body, customerIdFromParams) {
    const payload = body || {};

    const rawCustomerId =
        customerIdFromParams !== undefined
            ? customerIdFromParams
            : payload.customer_id !== undefined
            ? payload.customer_id
            : payload.customerId;

    const customerId = Number(rawCustomerId);

    if (!Number.isInteger(customerId) || customerId <= 0) {
        return {
            valid: false,
            error: "Valid customer ID is required."
        };
    }

    const normalizedType =
        typeof payload.type === "string" ? payload.type.trim().toLowerCase() : "";

    if (!VALID_TYPES.has(normalizedType)) {
        return {
            valid: false,
            error: "Transaction type must be either 'credit' or 'payment'."
        };
    }

    if (!validatePositiveAmount(payload.amount)) {
        return {
            valid: false,
            error: "Transaction amount must be a positive number (up to 2 decimal places)."
        };
    }

    let note = null;
    if (payload.note !== undefined && payload.note !== null) {
        if (typeof payload.note !== "string") {
            return {
                valid: false,
                error: "Transaction note must be a string."
            };
        }

        const trimmedNote = payload.note.trim();
        if (trimmedNote.length > 500) {
            return {
                valid: false,
                error: "Transaction note must not exceed 500 characters."
            };
        }

        note = trimmedNote || null;
    }

    return {
        valid: true,
        customerId,
        type: normalizedType,
        amount: Math.round(Number(payload.amount) * 100) / 100,
        note
    };
}

async function createTransaction(req, res) {
    try {
        const customerIdParam = req.params.id !== undefined ? req.params.id : undefined;
        const parsed = parseTransactionPayload(req.body, customerIdParam);

        if (!parsed.valid) {
            return res.status(400).json({
                message: parsed.error,
                error: parsed.error
            });
        }

        const result = await createTransactionModel({
            customerId: parsed.customerId,
            userId: req.user.id,
            type: parsed.type,
            amount: parsed.amount,
            note: parsed.note
        });

        return res.status(201).json({
            message: "Transaction recorded successfully.",
            transaction: result.transaction,
            customer: result.customer
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
                error: error.message
            });
        }

        console.error("Error creating transaction:", error.message);

        return res.status(500).json({
            message: "Failed to record transaction.",
            error: "Failed to record transaction."
        });
    }
}

async function getTransactions(req, res) {
    try {
        const filters = {};

        if (req.query.customer_id !== undefined) {
            const customerId = Number(req.query.customer_id);
            if (!Number.isInteger(customerId) || customerId <= 0) {
                return res.status(400).json({
                    message: "Invalid customer_id query parameter.",
                    error: "Invalid customer_id query parameter."
                });
            }
            filters.customerId = customerId;
        }

        if (req.query.type !== undefined) {
            const normalizedType = String(req.query.type).trim().toLowerCase();
            if (!VALID_TYPES.has(normalizedType)) {
                return res.status(400).json({
                    message: "Invalid type query parameter; must be 'credit' or 'payment'.",
                    error: "Invalid type query parameter; must be 'credit' or 'payment'."
                });
            }
            filters.type = normalizedType;
        }

        if (req.query.limit !== undefined) {
            const limit = Number(req.query.limit);
            if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
                return res.status(400).json({
                    message: "Invalid limit query parameter; must be an integer between 1 and 200.",
                    error: "Invalid limit query parameter; must be an integer between 1 and 200."
                });
            }
            filters.limit = limit;
        }

        const transactions = await getAllTransactions(req.user.id, filters);

        return res.status(200).json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error.message);

        return res.status(500).json({
            message: "Failed to fetch transactions.",
            error: "Failed to fetch transactions."
        });
    }
}

async function getTransactionById(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid transaction ID.",
                error: "Invalid transaction ID."
            });
        }

        const transaction = await getTransactionByIdModel(id, req.user.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found.",
                error: "Transaction not found."
            });
        }

        return res.status(200).json(transaction);
    } catch (error) {
        console.error("Error fetching transaction:", error.message);

        return res.status(500).json({
            message: "Failed to fetch transaction.",
            error: "Failed to fetch transaction."
        });
    }
}

async function getCustomerTransactions(req, res) {
    try {
        const customerId = Number(req.params.id);

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.status(400).json({
                message: "Invalid customer ID.",
                error: "Invalid customer ID."
            });
        }

        const history = await getTransactionsByCustomer(customerId, req.user.id);

        if (!history) {
            return res.status(404).json({
                message: "Customer not found.",
                error: "Customer not found."
            });
        }

        return res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching customer transactions:", error.message);

        return res.status(500).json({
            message: "Failed to fetch customer transactions.",
            error: "Failed to fetch customer transactions."
        });
    }
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    getCustomerTransactions
};
