const { z } = require("zod");

const repuestoItemSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(2, "La descripción del repuesto es requerida"),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0").default(1),
  costo_unitario: z.number().nonnegative().default(0),
  precio_unitario: z.number().positive("El precio de venta debe ser positivo"),
});

const crearOTSchema = z.object({
  vehiculo_id: z.number().int().positive("Vehículo inválido"),
  falla_declarada: z.string().trim().min(4, "Detallá la falla reportada"),
  diagnostico_tecnico: z.string().trim().optional().nullable(),
  kilometraje_ingreso: z.number().int().nonnegative("Kilometraje inválido"),
  total_mano_obra: z.number().nonnegative().default(0),
  repuestos: z.array(repuestoItemSchema).default([]),
  pago_inicial: z
    .object({
      monto: z.number().positive("El anticipo debe ser mayor a 0"),
      metodo_pago: z
        .enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"])
        .default("EFECTIVO"),
      notas: z.string().trim().max(150).optional().nullable(),
    })
    .optional()
    .nullable(),
});

const cambiarEstadoSchema = z.object({
  estado: z.enum(
    [
      "INGRESADO",
      "EN_DIAGNOSTICO",
      "ESPERANDO_REPUESTO",
      "EN_REPARACION",
      "LISTO",
      "ENTREGADO",
    ],
    {
      errorMap: () => ({ message: "Estado de orden inválido" }),
    },
  ),
});

const registrarPagoSchema = z.object({
  monto: z.number().positive("El monto a registrar debe ser mayor a 0"),
  metodo_pago: z
    .enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"])
    .default("EFECTIVO"),
  notas: z.string().trim().max(150).optional().nullable(),
});

module.exports = {
  crearOTSchema,
  cambiarEstadoSchema,
  registrarPagoSchema,
};
