const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  loginSchema,
  registerUsuarioSchema,
} = require("../schemas/auth.schema");

const router = Router();

router.post("/login", validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next),
);

router.post("/register", validate(registerUsuarioSchema), (req, res, next) =>
  authController.register(req, res, next),
);

router.get("/me", authenticate, (req, res, next) =>
  authController.getProfile(req, res, next),
);

module.exports = router;
