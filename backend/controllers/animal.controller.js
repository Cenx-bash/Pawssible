const pool = require("../config/database");

// GET /api/pets
// Only returns pets belonging to the logged-in user
const getPets = async (req, res) => {
    try {
        const ownerId = req.user.user_id;

        const [rows] = await pool.query(
            `SELECT
                pet_id,
                owner_id,
                pet_name,
                species,
                breed,
                sex,
                birth_date,
                weight,
                allergies,
                behavioral_notes,
                created_at
             FROM pets
             WHERE owner_id = ?
             ORDER BY pet_id DESC`,
            [ownerId]
        );

        res.json(rows);

    } catch (error) {
        console.error("GET PETS ERROR:", error);

        res.status(500).json({
            message: "Failed to retrieve pets"
        });
    }
};


// GET /api/pets/:id
// Only allows the logged-in user to access their own pet
const getPetById = async (req, res) => {
    try {
        const ownerId = req.user.user_id;
        const petId = req.params.id;

        const [rows] = await pool.query(
            `SELECT
                pet_id,
                owner_id,
                pet_name,
                species,
                breed,
                sex,
                birth_date,
                weight,
                allergies,
                behavioral_notes,
                created_at
             FROM pets
             WHERE pet_id = ?
             AND owner_id = ?`,
            [petId, ownerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Pet not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error("GET PET ERROR:", error);

        res.status(500).json({
            message: "Failed to retrieve pet"
        });
    }
};


// POST /api/pets
// owner_id comes from the JWT, NOT from the request body
const createPet = async (req, res) => {
    try {
        const ownerId = req.user.user_id;

        const {
            pet_name,
            species,
            breed,
            sex,
            birth_date,
            weight,
            allergies,
            behavioral_notes
        } = req.body;

        // Required fields
        if (!pet_name || !species) {
            return res.status(400).json({
                message: "pet_name and species are required"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO pets
            (
                owner_id,
                pet_name,
                species,
                breed,
                sex,
                birth_date,
                weight,
                allergies,
                behavioral_notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ownerId,
                pet_name,
                species,
                breed || null,
                sex || null,
                birth_date || null,
                weight || null,
                allergies || null,
                behavioral_notes || null
            ]
        );

        res.status(201).json({
            message: "Pet created successfully",
            pet_id: result.insertId
        });

    } catch (error) {
        console.error("CREATE PET ERROR:", error);

        res.status(500).json({
            message: "Failed to create pet"
        });
    }
};


module.exports = {
    getPets,
    getPetById,
    createPet
};