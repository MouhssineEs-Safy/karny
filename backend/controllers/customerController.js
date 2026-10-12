const {
    getAllCustomers,
    getCustomerById: getCustomerByIdModel,
    createCustomer: createCustomerModel,
    updateCustomer: updateCustomerModel,
    deleteCustomer: deleteCustomerModel
} = require("../models/customerModel");

const PHONE_REGEX = /^[0-9+\-\s()]{3,20}$/;
const MAX_AMOUNT = 99999999.99;

function isValidCurrencyAmount(value) {
    if (value === null || value === "" || typeof value === "boolean") {
        return false;
    }

    const num = Number(value);

    if (!Number.isFinite(num) || num < 0 || num > MAX_AMOUNT) {
        return false;
    }

    // Ensure at most 2 decimal places
    return Math.abs(Math.round(num * 100) - num * 100) < 1e-6;
}

function validateCustomerInput(body, { allowUndefinedAmount = false } = {}) {
    const { name, phone, amount } = body || {};

    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
        return {
            valid: false,
            error: "Valid customer name (1-100 characters) is required."
        };
    }

    if (
        typeof phone !== "string" ||
        !phone.trim() ||
        phone.trim().length > 20 ||
        !PHONE_REGEX.test(phone.trim())
    ) {
        return {
            valid: false,
            error: "Valid phone number (3-20 characters) is required."
        };
    }

    if (amount === undefined && allowUndefinedAmount) {
        return {
            valid: true,
            name: name.trim(),
            phone: phone.trim(),
            amount: undefined
        };
    }

    if (!isValidCurrencyAmount(amount)) {
        return {
            valid: false,
            error: "Valid name, phone and non-negative amount (up to 2 decimal places) are required."
        };
    }

    return {
        valid: true,
        name: name.trim(),
        phone: phone.trim(),
        amount: Math.round(Number(amount) * 100) / 100
    };
}

async function getCustomers(req, res) {
    try {
        const customers = await getAllCustomers(req.user.id);

        return res.status(200).json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error.message);

        return res.status(500).json({
            message: "Failed to fetch customers.",
            error: "Failed to fetch customers."
        });
    }
}

async function getCustomerById(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid customer ID.",
                error: "Invalid customer ID."
            });
        }

        const customer = await getCustomerByIdModel(id, req.user.id);

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found.",
                error: "Customer not found."
            });
        }

        return res.status(200).json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error.message);

        return res.status(500).json({
            message: "Failed to fetch customer.",
            error: "Failed to fetch customer."
        });
    }
}

async function createCustomer(req, res) {
    try {
        const validation = validateCustomerInput(req.body, {
            allowUndefinedAmount: true
        });

        if (!validation.valid) {
            return res.status(400).json({
                message: validation.error,
                error: validation.error
            });
        }

        const initialAmount = validation.amount === undefined ? 0 : validation.amount;

        const customer = await createCustomerModel(
            validation.name,
            validation.phone,
            initialAmount,
            req.user.id
        );

        return res.status(201).json(customer);
    } catch (error) {
        console.error("Error creating customer:", error.message);

        return res.status(500).json({
            message: "Failed to create customer.",
            error: "Failed to create customer."
        });
    }
}

async function updateCustomer(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid customer ID.",
                error: "Invalid customer ID."
            });
        }

        const validation = validateCustomerInput(req.body, {
            allowUndefinedAmount: true
        });

        if (!validation.valid) {
            return res.status(400).json({
                message: validation.error,
                error: validation.error
            });
        }

        const customer = await updateCustomerModel(
            id,
            validation.name,
            validation.phone,
            validation.amount,
            req.user.id
        );

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found.",
                error: "Customer not found."
            });
        }

        return res.status(200).json(customer);
    } catch (error) {
        console.error("Error updating customer:", error.message);

        return res.status(500).json({
            message: "Failed to update customer.",
            error: "Failed to update customer."
        });
    }
}

async function deleteCustomer(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid customer ID.",
                error: "Invalid customer ID."
            });
        }

        const customer = await deleteCustomerModel(id, req.user.id);

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found.",
                error: "Customer not found."
            });
        }

        return res.status(200).json({
            message: "Customer deleted successfully.",
            customer
        });
    } catch (error) {
        console.error("Error deleting customer:", error.message);

        return res.status(500).json({
            message: "Failed to delete customer.",
            error: "Failed to delete customer."
        });
    }
}

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};