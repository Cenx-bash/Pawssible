
const path = require("path");

// ========================================
// ENVIRONMENT VARIABLES
// ========================================

// Load .env from the project root
require("dotenv").config({
    path: path.join(__dirname, "../../.env")
});

// ========================================
// IMPORTS
// ========================================

const mysql = require("mysql2/promise");

// ========================================
// DATABASE CONFIGURATION
// ========================================

const isProduction = process.env.NODE_ENV === "production";

const requiredVariables = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME"
];

if (!isProduction) {
    console.log("");
    console.log("========================================");
    console.log("        DATABASE CONFIGURATION");
    console.log("========================================");

    console.log("DB_HOST:", process.env.DB_HOST || "NOT SET");
    console.log("DB_PORT:", process.env.DB_PORT || "3306");
    console.log("DB_USER:", process.env.DB_USER || "NOT SET");
    console.log("DB_NAME:", process.env.DB_NAME || "NOT SET");

    console.log("DB_PASSWORD:",
        process.env.DB_PASSWORD ? "LOADED" : "NOT SET"
    );

    console.log("========================================");
    console.log("");
}

// ========================================
// ENVIRONMENT VALIDATION
// ========================================

const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
    throw new Error(
        `Missing required database environment variables: ${missingVariables.join(", ")}`
    );
}

// ========================================
// MYSQL CONNECTION POOL
// ========================================

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,

    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,

    connectionLimit: isProduction ? 5 : 10,

    queueLimit: 0,

    connectTimeout: 10000
});

// ========================================
// TEST CONNECTION
// ========================================

async function testConnection() {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log("MySQL connection successful");

        return true;

    } catch (error) {
        console.error("MySQL connection failed:");
        console.error(error.message);

        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// ========================================
// EXPORTS
// ========================================

module.exports = pool;
module.exports.testConnection = testConnection;