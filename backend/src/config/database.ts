import mysql from "mysql2/promise";

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // Ignore error if .env file is not present
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME || "sneaker_design_studio",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
