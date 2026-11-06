const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "Shelter routes placeholder - GET /api/shelters not implemented yet"
    });
});

router.post("/", (req, res) => {
    res.status(501).json({
        message: "Create shelter not implemented yet"
    });
});

router.get("/:id", (req, res) => {
    res.status(501).json({
        message: `Get shelter ${req.params.id} not implemented yet`
    });
});

router.put("/:id", (req, res) => {
    res.status(501).json({
        message: `Update shelter ${req.params.id} not implemented yet`
    });
});

router.delete("/:id", (req, res) => {
    res.status(501).json({
        message: `Delete shelter ${req.params.id} not implemented yet`
    });
});

module.exports = router;
