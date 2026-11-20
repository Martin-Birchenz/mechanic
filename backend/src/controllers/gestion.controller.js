const pool = require("../config/db");

class GestionController {
  // === 1. EGRESOS Y BALANCE MENSUAL ===
  async listarEgresos(req, res, next) {
    try {
      const { fecha } = req.query;
      let sql = "SELECT * FROM egresos_caja WHERE taller_id = ?";
      const params = [req.tallerId];

      if (fecha) {
        sql += " AND DATE(fecha) = ?";
        params.push(fecha);
      }
      sql += " ORDER BY fecha DESC";

      const [rows] = await pool.query(sql, params);
      return res.status(200).json({ status: "success", data: rows });
    } catch (error) {
      next(error);
    }
  }

  async crearEgreso(req, res, next) {
    try {
      const {
        concepto,
        categoria = "VARIOS",
        monto,
        metodo_pago = "EFECTIVO",
        fecha,
      } = req.body;
      if (!concepto || !monto || Number(monto) <= 0) {
        const err = new Error("Concepto y monto mayor a 0 son obligatorios");
        err.statusCode = 400;
        throw err;
      }

      const [result] = await pool.query(
        `INSERT INTO egresos_caja (taller_id, concepto, categoria, monto, metodo_pago, fecha)
         VALUES (?, ?, ?, ?, ?, COALESCE(?, NOW()))`,
        [
          req.tallerId,
          concepto.trim(),
          categoria,
          Number(monto),
          metodo_pago,
          fecha || null,
        ],
      );

      return res.status(201).json({
        status: "success",
        message: "Gasto registrado en caja",
        data: { id: result.insertId },
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminarEgreso(req, res, next) {
    try {
      await pool.query(
        "DELETE FROM egresos_caja WHERE id = ? AND taller_id = ?",
        [req.params.id, req.tallerId],
      );
      return res
        .status(200)
        .json({ status: "success", message: "Gasto eliminado" });
    } catch (error) {
      next(error);
    }
  }

  async metricasMensuales(req, res, next) {
    try {
      const mes = req.query.mes || new Date().toISOString().slice(0, 7); // YYYY-MM

      const [[ingresosRow]] = await pool.query(
        `SELECT COALESCE(SUM(p.monto), 0) AS total_ingresos, COUNT(p.id) AS cant_cobros
         FROM pagos p
         JOIN ordenes_trabajo o ON p.orden_id = o.id
         WHERE o.taller_id = ? 
           AND p.deleted_at IS NULL 
           AND DATE_FORMAT(p.created_at, '%Y-%m') = ?`,
        [req.tallerId, mes],
      );

      const [[egresosRow]] = await pool.query(
        `SELECT COALESCE(SUM(monto), 0) AS total_egresos
         FROM egresos_caja
         WHERE taller_id = ? AND DATE_FORMAT(fecha, '%Y-%m') = ?`,
        [req.tallerId, mes],
      );

      const [[ordenesRow]] = await pool.query(
        `SELECT COUNT(*) AS cant_ordenes, COALESCE(AVG(total_final), 0) AS ticket_promedio
         FROM ordenes_trabajo
         WHERE taller_id = ? AND deleted_at IS NULL AND DATE_FORMAT(fecha_ingreso, '%Y-%m') = ?`,
        [req.tallerId, mes],
      );

      const totalIngresos = Number(ingresosRow.total_ingresos || 0);
      const totalEgresos = Number(egresosRow.total_egresos || 0);

      return res.status(200).json({
        status: "success",
        data: {
          mes,
          total_ingresos: totalIngresos,
          total_egresos: totalEgresos,
          balance_neto: totalIngresos - totalEgresos,
          cant_ordenes: Number(ordenesRow.cant_ordenes || 0),
          ticket_promedio: Math.round(Number(ordenesRow.ticket_promedio || 0)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // === 2. STOCK DE REPUESTOS PROPIOS ===
  async listarStock(req, res, next) {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM repuestos_stock WHERE taller_id = ? ORDER BY nombre ASC",
        [req.tallerId],
      );
      return res.status(200).json({ status: "success", data: rows });
    } catch (error) {
      next(error);
    }
  }

  async crearRepuesto(req, res, next) {
    try {
      const {
        codigo,
        nombre,
        marca,
        stock_actual = 0,
        stock_minimo = 2,
        precio_costo = 0,
        precio_venta = 0,
      } = req.body;
      if (!nombre) {
        const err = new Error("El nombre del repuesto es obligatorio");
        err.statusCode = 400;
        throw err;
      }

      const [result] = await pool.query(
        `INSERT INTO repuestos_stock (taller_id, codigo, nombre, marca, stock_actual, stock_minimo, precio_costo, precio_venta)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.tallerId,
          codigo || null,
          nombre.trim(),
          marca || null,
          Number(stock_actual),
          Number(stock_minimo),
          Number(precio_costo),
          Number(precio_venta),
        ],
      );

      return res
        .status(201)
        .json({ status: "success", data: { id: result.insertId } });
    } catch (error) {
      next(error);
    }
  }

  async ajustarStock(req, res, next) {
    try {
      const { delta, precio_venta } = req.body;
      if (delta !== undefined) {
        await pool.query(
          "UPDATE repuestos_stock SET stock_actual = GREATEST(0, stock_actual + ?) WHERE id = ? AND taller_id = ?",
          [Number(delta), req.params.id, req.tallerId],
        );
      }
      if (precio_venta !== undefined) {
        await pool.query(
          "UPDATE repuestos_stock SET precio_venta = ? WHERE id = ? AND taller_id = ?",
          [Number(precio_venta), req.params.id, req.tallerId],
        );
      }
      return res
        .status(200)
        .json({ status: "success", message: "Stock actualizado" });
    } catch (error) {
      next(error);
    }
  }

  // === 3. RECORDATORIOS DE PRÓXIMO SERVICE ===
  async listarRecordatorios(req, res, next) {
    try {
      const [rows] = await pool.query(
        `SELECT r.*, v.patente, v.marca, v.modelo, c.nombre_completo AS cliente_nombre, c.telefono AS cliente_telefono
         FROM recordatorios_service r
         JOIN vehiculos v ON r.vehiculo_id = v.id
         JOIN clientes c ON v.cliente_id = c.id
         WHERE r.taller_id = ?
         ORDER BY r.contactado ASC, r.fecha_recordatorio ASC`,
        [req.tallerId],
      );
      return res.status(200).json({ status: "success", data: rows });
    } catch (error) {
      next(error);
    }
  }

  async crearRecordatorio(req, res, next) {
    try {
      const { patente, fecha_recordatorio, km_proximo, motivo } = req.body;
      if (!patente || !fecha_recordatorio) {
        const err = new Error(
          "Patente y fecha de recordatorio son obligatorias",
        );
        err.statusCode = 400;
        throw err;
      }

      const [[vehiculo]] = await pool.query(
        "SELECT id FROM vehiculos WHERE patente = ? AND taller_id = ? LIMIT 1",
        [patente.trim().toUpperCase(), req.tallerId],
      );

      if (!vehiculo) {
        const err = new Error(
          "No se encontró un vehículo con esa patente en el taller",
        );
        err.statusCode = 404;
        throw err;
      }

      const [result] = await pool.query(
        `INSERT INTO recordatorios_service (taller_id, vehiculo_id, fecha_recordatorio, km_proximo, motivo)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.tallerId,
          vehiculo.id,
          fecha_recordatorio,
          km_proximo ? Number(km_proximo) : null,
          motivo || "Service de mantenimiento / Cambio de aceite",
        ],
      );

      return res
        .status(201)
        .json({ status: "success", data: { id: result.insertId } });
    } catch (error) {
      next(error);
    }
  }

  async marcarRecordatorioContactado(req, res, next) {
    try {
      await pool.query(
        "UPDATE recordatorios_service SET contactado = 1 WHERE id = ? AND taller_id = ?",
        [req.params.id, req.tallerId],
      );
      return res
        .status(200)
        .json({ status: "success", message: "Marcado como contactado" });
    } catch (error) {
      next(error);
    }
  }

  // === 4. CONFIGURACIÓN DE MI TALLER ===
  async obtenerMiTaller(req, res, next) {
    try {
      const [[taller]] = await pool.query(
        "SELECT * FROM talleres WHERE id = ?",
        [req.tallerId],
      );
      return res.status(200).json({ status: "success", data: taller });
    } catch (error) {
      next(error);
    }
  }

  async actualizarMiTaller(req, res, next) {
    try {
      const {
        nombre,
        telefono,
        direccion,
        horarios,
        logo_url,
        descripcion_servicios,
      } = req.body;
      await pool.query(
        `UPDATE talleres
         SET nombre = COALESCE(?, nombre),
             telefono = ?,
             direccion = ?,
             horarios = ?,
             logo_url = ?,
             descripcion_servicios = ?
         WHERE id = ?`,
        [
          nombre ? nombre.trim() : null,
          telefono || null,
          direccion || null,
          horarios || null,
          logo_url || null,
          descripcion_servicios || null,
          req.tallerId,
        ],
      );
      return res
        .status(200)
        .json({ status: "success", message: "Datos del taller actualizados" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GestionController();
