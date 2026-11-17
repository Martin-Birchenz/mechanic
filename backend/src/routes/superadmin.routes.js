const { Router } = require("express");
const superAdminController = require("../controllers/superadmin.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = Router();

router.use(authenticate, authorizeRoles("SUPERADMIN"));

router.get("/talleres", (req, res, next) =>
  superAdminController.listarTalleres(req, res, next),
);
router.post("/talleres", (req, res, next) =>
  superAdminController.crearTallerConAdmin(req, res, next),
);
router.patch("/talleres/:id", (req, res, next) =>
  superAdminController.toggleTaller(req, res, next),
);

module.exports = router;
