const repository = require("../repositories/cliente-vehiculo.repository");

class ClienteVehiculoService {
  async obtenerFichaClinica(tallerId, patente) {
    const vehiculo = await repository.findByPatente(
      tallerId,
      patente.toUpperCase(),
    );
    if (!vehiculo) {
      const error = new Error(
        `No se encontró ningún vehículo con la patente ${patente}`,
      );
      error.statusCode = 404;
      throw error;
    }

    const historial = await repository.findHistorialByVehiculoId(
      tallerId,
      vehiculo.vehiculo_id,
    );
    return { vehiculo, historial };
  }

  async registrarIngresoInicial(tallerId, data) {
    const existe = await repository.findByPatente(tallerId, data.patente);
    if (existe) {
      const error = new Error(
        `El vehículo con patente ${data.patente} ya está registrado`,
      );
      error.statusCode = 409;
      throw error;
    }
    return await repository.createClienteVehiculoTransaccional(tallerId, data);
  }
}

module.exports = new ClienteVehiculoService();
