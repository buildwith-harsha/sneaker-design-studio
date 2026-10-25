import pool from "../config/database.js";
import { UserModel, type UserModelData } from "../models/userModel.js";

export class UserRepository {
  async findById(id: number): Promise<UserModel | null> {
    const result = await pool.query<UserModelData>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new UserModel(result.rows[0]);
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const result = await pool.query<UserModelData>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new UserModel(result.rows[0]);
  }

  async create(
    name: string,
    email: string,
    password: string,
  ): Promise<UserModel> {
    const result = await pool.query<UserModelData>(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, password],
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error("User was created but could not be retrieved.");
    }

    return new UserModel(user);
  }
}
