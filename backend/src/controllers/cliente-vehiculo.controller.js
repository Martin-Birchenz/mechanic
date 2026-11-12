const service = require("../services/cliente-vehiculo.service");

class ClienteVehiculoController {
  async obtenerPorPatente(req, res, next) {
    try {
      const { patente } = req.params;
      const data = await service.obtenerFichaClinica(req.tallerId, patente);
      return res.status(200).json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }

  async registrar(req, res, next) {
    try {
      const data = await service.registrarIngresoInicial(
        req.tallerId,
        req.body,
      );
      return res.status(201).json({
        status: "success",
        message: "Cliente y vehículo registrados correctamente",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClienteVehiculoController();
