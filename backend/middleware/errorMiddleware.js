function notFoundHandler(req, res) {
    return res.status(404).json({
        message: `Route ${req.method} ${req.originalUrl} not found.`,
        error: `Route ${req.method} ${req.originalUrl} not found.`
    });
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err && (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400))) {
        return res.status(400).json({
            message: "Invalid JSON payload in request body.",
            error: "Invalid JSON payload in request body."
        });
    }

    console.error("Unhandled error:", err ? err.message : "Unknown error");

    return res.status(500).json({
        message: "Internal server error.",
        error: "Internal server error."
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
};
