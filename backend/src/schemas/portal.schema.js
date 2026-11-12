const { z } = require("zod");

const consultaPublicaSchema = z.object({
  patente: z
    .string({ required_error: "La patente es obligatoria" })
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/,
      "Formato de patente inválido",
    ),
});

const webhookWhatsAppSchema = z.object({
  telefono: z.string().trim().min(8),
  mensaje: z.string().trim().min(1),
});

module.exports = { consultaPublicaSchema, webhookWhatsAppSchema };
