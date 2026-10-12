const { getDashboardSummary } = require("../models/dashboardModel");

async function getDashboard(req, res) {
    try {
        let recentLimit = 5;

        if (req.query.limit !== undefined) {
            const parsedLimit = Number(req.query.limit);
            if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 50) {
                return res.status(400).json({
                    message: "Invalid limit query parameter; must be an integer between 1 and 50.",
                    error: "Invalid limit query parameter; must be an integer between 1 and 50."
                });
            }
            recentLimit = parsedLimit;
        }

        const summary = await getDashboardSummary(req.user.id, recentLimit);

        return res.status(200).json(summary);
    } catch (error) {
        console.error("Error fetching dashboard summary:", error.message);

        return res.status(500).json({
            message: "Failed to fetch dashboard summary.",
            error: "Failed to fetch dashboard summary."
        });
    }
}

module.exports = {
    getDashboard
};
