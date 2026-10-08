import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "../config/database.js";
import { UserModel } from "../models/userModel.js";

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  async findById(id: number): Promise<UserModel | null> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [id],
    );

    if (rows.length === 0) {
      return null;
    }

    return new UserModel(rows[0]);
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email],
    );

    if (rows.length === 0) {
      return null;
    }

    return new UserModel(rows[0]);
  }

  async create(
    name: string,
    email: string,
    password: string,
  ): Promise<UserModel> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, password],
    );

    const user = await this.findById(result.insertId);

    if (!user) {
      throw new Error("User was created but could not be retrieved.");
    }

    return user;
  }
}
