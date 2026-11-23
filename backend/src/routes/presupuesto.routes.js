const { Router } = require("express");
const presupuestoController = require("../controllers/presupuesto.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

router.get("/", (req, res, next) =>
  presupuestoController.listar(req, res, next),
);
router.post("/", (req, res, next) =>
  presupuestoController.crear(req, res, next),
);
router.post("/:id/convertir", (req, res, next) =>
  presupuestoController.convertirAOrden(req, res, next),
);
router.patch("/:id/rechazar", (req, res, next) =>
  presupuestoController.rechazar(req, res, next),
);

module.exports = router;
