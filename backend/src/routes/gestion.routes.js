const { Router } = require("express");
const gestionController = require("../controllers/gestion.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

// Egresos y Métricas
router.get("/egresos", (req, res, next) =>
  gestionController.listarEgresos(req, res, next),
);
router.post("/egresos", (req, res, next) =>
  gestionController.crearEgreso(req, res, next),
);
router.delete("/egresos/:id", (req, res, next) =>
  gestionController.eliminarEgreso(req, res, next),
);
router.get("/metricas", (req, res, next) =>
  gestionController.metricasMensuales(req, res, next),
);

// Stock de Repuestos
router.get("/stock", (req, res, next) =>
  gestionController.listarStock(req, res, next),
);
router.post("/stock", (req, res, next) =>
  gestionController.crearRepuesto(req, res, next),
);
router.patch("/stock/:id", (req, res, next) =>
  gestionController.ajustarStock(req, res, next),
);

// Recordatorios de Service
router.get("/recordatorios", (req, res, next) =>
  gestionController.listarRecordatorios(req, res, next),
);
router.post("/recordatorios", (req, res, next) =>
  gestionController.crearRecordatorio(req, res, next),
);
router.patch("/recordatorios/:id/contactado", (req, res, next) =>
  gestionController.marcarRecordatorioContactado(req, res, next),
);

// Mi Taller
router.get("/mi-taller", (req, res, next) =>
  gestionController.obtenerMiTaller(req, res, next),
);
router.put("/mi-taller", (req, res, next) =>
  gestionController.actualizarMiTaller(req, res, next),
);

module.exports = router;
