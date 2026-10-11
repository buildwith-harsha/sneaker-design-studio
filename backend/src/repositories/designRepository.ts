import pool from "../config/database.js";
import {
  DesignModel,
  DesignVersionModel,
  type DesignModelData,
  type DesignVersionModelData,
} from "../models/designModel.js";
import type {
  DesignComponents,
  DesignMaterials,
  DesignQueryOptions,
  PaginationMeta,
} from "../types/design.js";

export class DesignRepository {
  async findPaginated(
    userId: number,
    options: DesignQueryOptions = {},
  ): Promise<{ designs: DesignModel[]; pagination: PaginationMeta }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 8));
    const offset = (page - 1) * limit;

    let whereClause = "WHERE user_id = $1";
    const whereParams: (string | number)[] = [userId];

    if (options.search && options.search.trim()) {
      whereParams.push(`%${options.search.trim()}%`);
      whereClause += ` AND name ILIKE $${whereParams.length}`;
    }

    if (options.model && options.model.trim()) {
      whereParams.push(options.model.trim());
      whereClause += ` AND model = $${whereParams.length}`;
    }

    // 1. Get total count
    const countResult = await pool.query<{ total: string | number }>(
      `SELECT COUNT(*) as total FROM designs ${whereClause}`,
      whereParams,
    );
    const total = Number(countResult.rows[0]?.total || 0);
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
    const fetchParams = [...whereParams];
    fetchParams.push(limit);
    const limitIdx = fetchParams.length;
    fetchParams.push(offset);
    const offsetIdx = fetchParams.length;

    const result = await pool.query<DesignModelData>(
      `
      SELECT *
      FROM designs
      ${whereClause}
      ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      fetchParams,
    );

    const designs = result.rows.map((row) => new DesignModel(row));

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
    const result = await pool.query<DesignModelData>(
      `
      SELECT *
      FROM designs
      WHERE id = $1
      AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new DesignModel(result.rows[0]);
  }

  async create(
    userId: number,
    name: string,
    model: string,
    components: DesignComponents,
    materials: DesignMaterials,
  ): Promise<DesignModel> {
    const result = await pool.query<DesignModelData>(
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
        ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        userId,
        name,
        model,
        JSON.stringify(components),
        JSON.stringify(materials),
      ],
    );

    const newDesign = result.rows[0];

    if (!newDesign) {
      throw new Error("Design was created but could not be retrieved.");
    }

    // Snapshot version 1
    await pool.query(
      `
      INSERT INTO design_versions
        (design_id, version_number, name, model, components, materials, change_summary)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        newDesign.id,
        1,
        name,
        model,
        JSON.stringify(components),
        JSON.stringify(materials),
        "Initial creation",
      ],
    );

    return new DesignModel(newDesign);
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
    const updateResult = await pool.query<DesignModelData>(
      `
      UPDATE designs
      SET
        name = $1,
        model = $2,
        components = $3,
        materials = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      AND user_id = $6
      RETURNING *
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

    if (updateResult.rows.length === 0) {
      return null;
    }

    // Get current max version number for this design
    const maxResult = await pool.query<{ maxversion: number | null }>(
      `SELECT MAX(version_number) as maxversion FROM design_versions WHERE design_id = $1`,
      [id],
    );
    const nextVersion = Number(maxResult.rows[0]?.maxversion || 0) + 1;

    // Snapshot new version
    await pool.query(
      `
      INSERT INTO design_versions
        (design_id, version_number, name, model, components, materials, change_summary)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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

    return new DesignModel(updateResult.rows[0]);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      `
      DELETE FROM designs
      WHERE id = $1
      AND user_id = $2
      `,
      [id, userId],
    );

    return (result.rowCount ?? 0) > 0;
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

    const result = await pool.query<DesignVersionModelData>(
      `
      SELECT *
      FROM design_versions
      WHERE design_id = $1
      ORDER BY version_number DESC
      `,
      [designId],
    );

    return result.rows.map((row) => new DesignVersionModel(row));
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
    const vResult = await pool.query<DesignVersionModelData>(
      `
      SELECT *
      FROM design_versions
      WHERE design_id = $1 AND version_number = $2
      LIMIT 1
      `,
      [designId, versionNumber],
    );

    if (vResult.rows.length === 0) {
      throw new Error(`Version ${versionNumber} not found.`);
    }

    const version = new DesignVersionModel(vResult.rows[0]);

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
