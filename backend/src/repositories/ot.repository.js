const pool = require("../config/db");

class OTRepository {
  async createOTTransaccional(tallerId, data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Calcular total de repuestos
      let totalRepuestos = 0;
      const repuestosConSubtotal = data.repuestos.map((r) => {
        const subtotal = Number((r.cantidad * r.precio_unitario).toFixed(2));
        totalRepuestos += subtotal;
        return { ...r, subtotal };
      });

      const totalManoObra = Number(data.total_mano_obra || 0);
      const totalFinal = Number((totalRepuestos + totalManoObra).toFixed(2));

      // 2. Insertar Orden de Trabajo
      const insertOTQuery = `
        INSERT INTO ordenes_trabajo (
          taller_id, vehiculo_id, falla_declarada, diagnostico_tecnico,
          kilometraje_ingreso, total_mano_obra, total_repuestos, total_final, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INGRESADO')
      `;
      const [otResult] = await connection.execute(insertOTQuery, [
        tallerId,
        data.vehiculo_id,
        data.falla_declarada,
        data.diagnostico_tecnico || null,
        data.kilometraje_ingreso,
        totalManoObra,
        totalRepuestos,
        totalFinal,
      ]);
      const ordenId = otResult.insertId;

      // 3. Insertar repuestos asociados
      for (const rep of repuestosConSubtotal) {
        await connection.execute(
          `INSERT INTO ot_repuestos (orden_id, descripcion, cantidad, costo_unitario, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ordenId,
            rep.descripcion,
            rep.cantidad,
            rep.costo_unitario,
            rep.precio_unitario,
            rep.subtotal,
          ],
        );
      }

      // 4. Registrar anticipo si existe
      let pagoInicialId = null;
      if (data.pago_inicial && data.pago_inicial.monto > 0) {
        const [pagoResult] = await connection.execute(
          `INSERT INTO pagos (taller_id, orden_id, monto, metodo_pago, notas)
           VALUES (?, ?, ?, ?, ?)`,
          [
            tallerId,
            ordenId,
            data.pago_inicial.monto,
            data.pago_inicial.metodo_pago,
            data.pago_inicial.notas || "Anticipo de ingreso",
          ],
        );
        pagoInicialId = pagoResult.insertId;
      }

      // 5. Actualizar odómetro del vehículo
      await connection.execute(
        `UPDATE vehiculos SET kilometraje = ? WHERE id = ? AND taller_id = ?`,
        [data.kilometraje_ingreso, data.vehiculo_id, tallerId],
      );

      await connection.commit();
      return {
        ordenId,
        totalRepuestos,
        totalManoObra,
        totalFinal,
        pagoInicialId,
        montoPagado: data.pago_inicial ? data.pago_inicial.monto : 0,
        saldoPendiente: Number(
          (
            totalFinal - (data.pago_inicial ? data.pago_inicial.monto : 0)
          ).toFixed(2),
        ),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(tallerId, ordenId) {
    const query = `
      SELECT 
        ot.*,
        v.patente,
        v.marca,
        v.modelo,
        c.nombre_completo AS cliente_nombre,
        c.telefono AS cliente_telefono,
        COALESCE(
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'descripcion', r.descripcion,
              'cantidad', r.cantidad,
              'costo_unitario', r.costo_unitario,
              'precio_unitario', r.precio_unitario,
              'subtotal', r.subtotal
            )
          ) FROM ot_repuestos r WHERE r.orden_id = ot.id),
          JSON_ARRAY()
        ) AS repuestos,
        COALESCE(
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', p.id,
              'monto', p.monto,
              'metodo_pago', p.metodo_pago,
              'notas', p.notas,
              'fecha', p.created_at
            )
          ) FROM pagos p WHERE p.orden_id = ot.id AND p.deleted_at IS NULL),
          JSON_ARRAY()
        ) AS pagos,
        COALESCE((SELECT SUM(monto) FROM pagos WHERE orden_id = ot.id AND deleted_at IS NULL), 0) AS total_pagado
      FROM ordenes_trabajo ot
      INNER JOIN vehiculos v ON ot.vehiculo_id = v.id
      INNER JOIN clientes c ON v.cliente_id = c.id
      WHERE ot.id = ? AND ot.taller_id = ? AND ot.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [ordenId, tallerId]);
    if (!rows[0]) return null;

    const row = rows[0];
    const totalPagado = Number(row.total_pagado);
    const totalFinal = Number(row.total_final);
    const saldoPendiente = Number((totalFinal - totalPagado).toFixed(2));

    return {
      ...row,
      total_pagado: totalPagado,
      saldo_pendiente: saldoPendiente,
    };
  }

  async updateEstado(tallerId, ordenId, nuevoEstado) {
    const fechaEntregaSQL = nuevoEstado === "ENTREGADO" ? "NOW()" : "NULL";
    const query = `
      UPDATE ordenes_trabajo 
      SET estado = ?, 
          fecha_entrega = CASE WHEN ? = 'ENTREGADO' THEN NOW() ELSE fecha_entrega END
      WHERE id = ? AND taller_id = ? AND deleted_at IS NULL
    `;
    const [result] = await pool.execute(query, [
      nuevoEstado,
      nuevoEstado,
      ordenId,
      tallerId,
    ]);
    return result.affectedRows > 0;
  }

  async registrarPago(tallerId, ordenId, data) {
    const query = `
      INSERT INTO pagos (taller_id, orden_id, monto, metodo_pago, notas)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      tallerId,
      ordenId,
      data.monto,
      data.metodo_pago,
      data.notas || null,
    ]);
    return result.insertId;
  }

  async findAllByTaller(tallerId) {
    const query = `
      SELECT 
        ot.*,
        v.patente,
        v.marca,
        v.modelo,
        c.nombre_completo AS cliente_nombre,
        c.telefono AS cliente_telefono,
        COALESCE((SELECT SUM(monto) FROM pagos WHERE orden_id = ot.id AND deleted_at IS NULL), 0) AS total_pagado,
        ROUND(ot.total_final - COALESCE((SELECT SUM(monto) FROM pagos WHERE orden_id = ot.id AND deleted_at IS NULL), 0), 2) AS saldo_pendiente
      FROM ordenes_trabajo ot
      INNER JOIN vehiculos v ON ot.vehiculo_id = v.id
      INNER JOIN clientes c ON v.cliente_id = c.id
      WHERE ot.taller_id = ? AND ot.deleted_at IS NULL
      ORDER BY ot.created_at DESC
    `;
    const [rows] = await pool.execute(query, [tallerId]);
    return rows;
  }
}

module.exports = new OTRepository();
