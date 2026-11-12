const errorHandler = (err, req, res, next) => {
  console.error(">>> Error capturado en errorHandler:", err);

  // Error de validación Zod
  if (err.name === "ZodError" || err.issues) {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      status: "error",
      message: issues.map((e) => e.message).join(", ") || "Datos inválidos",
    });
  }

  // Clave foránea que no existe (ej: vehículo_id inexistente)
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(404).json({
      status: "error",
      message:
        "El vehículo indicado no existe en la base de datos. Verificá la solapa Clientes y Fichas.",
    });
  }

  // Clave única duplicada (ej: patente duplicada)
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      status: "error",
      message:
        "Ya existe un registro con esos datos clave (ej: patente o email ya registrado).",
    });
  }

  const statusCode =
    err.statusCode ||
    (err.status >= 400 && err.status < 600 ? err.status : 500);
  return res.status(statusCode).json({
    status: "error",
    message: err.message || "Error interno del servidor",
  });
};

module.exports = errorHandler;
