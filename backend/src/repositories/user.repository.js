const pool = require("../config/db");

class UserRepository {
  async findByEmail(email) {
    const query = `
      SELECT 
        u.id,
        u.taller_id,
        u.nombre,
        u.email,
        u.password_hash,
        u.rol,
        t.nombre AS taller_nombre,
        t.is_active AS taller_activo
      FROM usuarios u
      INNER JOIN talleres t ON u.taller_id = t.id
      WHERE u.email = ? AND u.deleted_at IS NULL AND t.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const query = `
      SELECT 
        u.id,
        u.taller_id,
        u.nombre,
        u.email,
        u.rol,
        t.nombre AS taller_nombre
      FROM usuarios u
      INNER JOIN talleres t ON u.taller_id = t.id
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async create({ taller_id, nombre, email, password_hash, rol }) {
    const query = `
      INSERT INTO usuarios (taller_id, nombre, email, password_hash, rol)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      taller_id,
      nombre,
      email,
      password_hash,
      rol || "MECANICO",
    ]);
    return result.insertId;
  }
}

module.exports = new UserRepository();
