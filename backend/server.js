const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

// Root & health routes
app.get("/", (req, res) => {
    res.send("Welcome to Karny!");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "karny-backend"
    });
});

// API routes
app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/transactions", transactionRoutes);
app.use("/dashboard", dashboardRoutes);

// 404 and centralized error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Karny server is running on port ${PORT}`);
    });
}

module.exports = app;
