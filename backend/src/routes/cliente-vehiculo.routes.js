const { Router } = require("express");
const controller = require("../controllers/cliente-vehiculo.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  crearClienteVehiculoSchema,
} = require("../schemas/cliente-vehiculo.schema");

const router = Router();

router.use(authenticate);

router.get("/patente/:patente", (req, res, next) =>
  controller.obtenerPorPatente(req, res, next),
);

router.post("/", validate(crearClienteVehiculoSchema), (req, res, next) =>
  controller.registrar(req, res, next),
);

module.exports = router;
