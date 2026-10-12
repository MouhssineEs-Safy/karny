const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

const {
    register,
    login,
    getMe
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);

module.exports = router;
