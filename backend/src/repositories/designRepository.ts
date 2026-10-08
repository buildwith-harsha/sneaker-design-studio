import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "../config/database.js";
import { DesignModel, DesignVersionModel } from "../models/designModel.js";
import type {
  DesignComponents,
  DesignMaterials,
  DesignQueryOptions,
  PaginationMeta,
} from "../types/design.js";

interface DesignRow extends RowDataPacket {
  id: number;
  user_id: number;
  name: string;
  model: string;
  components: string | DesignComponents;
  materials: string | DesignMaterials;
  created_at: string;
  updated_at: string;
}

interface DesignVersionRow extends RowDataPacket {
  id: number;
  design_id: number;
  version_number: number;
  name: string;
  model: string;
  components: string | DesignComponents;
  materials: string | DesignMaterials;
  change_summary: string;
  created_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface MaxVersionRow extends RowDataPacket {
  maxVersion: number | null;
}

export class DesignRepository {
  async findPaginated(
    userId: number,
    options: DesignQueryOptions = {},
  ): Promise<{ designs: DesignModel[]; pagination: PaginationMeta }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 8));
    const offset = (page - 1) * limit;

    let whereClause = "WHERE user_id = ?";
    const whereParams: (string | number)[] = [userId];

    if (options.search && options.search.trim()) {
      whereClause += " AND name LIKE ?";
      whereParams.push(`%${options.search.trim()}%`);
    }

    if (options.model && options.model.trim()) {
      whereClause += " AND model = ?";
      whereParams.push(options.model.trim());
    }

    // 1. Get total count
    const [countRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) as total FROM designs ${whereClause}`,
      whereParams,
    );
    const total = countRows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // 2. Sort order
    let orderBy = "ORDER BY created_at DESC";
    if (options.sort === "oldest") {
      orderBy = "ORDER BY created_at ASC";
    } else if (options.sort === "name_asc") {
      orderBy = "ORDER BY name ASC";
    } else if (options.sort === "name_desc") {
      orderBy = "ORDER BY name DESC";
    } else if (options.sort === "updated") {
      orderBy = "ORDER BY updated_at DESC";
    }

    // 3. Fetch paginated records
    const [rows] = await pool.query<DesignRow[]>(
      `
      SELECT *
      FROM designs
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [...whereParams, limit, offset],
    );

    const designs = rows.map((row) => new DesignModel(row));

    return {
      designs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id: number, userId: number): Promise<DesignModel | null> {
    const [rows] = await pool.query<DesignRow[]>(
      `
      SELECT *
      FROM designs
      WHERE id = ?
      AND user_id = ?
      LIMIT 1
      `,
      [id, userId],
    );

    if (rows.length === 0) {
      return null;
    }

    return new DesignModel(rows[0]);
  }

  async create(
    userId: number,
    name: string,
    model: string,
    components: DesignComponents,
    materials: DesignMaterials,
  ): Promise<DesignModel> {
    const [result] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO designs
        (
          user_id,
          name,
          model,
          components,
          materials
        )
      VALUES
        (?, ?, ?, ?, ?)
      `,
      [
        userId,
        name,
        model,
        JSON.stringify(components),
        JSON.stringify(materials),
      ],
    );

    const newDesignId = result.insertId;

    // Snapshot version 1
    await pool.execute(
      `
      INSERT INTO design_versions
        (design_id, version_number, name, model, components, materials, change_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        newDesignId,
        1,
        name,
        model,
        JSON.stringify(components),
        JSON.stringify(materials),
        "Initial creation",
      ],
    );

    const design = await this.findById(newDesignId, userId);

    if (!design) {
      throw new Error("Design was created but could not be retrieved.");
    }

    return design;
  }

  async update(
    id: number,
    userId: number,
    name: string,
    model: string,
    components: DesignComponents,
    materials: DesignMaterials,
    changeSummary?: string,
  ): Promise<DesignModel | null> {
    await pool.execute(
      `
      UPDATE designs
      SET
        name = ?,
        model = ?,
        components = ?,
        materials = ?
      WHERE id = ?
      AND user_id = ?
      `,
      [
        name,
        model,
        JSON.stringify(components),
        JSON.stringify(materials),
        id,
        userId,
      ],
    );

    // Get current max version number for this design
    const [maxRows] = await pool.query<MaxVersionRow[]>(
      `SELECT MAX(version_number) as maxVersion FROM design_versions WHERE design_id = ?`,
      [id],
    );
    const nextVersion = (maxRows[0]?.maxVersion || 0) + 1;

    // Snapshot new version
    await pool.execute(
      `
      INSERT INTO design_versions
        (design_id, version_number, name, model, components, materials, change_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        nextVersion,
        name,
        model,
        JSON.stringify(components),
        JSON.stringify(materials),
        changeSummary || `Version ${nextVersion} update`,
      ],
    );

    return this.findById(id, userId);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `
      DELETE FROM designs
      WHERE id = ?
      AND user_id = ?
      `,
      [id, userId],
    );

    return result.affectedRows > 0;
  }

  async getVersions(
    designId: number,
    userId: number,
  ): Promise<DesignVersionModel[]> {
    // Ensure user owns this design
    const design = await this.findById(designId, userId);
    if (!design) {
      throw new Error("Design not found or access denied.");
    }

    const [rows] = await pool.query<DesignVersionRow[]>(
      `
      SELECT *
      FROM design_versions
      WHERE design_id = ?
      ORDER BY version_number DESC
      `,
      [designId],
    );

    return rows.map((row) => new DesignVersionModel(row));
  }

  async restoreVersion(
    designId: number,
    versionNumber: number,
    userId: number,
  ): Promise<DesignModel> {
    // Verify design belongs to user
    const design = await this.findById(designId, userId);
    if (!design) {
      throw new Error("Design not found or access denied.");
    }

    // Find version
    const [vRows] = await pool.query<DesignVersionRow[]>(
      `
      SELECT *
      FROM design_versions
      WHERE design_id = ? AND version_number = ?
      LIMIT 1
      `,
      [designId, versionNumber],
    );

    if (vRows.length === 0) {
      throw new Error(`Version ${versionNumber} not found.`);
    }

    const version = new DesignVersionModel(vRows[0]);

    // Update design with snapshot values
    const updated = await this.update(
      designId,
      userId,
      version.name,
      version.model,
      version.components,
      version.materials,
      `Restored from Version ${versionNumber}`,
    );

    if (!updated) {
      throw new Error("Failed to restore version.");
    }

    return updated;
  }
}
