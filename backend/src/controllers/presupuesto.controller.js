const pool = require("../config/db");

class PresupuestoController {
  async listar(req, res, next) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          p.*,
          v.patente,
          v.marca,
          v.modelo,
          v.kilometraje,
          c.nombre_completo AS cliente_nombre,
          c.telefono AS cliente_telefono,
          COALESCE(
            (SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', pi.id,
                'descripcion', pi.descripcion,
                'cantidad', pi.cantidad,
                'precio_unitario', pi.precio_unitario,
                'subtotal', pi.subtotal
              )
            ) FROM presupuesto_items pi WHERE pi.presupuesto_id = p.id),
            JSON_ARRAY()
          ) AS items
        FROM presupuestos p
        INNER JOIN vehiculos v ON p.vehiculo_id = v.id
        INNER JOIN clientes c ON v.cliente_id = c.id
        WHERE p.taller_id = ?
        ORDER BY p.created_at DESC`,
        [req.tallerId],
      );

      const parsed = rows.map((r) => ({
        ...r,
        items:
          typeof r.items === "string" ? JSON.parse(r.items) : r.items || [],
      }));

      return res.status(200).json({ status: "success", data: parsed });
    } catch (error) {
      next(error);
    }
  }

  async crear(req, res, next) {
    const conn = await pool.getConnection();
    try {
      const {
        vehiculo_id,
        falla_declarada,
        observaciones,
        validez_dias = 15,
        total_mano_obra = 0,
        items = [],
      } = req.body;

      if (!vehiculo_id || !falla_declarada) {
        const err = new Error(
          "Vehículo y descripción del trabajo son obligatorios",
        );
        err.statusCode = 400;
        throw err;
      }

      const itemsLimpios = items
        .filter((i) => i.descripcion && i.descripcion.trim() !== "")
        .map((i) => {
          const cant = Number(i.cantidad) || 1;
          const pu = Number(i.precio_unitario) || 0;
          return {
            descripcion: i.descripcion.trim(),
            cantidad: cant,
            precio_unitario: pu,
            subtotal: cant * pu,
          };
        });

      const totalRepuestos = itemsLimpios.reduce(
        (acc, i) => acc + i.subtotal,
        0,
      );
      const manoObra = Number(total_mano_obra) || 0;
      const totalFinal = manoObra + totalRepuestos;

      await conn.beginTransaction();

      const [presRes] = await conn.query(
        `INSERT INTO presupuestos 
          (taller_id, vehiculo_id, falla_declarada, observaciones, validez_dias, total_mano_obra, total_repuestos, total_final)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.tallerId,
          Number(vehiculo_id),
          falla_declarada.trim(),
          observaciones || null,
          Number(validez_dias) || 15,
          manoObra,
          totalRepuestos,
          totalFinal,
        ],
      );

      const presupuestoId = presRes.insertId;

      for (const item of itemsLimpios) {
        await conn.query(
          `INSERT INTO presupuesto_items (presupuesto_id, descripcion, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [
            presupuestoId,
            item.descripcion,
            item.cantidad,
            item.precio_unitario,
            item.subtotal,
          ],
        );
      }

      await conn.commit();

      return res.status(201).json({
        status: "success",
        message: "Presupuesto creado correctamente",
        data: { id: presupuestoId, total_final: totalFinal },
      });
    } catch (error) {
      await conn.rollback();
      next(error);
    } finally {
      conn.release();
    }
  }

  async convertirAOrden(req, res, next) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      await conn.beginTransaction();

      const [[pres]] = await conn.query(
        `SELECT p.*, v.kilometraje 
         FROM presupuestos p
         INNER JOIN vehiculos v ON p.vehiculo_id = v.id
         WHERE p.id = ? AND p.taller_id = ? FOR UPDATE`,
        [id, req.tallerId],
      );

      if (!pres) {
        const err = new Error("Presupuesto no encontrado");
        err.statusCode = 404;
        throw err;
      }

      if (pres.estado === "APROBADO" && pres.orden_generada_id) {
        const err = new Error(
          "Este presupuesto ya fue convertido a Orden de Trabajo",
        );
        err.statusCode = 400;
        throw err;
      }

      const [items] = await conn.query(
        "SELECT * FROM presupuesto_items WHERE presupuesto_id = ?",
        [id],
      );

      // Creamos la Orden de Trabajo con los montos del presupuesto
      const [otRes] = await conn.query(
        `INSERT INTO ordenes_trabajo 
          (taller_id, vehiculo_id, estado, falla_declarada, kilometraje_ingreso, total_mano_obra, total_repuestos, total_final)
         VALUES (?, ?, 'INGRESADO', ?, ?, ?, ?, ?)`,
        [
          req.tallerId,
          pres.vehiculo_id,
          pres.falla_declarada,
          Number(pres.kilometraje) || 0,
          Number(pres.total_mano_obra) || 0,
          Number(pres.total_repuestos) || 0,
          Number(pres.total_final) || 0,
        ],
      );

      const nuevaOrdenId = otRes.insertId;

      for (const it of items) {
        await conn.query(
          `INSERT INTO ot_repuestos (orden_id, descripcion, cantidad, costo_unitario, precio_unitario, subtotal)
           VALUES (?, ?, ?, 0, ?, ?)`,
          [
            nuevaOrdenId,
            it.descripcion,
            it.cantidad,
            it.precio_unitario,
            it.subtotal,
          ],
        );
      }

      await conn.query(
        `UPDATE presupuestos 
         SET estado = 'APROBADO', orden_generada_id = ? 
         WHERE id = ?`,
        [nuevaOrdenId, id],
      );

      await conn.commit();

      return res.status(201).json({
        status: "success",
        message: `Presupuesto aprobado y convertido a Orden de Trabajo #${nuevaOrdenId}`,
        data: { orden_id: nuevaOrdenId },
      });
    } catch (error) {
      await conn.rollback();
      next(error);
    } finally {
      conn.release();
    }
  }

  async rechazar(req, res, next) {
    try {
      await pool.query(
        "UPDATE presupuestos SET estado = 'RECHAZADO' WHERE id = ? AND taller_id = ?",
        [req.params.id, req.tallerId],
      );
      return res
        .status(200)
        .json({
          status: "success",
          message: "Presupuesto marcado como rechazado",
        });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PresupuestoController();
