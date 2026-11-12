const { z } = require("zod");

const loginSchema = z.object({
  email: z
    .string({ required_error: "El email es requerido" })
    .email("Formato de email inválido")
    .trim(),
  password: z
    .string({ required_error: "La contraseña es requerida" })
    .min(1, "La contraseña no puede estar vacía"),
});

const registerUsuarioSchema = z.object({
  taller_id: z.number().int().positive("ID de taller inválido"),
  nombre: z.string().trim().min(2, "El nombre es requerido"),
  email: z.string().email("Formato de email inválido").trim(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.enum(["ADMIN", "MECANICO"]).default("MECANICO"),
});

module.exports = {
  loginSchema,
  registerUsuarioSchema,
};
