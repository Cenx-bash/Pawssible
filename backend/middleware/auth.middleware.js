const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Access token is required"
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }

        const token = authHeader.substring(7);

        if (!token) {
            return res.status(401).json({
                message: "Access token is required"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        console.error("AUTH MIDDLEWARE ERROR:", error.message);

        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authenticateToken;