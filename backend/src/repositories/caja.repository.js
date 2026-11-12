const pool = require("../config/db");

class CajaRepository {
  async findBalanceDiario(tallerId, fecha) {
    const query = `
      SELECT 
        metodo_pago,
        COUNT(id) AS cantidad_transacciones,
        COALESCE(SUM(monto), 0) AS subtotal
      FROM pagos
      WHERE taller_id = ? 
        AND DATE(created_at) = ? 
        AND deleted_at IS NULL
      GROUP BY metodo_pago
    `;
    const [rows] = await pool.execute(query, [tallerId, fecha]);
    return rows;
  }

  async findTransaccionesDelDia(tallerId, fecha) {
    const query = `
      SELECT 
        p.id AS pago_id,
        p.orden_id,
        p.monto,
        p.metodo_pago,
        p.notas,
        p.created_at AS hora_pago,
        v.patente,
        c.nombre_completo AS cliente_nombre
      FROM pagos p
      INNER JOIN ordenes_trabajo ot ON p.orden_id = ot.id
      INNER JOIN vehiculos v ON ot.vehiculo_id = v.id
      INNER JOIN clientes c ON v.cliente_id = c.id
      WHERE p.taller_id = ? 
        AND DATE(p.created_at) = ? 
        AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.execute(query, [tallerId, fecha]);
    return rows;
  }

  async findCuentasPorCobrar(tallerId) {
    const query = `
      SELECT 
        ot.id AS orden_id,
        ot.estado,
        ot.total_final,
        ot.fecha_ingreso,
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
        ), 0), 2) AS saldo_pendiente
      FROM ordenes_trabajo ot
      INNER JOIN vehiculos v ON ot.vehiculo_id = v.id
      INNER JOIN clientes c ON v.cliente_id = c.id
      WHERE ot.taller_id = ? 
        AND ot.deleted_at IS NULL
      HAVING saldo_pendiente > 0
      ORDER BY saldo_pendiente DESC, ot.fecha_ingreso ASC
    `;
    const [rows] = await pool.execute(query, [tallerId]);
    return rows;
  }
}

module.exports = new CajaRepository();
