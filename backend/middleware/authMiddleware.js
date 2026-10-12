const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token is required.",
            error: "Authentication token is required."
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: "Authentication token is required.",
            error: "Authentication token is required."
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("Auth configuration error: JWT_SECRET is not set.");
        return res.status(500).json({
            message: "Authentication service is misconfigured.",
            error: "Authentication service is misconfigured."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = Number(decoded && decoded.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Invalid or expired token.",
                error: "Invalid or expired token."
            });
        }

        req.user = {
            id: userId,
            email: decoded.email
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token.",
            error: "Invalid or expired token."
        });
    }
}

module.exports = authenticateToken;
