const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    findUserByEmail,
    findUserById,
    createUser
} = require("../models/authModel");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
}

async function register(req, res) {
    try {
        const { name, email, password } = req.body || {};

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ) {
            return res.status(400).json({
                message: "Name and email are required; password must be at least 8 characters.",
                error: "Name and email are required; password must be at least 8 characters."
            });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (trimmedName.length > 100) {
            return res.status(400).json({
                message: "Name must not exceed 100 characters.",
                error: "Name must not exceed 100 characters."
            });
        }

        if (normalizedEmail.length > 255 || !EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address.",
                error: "Please provide a valid email address."
            });
        }

        if (password.length > 72) {
            return res.status(400).json({
                message: "Password must not exceed 72 characters.",
                error: "Password must not exceed 72 characters."
            });
        }

        const existingUser = await findUserByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists.",
                error: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await createUser(
            trimmedName,
            normalizedEmail,
            passwordHash
        );

        const token = createToken(user);

        return res.status(201).json({
            message: "Account created successfully.",
            token,
            user
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "An account with this email already exists.",
                error: "An account with this email already exists."
            });
        }

        console.error("Register error:", error.message);

        return res.status(500).json({
            message: "Could not create account.",
            error: "Could not create account."
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required.",
                error: "Email and password are required."
            });
        }

        if (password.length > 72) {
            return res.status(401).json({
                message: "Invalid email or password.",
                error: "Invalid email or password."
            });
        }

        const user = await findUserByEmail(email.trim().toLowerCase());

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password.",
                error: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password.",
                error: "Invalid email or password."
            });
        }

        const token = createToken(user);

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Could not log in.",
            error: "Could not log in."
        });
    }
}

async function getMe(req, res) {
    try {
        const user = await findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                error: "User not found."
            });
        }

        return res.status(200).json({
            user
        });
    } catch (error) {
        console.error("Get profile error:", error.message);

        return res.status(500).json({
            message: "Could not fetch user profile.",
            error: "Could not fetch user profile."
        });
    }
}

module.exports = {
    register,
    login,
    getMe
};
