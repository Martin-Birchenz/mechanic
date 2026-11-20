const { Router } = require("express");
const controller = require("../controllers/portal.controller");
const validate = require("../middlewares/validate.middleware");
const {
  consultaPublicaSchema,
  webhookWhatsAppSchema,
} = require("../schemas/portal.schema");
const portalRepository = require("../repositories/portal.repository");
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

module.exports = router;
