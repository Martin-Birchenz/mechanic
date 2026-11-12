const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");

const authRoutes = require("./routes/auth.routes.js");
const clienteVehiculoRoutes = require("./routes/cliente-vehiculo.routes");
const otRoutes = require("./routes/ot.routes");
const cajaRoutes = require("./routes/caja.routes");
const portalRoutes = require("./routes/portal.routes");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint de verificación
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "success", message: "Taller SaaS API en línea" });
});

// Manejador central de errores
app.use(errorHandler);

app.use("/api/auth", authRoutes);
app.use("/api/clientes-vehiculos", clienteVehiculoRoutes);
app.use("/api/ordenes", otRoutes);
app.use("/api/caja", cajaRoutes);
app.use("/api/public", portalRoutes);

module.exports = app;
