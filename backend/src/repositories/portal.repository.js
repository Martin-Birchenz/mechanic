const pool = require("../config/db");

class PortalRepository {
  async findTallerBySlug(slug) {
    const query = `
      SELECT id, nombre, telefono, direccion, slug
      FROM talleres
      WHERE slug = ? AND is_active = 1 AND deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [slug]);
    return rows[0] || null;
  }

  async findEstadoVehiculoPublico(tallerId, patente) {
    const query = `
      SELECT 
        ot.id AS orden_id,
        ot.estado,
        ot.falla_declarada,
        ot.total_final,
        ot.fecha_ingreso,
        ot.fecha_entrega,
        v.patente,
        v.marca,
        v.modelo,
        c.nombre_completo AS cliente_nombre,
        c.telefono AS cliente_telefono,
        COALESCE((
          SELECT SUM(p.monto) 
          FROM pagos p 
          WHERE p.orden_id = ot.id AND p.deleted_at IS NULL
        ), 0) AS total_pagado,
        ROUND(ot.total_final - COALESCE((
          SELECT SUM(p.monto) 
          FROM pagos p 
          WHERE p.orden_id = ot.id AND p.deleted_at IS NULL
        ), 0), 2) AS saldo_pendiente,
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
        ) AS trabajos_realizados
      FROM ordenes_trabajo ot
      INNER JOIN vehiculos v ON ot.vehiculo_id = v.id
      INNER JOIN clientes c ON v.cliente_id = c.id
      WHERE ot.taller_id = ? 
        AND v.patente = ? 
        AND ot.deleted_at IS NULL
      ORDER BY ot.fecha_ingreso DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [tallerId, patente]);
    return rows[0] || null;
  }
}

module.exports = new PortalRepository();
