const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "petcareconnect",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    connectTimeout: 10000
});

// ========================================
// TEST CONNECTION
// ========================================

async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log(
            "MySQL connection successful"
        );

        connection.release();

    } catch (error) {
        console.error(
            "MySQL connection failed:"
        );

        console.error(
            error.message
        );

        throw error;
    }
}

testConnection();

module.exports = pool;