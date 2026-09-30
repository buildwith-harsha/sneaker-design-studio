import type { ResultSetHeader, RowDataPacket } from "mysql2";

import pool from "../config/database.js";

import { DesignModel } from "../models/designModel.js";

import type { Design, CreateDesign, UpdateDesign } from "../types/design.js";

interface DesignRow extends RowDataPacket {
  id: number;
  name: string;
  model: string;
  components: Design["components"];
  materials: Design["materials"];
  created_at: string;
  updated_at: string;
}

export class DesignRepository {
  async findAll(): Promise<DesignModel[]> {
    const [rows] = await pool.query<DesignRow[]>(
      "SELECT * FROM designs ORDER BY created_at DESC",
    );

    return rows.map((row) => new DesignModel(row));
  }

  async findById(id: number): Promise<DesignModel> {
    const [rows] = await pool.query<DesignRow[]>(
      "SELECT * FROM designs WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      throw new Error("Design not found");
    }

    return new DesignModel(rows[0]);
  }

  async create(design: CreateDesign): Promise<DesignModel> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO designs
                (name, model, components, materials)
                VALUES (?, ?, ?, ?)`,
      [
        design.name,
        design.model,
        JSON.stringify(design.components),
        JSON.stringify(design.materials),
      ],
    );

    return this.findById(result.insertId);
  }

  async update(id: number, design: UpdateDesign): Promise<DesignModel> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE designs
                 SET name = ?,
                     model = ?,
                     components = ?,
                     materials = ?
                 WHERE id = ?`,
      [
        design.name,
        design.model,
        JSON.stringify(design.components),
        JSON.stringify(design.materials),
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw new Error("Design not found");
    }

    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM designs WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      throw new Error("Design not found");
    }
  }
}
