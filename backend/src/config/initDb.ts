import pool from "./database.js";

export async function initDatabase(): Promise<void> {
  try {
    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 2. Designs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS designs (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(10) UNSIGNED NOT NULL,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(50) NOT NULL,
        components LONGTEXT NOT NULL CHECK (json_valid(components)),
        materials LONGTEXT NOT NULL CHECK (json_valid(materials)),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY fk_designs_user (user_id),
        CONSTRAINT fk_designs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 3. Design Versions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS design_versions (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        design_id INT NOT NULL,
        version_number INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(50) NOT NULL,
        components LONGTEXT NOT NULL CHECK (json_valid(components)),
        materials LONGTEXT NOT NULL CHECK (json_valid(materials)),
        change_summary VARCHAR(255) DEFAULT 'Design update',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY fk_design_versions_design (design_id),
        CONSTRAINT fk_design_versions_design FOREIGN KEY (design_id) REFERENCES designs (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    console.log("Database tables verified successfully.");
  } catch (err) {
    console.error("Database initialization notice:", err);
  }
}
