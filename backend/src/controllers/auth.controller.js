const authService = require("../services/auth.service");

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return res.status(200).json({
        status: "success",
        message: "Inicio de sesión exitoso",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json({
        status: "success",
        message: "Usuario registrado con éxito",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      return res.status(200).json({
        status: "success",
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
