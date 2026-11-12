const { Router } = require("express");
const controller = require("../controllers/caja.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { consultaCajaSchema } = require("../schemas/caja.schema");

const router = Router();

router.use(authenticate);

router.get("/diario", (req, res, next) => {
  req.query = consultaCajaSchema.parse(req.query);
  controller.obtenerCierreDiario(req, res, next);
});

router.get("/pendientes", (req, res, next) =>
  controller.obtenerCuentasPorCobrar(req, res, next),
);

module.exports = router;
