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

      await conn.beginTransaction();

      const [tallerRes] = await conn.query(
        `INSERT INTO talleres (nombre, slug, telefono, direccion, horarios, activo, tiene_portal_publico)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [
          nombreTaller.trim(),
          cleanSlug,
          telefono || null,
          direccion || null,
          horarios || null,
          tienePortalPublico ? 1 : 0,
        ],
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
