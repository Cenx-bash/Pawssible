const express = require("express");

const {
    getPets,
    getPetById,
    createPet
} = require("../controllers/pet.controller");

const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authenticateToken, getPets);
router.get("/:id", authenticateToken, getPetById);
router.post("/", authenticateToken, createPet);

module.exports = router;
