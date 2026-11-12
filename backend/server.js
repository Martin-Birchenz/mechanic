require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log("Conectado exitosamente a la base de datos de Talleres.");
    connection.release();

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error al conectar con MySQL:", error.message);
    process.exit(1);
  }
}

startServer();
