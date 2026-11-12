const { Router } = require("express");
const controller = require("../controllers/portal.controller");
const validate = require("../middlewares/validate.middleware");
const {
  consultaPublicaSchema,
  webhookWhatsAppSchema,
} = require("../schemas/portal.schema");

const router = Router();

// Endpoints sin middleware authenticate
router.get("/:slug/patente/:patente", (req, res, next) => {
  consultaPublicaSchema.parse({ patente: req.params.patente });
  controller.obtenerEstadoPublico(req, res, next);
});

router.post(
  "/:slug/whatsapp-webhook",
  validate(webhookWhatsAppSchema),
  (req, res, next) => controller.webhookWhatsApp(req, res, next),
);

module.exports = router;
