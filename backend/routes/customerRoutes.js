const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

const {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require("../controllers/customerController");

const {
    getCustomerTransactions,
    createTransaction
} = require("../controllers/transactionController");

router.use(authenticateToken);

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

// Nested customer transaction routes
router.get("/:id/transactions", getCustomerTransactions);
router.post("/:id/transactions", createTransaction);

module.exports = router;