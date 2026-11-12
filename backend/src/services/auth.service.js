const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");

class AuthService {
  async login(email, password) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      const error = new Error("Credenciales inválidas");
      error.statusCode = 401;
      throw error;
    }

    if (!user.taller_activo) {
      const error = new Error("El taller asociado se encuentra suspendido");
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error("Credenciales inválidas");
      error.statusCode = 401;
      throw error;
    }

    // El payload incluye taller_id para las consultas multitenant
    const payload = {
      userId: user.id,
      tallerId: user.taller_id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_jwt_secret_dev",
      { expiresIn: "12h" },
    );

    return {
      token,
      user: {
        id: user.id,
        taller_id: user.taller_id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        taller_nombre: user.taller_nombre,
      },
    };
  }

  async register(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      const error = new Error(`El email ${data.email} ya está registrado`);
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const insertId = await userRepository.create({
      taller_id: data.taller_id,
      nombre: data.nombre,
      email: data.email,
      password_hash,
      rol: data.rol,
    });

    return {
      id: insertId,
      taller_id: data.taller_id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
    };
  }
}

module.exports = new AuthService();
