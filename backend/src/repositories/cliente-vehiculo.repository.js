const pool = require("../config/db");

class ClienteVehiculoRepository {
  async findByPatente(tallerId, patente) {
    const query = `
      SELECT 
        v.id AS vehiculo_id,
        v.patente,
        v.marca,
        v.modelo,
        v.anio,
        v.kilometraje,
        c.id AS cliente_id,
        c.nombre_completo AS cliente_nombre,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email
      FROM vehiculos v
      INNER JOIN clientes c ON v.cliente_id = c.id
      WHERE v.taller_id = ? AND v.patente = ? AND v.deleted_at IS NULL AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [tallerId, patente]);
    return rows[0] || null;
  }

  async findHistorialByVehiculoId(tallerId, vehiculoId) {
    const query = `
      SELECT 
        ot.id AS ot_id,
        ot.estado,
        ot.falla_declarada,
        ot.diagnostico_tecnico,
        ot.kilometraje_ingreso,
        ot.total_final,
        ot.fecha_ingreso,
        ot.fecha_entrega,
        COALESCE(
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'descripcion', r.descripcion,
              'cantidad', r.cantidad,
              'precio_unitario', r.precio_unitario,
              'subtotal', r.subtotal
            )
          ) FROM ot_repuestos r WHERE r.orden_id = ot.id), 
          JSON_ARRAY()
        ) AS repuestos
      FROM ordenes_trabajo ot
      WHERE ot.taller_id = ? AND ot.vehiculo_id = ? AND ot.deleted_at IS NULL
      ORDER BY ot.fecha_ingreso DESC
    `;
    const [rows] = await pool.execute(query, [tallerId, vehiculoId]);
    return rows;
  }

  async createClienteVehiculoTransaccional(tallerId, data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [clienteResult] = await connection.execute(
        `INSERT INTO clientes (taller_id, nombre_completo, telefono, email) VALUES (?, ?, ?, ?)`,
        [tallerId, data.nombre_completo, data.telefono, data.email || null],
      );
      const clienteId = clienteResult.insertId;

      const [vehiculoResult] = await connection.execute(
        `INSERT INTO vehiculos (taller_id, cliente_id, patente, marca, modelo, anio, kilometraje) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tallerId,
          clienteId,
          data.patente,
          data.marca,
          data.modelo,
          data.anio || null,
          data.kilometraje || 0,
        ],
      );

      await connection.commit();
      return { clienteId, vehiculoId: vehiculoResult.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new ClienteVehiculoRepository();
