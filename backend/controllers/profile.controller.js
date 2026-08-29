const pool = require("../config/database");

// ========================================
// GET PROFILE
// ========================================

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [rows] = await pool.query(`
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,

                up.location,
                up.bio,
                up.avatar_url,

                pref.language,
                pref.timezone,
                pref.dark_mode,
                pref.compact_view

            FROM users u

            LEFT JOIN user_profiles up
                ON u.user_id = up.user_id

            LEFT JOIN user_preferences pref
                ON u.user_id = pref.user_id

            WHERE u.user_id = ?
        `, [userId]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            profile: rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load profile"
        });
    }
};

// ========================================
// UPDATE PROFILE
// ========================================

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            first_name,
            last_name,
            phone,
            location,
            bio,
            language,
            timezone,
            dark_mode,
            compact_view
        } = req.body;

        await pool.query(`
            UPDATE users
            SET
                first_name = ?,
                last_name = ?,
                phone = ?
            WHERE user_id = ?
        `, [
            first_name,
            last_name,
            phone,
            userId
        ]);

        await pool.query(`
            INSERT INTO user_profiles
                (user_id, location, bio)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                location = VALUES(location),
                bio = VALUES(bio)
        `, [
            userId,
            location,
            bio
        ]);

        await pool.query(`
            INSERT INTO user_preferences
                (
                    user_id,
                    language,
                    timezone,
                    dark_mode,
                    compact_view
                )
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                language = VALUES(language),
                timezone = VALUES(timezone),
                dark_mode = VALUES(dark_mode),
                compact_view = VALUES(compact_view)
        `, [
            userId,
            language,
            timezone,
            dark_mode,
            compact_view
        ]);

        res.json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};