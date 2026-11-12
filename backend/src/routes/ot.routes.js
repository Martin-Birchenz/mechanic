const { Router } = require("express");
const controller = require("../controllers/ot.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  crearOTSchema,
  cambiarEstadoSchema,
  registrarPagoSchema,
} = require("../schemas/ot.schema");

const router = Router();

// Todas las rutas de O.T. requieren token de mecánico o admin del taller
router.use(authenticate);

router.post("/", validate(crearOTSchema), (req, res, next) =>
  controller.crear(req, res, next),
);

router.get("/:id", (req, res, next) => controller.obtenerPorId(req, res, next));

router.patch("/:id/estado", validate(cambiarEstadoSchema), (req, res, next) =>
  controller.cambiarEstado(req, res, next),
);

router.post("/:id/pagos", validate(registrarPagoSchema), (req, res, next) =>
  controller.registrarCobro(req, res, next),
);

router.get("/", (req, res, next) => controller.listar(req, res, next));

module.exports = router;
