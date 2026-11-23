const { Router } = require("express");
const pool = require("../config/db");
const portalRepository = require("../repositories/portal.repository");

const router = Router();

// Obtener información institucional del taller por slug
router.get("/:slug", async (req, res, next) => {
  try {
    const taller = await portalRepository.findTallerBySlug(req.params.slug);
    if (!taller) {
      const err = new Error(
        "Taller no encontrado o portal público deshabilitado",
      );
      err.statusCode = 404;
      return next(err);
    }
    return res.status(200).json({ status: "success", data: taller });
  } catch (error) {
    next(error);
  }
});

// Historial público compartible por patente (solo lectura)
router.get("/:slug/historial/:patente", async (req, res, next) => {
  try {
    const taller = await portalRepository.findTallerBySlug(req.params.slug);
    if (!taller) {
      const err = new Error("Taller no encontrado");
      err.statusCode = 404;
      return next(err);
    }

    const patenteClean = req.params.patente.trim().toUpperCase();
    const [[vehiculo]] = await pool.query(
      `SELECT id, patente, marca, modelo, anio, kilometraje
       FROM vehiculos
       WHERE taller_id = ? AND TRIM(UPPER(patente)) = ? AND deleted_at IS NULL
       LIMIT 1`,
      [taller.id, patenteClean],
    );

    if (!vehiculo) {
      const err = new Error(
        "No se encontró historial para esa patente en este taller",
      );
      err.statusCode = 404;
      return next(err);
    }

    const [ordenes] = await pool.query(
      `SELECT 
        ot.id AS orden_id,
        ot.estado,
        ot.falla_declarada,
        ot.kilometraje_ingreso,
        ot.fecha_ingreso,
        ot.fecha_entrega,
        COALESCE(
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT('descripcion', r.descripcion, 'cantidad', r.cantidad)
          ) FROM ot_repuestos r WHERE r.orden_id = ot.id),
          JSON_ARRAY()
        ) AS repuestos
       FROM ordenes_trabajo ot
       WHERE ot.vehiculo_id = ? AND ot.taller_id = ? AND ot.deleted_at IS NULL
       ORDER BY ot.fecha_ingreso DESC`,
      [vehiculo.id, taller.id],
    );

    const historial = ordenes.map((o) => ({
      ...o,
      repuestos:
        typeof o.repuestos === "string"
          ? JSON.parse(o.repuestos)
          : o.repuestos || [],
    }));

    return res.status(200).json({
      status: "success",
      data: { taller, vehiculo, historial },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
