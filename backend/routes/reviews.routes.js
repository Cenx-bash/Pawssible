const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "Review routes placeholder - GET /api/reviews not implemented yet"
    });
});

router.post("/", (req, res) => {
    res.status(501).json({
        message: "Create review not implemented yet"
    });
});

router.get("/:id", (req, res) => {
    res.status(501).json({
        message: `Get review ${req.params.id} not implemented yet`
    });
});

router.put("/:id", (req, res) => {
    res.status(501).json({
        message: `Update review ${req.params.id} not implemented yet`
    });
});

router.delete("/:id", (req, res) => {
    res.status(501).json({
        message: `Delete review ${req.params.id} not implemented yet`
    });
});

module.exports = router;
