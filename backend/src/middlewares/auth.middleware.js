const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Token no proporcionado o formato inválido");
    error.statusCode = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_jwt_secret_dev",
    );
    req.user = decoded;
    req.tallerId = decoded.tallerId; // Acceso rápido para aislar tenants
    next();
  } catch (err) {
    const error = new Error("Token inválido o expirado");
    error.statusCode = 401;
    next(error);
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      const error = new Error("Usuario no autenticado");
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.rol)) {
      const error = new Error("Acceso denegado: permisos insuficientes");
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = { authenticate, authorizeRoles };
