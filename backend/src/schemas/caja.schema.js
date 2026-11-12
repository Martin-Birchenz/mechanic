const { z } = require("zod");

const consultaCajaSchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .optional(),
});

module.exports = { consultaCajaSchema };
