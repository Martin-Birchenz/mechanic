const { z } = require("zod");

const regexPatente = /^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/;

const crearClienteVehiculoSchema = z.object({
  nombre_completo: z
    .string({ required_error: "El nombre del cliente es obligatorio" })
    .trim()
    .min(3, "Mínimo 3 caracteres"),
  telefono: z
    .string({ required_error: "El teléfono es obligatorio" })
    .trim()
    .min(6, "Teléfono inválido"),
  email: z.string().email("Email inválido").trim().optional().or(z.literal("")),
  patente: z
    .string({ required_error: "La patente es obligatoria" })
    .trim()
    .toUpperCase()
    .regex(regexPatente, "Formato de patente inválido (AAA123 o AA123BB)"),
  marca: z.string().trim().min(2, "La marca es requerida"),
  modelo: z.string().trim().min(1, "El modelo es requerido"),
  anio: z.number().int().min(1950).max(2030).optional(),
  kilometraje: z.number().int().nonnegative().default(0),
});

module.exports = { crearClienteVehiculoSchema };
