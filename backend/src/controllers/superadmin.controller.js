const bcrypt = require("bcryptjs");
const pool = require("../config/db");

class SuperAdminController {
  async listarTalleres(req, res, next) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          t.*,
          (SELECT COUNT(*) FROM usuarios u WHERE u.taller_id = t.id) AS total_usuarios,
          (SELECT COUNT(*) FROM ordenes_trabajo o WHERE o.taller_id = t.id) AS total_ordenes
        FROM talleres t
        ORDER BY t.id DESC
      `);
      return res.status(200).json({ status: "success", data: rows });
    } catch (error) {
      next(error);
    }
  }

  async crearTallerConAdmin(req, res, next) {
    const conn = await pool.getConnection();
    try {
      const {
        nombreTaller,
        slug,
        telefono,
        direccion,
        horarios,
        tienePortalPublico = true,
        adminNombre,
        adminEmail,
        adminPassword,
      } = req.body;

      if (
        !nombreTaller ||
        !slug ||
        !adminNombre ||
        !adminEmail ||
        !adminPassword
      ) {
        const err = new Error(
          "Faltan campos obligatorios para crear el taller y su administrador",
        );
        err.statusCode = 400;
        throw err;
      }

      const cleanSlug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "-");

      // Inspeccionamos qué columnas reales tiene tu tabla `talleres`
      const [cols] = await conn.query("SHOW COLUMNS FROM talleres");
      const colNames = cols.map((c) => c.Field);

      const fields = ["nombre", "slug"];
      const values = [nombreTaller.trim(), cleanSlug];

      if (colNames.includes("telefono")) {
        fields.push("telefono");
        values.push(telefono || null);
      }
      if (colNames.includes("direccion")) {
        fields.push("direccion");
        values.push(direccion || null);
      }
      if (colNames.includes("horarios")) {
        fields.push("horarios");
        values.push(horarios || null);
      }
      if (colNames.includes("activo")) {
        fields.push("activo");
        values.push(1);
      }
      if (colNames.includes("tiene_portal_publico")) {
        fields.push("tiene_portal_publico");
        values.push(tienePortalPublico ? 1 : 0);
      }

      await conn.beginTransaction();

      const placeholders = fields.map(() => "?").join(", ");
      const [tallerRes] = await conn.query(
        `INSERT INTO talleres (${fields.join(", ")}) VALUES (${placeholders})`,
        values,
      );

      const tallerId = tallerRes.insertId;
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      await conn.query(
        `INSERT INTO usuarios (taller_id, nombre, email, password_hash, rol)
         VALUES (?, ?, ?, ?, 'ADMIN')`,
        [
          tallerId,
          adminNombre.trim(),
          adminEmail.toLowerCase().trim(),
          passwordHash,
        ],
      );

      await conn.commit();

      return res.status(201).json({
        status: "success",
        message: "Taller y cuenta de administrador creados correctamente",
        data: { id: tallerId, nombre: nombreTaller, slug: cleanSlug },
      });
    } catch (error) {
      await conn.rollback();
      next(error);
    } finally {
      conn.release();
    }
  }

  async toggleTaller(req, res, next) {
    try {
      const { id } = req.params;
      const { activo, tiene_portal_publico } = req.body;

      await pool.query(
        `UPDATE talleres 
         SET activo = COALESCE(?, activo),
             tiene_portal_publico = COALESCE(?, tiene_portal_publico)
         WHERE id = ?`,
        [
          activo !== undefined ? (activo ? 1 : 0) : null,
          tiene_portal_publico !== undefined
            ? tiene_portal_publico
              ? 1
              : 0
            : null,
          id,
        ],
      );

      return res.status(200).json({
        status: "success",
        message: "Estado del taller actualizado",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuperAdminController();
