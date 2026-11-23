const { Router } = require("express");
const pool = require("../config/db");
const portalRepository = require("../repositories/portal.repository");

const router = Router();

// Normaliza patentes argentinas o generales: quita espacios y pasa a mayúsculas
function normalizarPatente(patente) {
  return String(patente || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

// Datos públicos del taller por slug
router.get("/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    const taller = await portalRepository.findTallerBySlug(slug);

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

// Estado del vehículo por patente en el portal público
router.get("/:slug/patente/:patente", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    const patenteClean = normalizarPatente(req.params.patente);

    if (!patenteClean) {
      const err = new Error("Ingresá una patente válida para consultar");
      err.statusCode = 400;
      return next(err);
    }

    const taller = await portalRepository.findTallerBySlug(slug);
    if (!taller) {
      const err = new Error("Taller no encontrado");
      err.statusCode = 404;
      return next(err);
    }

    const estadoVehiculo = await portalRepository.findEstadoVehiculoPublico(
      taller.id,
      patenteClean,
    );

    if (!estadoVehiculo) {
      const err = new Error(
        `No encontramos registros para la patente ${patenteClean} en ${taller.nombre}`,
      );
      err.statusCode = 404;
      return next(err);
    }

    return res.status(200).json({
      status: "success",
      data: {
        vehiculo: {
          patente: estadoVehiculo.patente,
          marca: estadoVehiculo.marca,
          modelo: estadoVehiculo.modelo,
        },
        orden: {
          id: estadoVehiculo.orden_id,
          estado: estadoVehiculo.estado,
          falla_declarada: estadoVehiculo.falla_declarada,
          trabajos: estadoVehiculo.trabajos_realizados || [],
          total: Number(estadoVehiculo.total_final || 0),
          total_pagado: Number(estadoVehiculo.total_pagado || 0),
          saldo_pendiente: Number(estadoVehiculo.saldo_pendiente || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Historial público compartible por patente (solo lectura)
router.get("/:slug/historial/:patente", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    const patenteClean = normalizarPatente(req.params.patente);

    const taller = await portalRepository.findTallerBySlug(slug);
    if (!taller) {
      const err = new Error("Taller no encontrado");
      err.statusCode = 404;
      return next(err);
    }

    const [[vehiculo]] = await pool.query(
      `SELECT id, patente, marca, modelo, anio, kilometraje
       FROM vehiculos
       WHERE taller_id = ?
         AND REPLACE(UPPER(TRIM(patente)), ' ', '') = ?
         AND deleted_at IS NULL
       LIMIT 1`,
      [taller.id, patenteClean],
    );

    if (!vehiculo) {
      const err = new Error(
        `No se encontró historial para la patente ${patenteClean} en este taller`,
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
