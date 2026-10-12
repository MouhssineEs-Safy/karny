const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

const {
    createTransaction,
    getTransactions,
    getTransactionById
} = require("../controllers/transactionController");

router.use(authenticateToken);

router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.post("/", createTransaction);

module.exports = router;
