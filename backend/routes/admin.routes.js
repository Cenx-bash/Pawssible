const express = require("express");
const router = express.Router();

// ========================================
// ADMIN ROUTES
// ========================================
// STUB FILE — this file was found empty, so these are
// placeholder endpoints just to keep the server running.
// Replace each handler below with real logic once you
// have an admin.controller.js with real functions.
// ========================================

router.get("/", (req, res) => {
    res.json({
        message: "Admin routes placeholder - GET /api/admin not implemented yet"
    });
});

router.get("/users", (req, res) => {
    res.status(501).json({
        message: "Admin: list users not implemented yet"
    });
});

router.get("/stats", (req, res) => {
    res.status(501).json({
        message: "Admin: dashboard stats not implemented yet"
    });
});

module.exports = router;