const express = require("express");
const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/me", authenticateToken, async (req, res) => {
    res.json({
        message: "Authentication successful",
        user: req.user
    });
});

module.exports = router;