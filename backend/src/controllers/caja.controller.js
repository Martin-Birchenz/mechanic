const cajaService = require("../services/caja.service");

class CajaController {
  async obtenerCierreDiario(req, res, next) {
    try {
      const { fecha } = req.query;
      const data = await cajaService.obtenerResumenDiario(req.tallerId, fecha);
      return res.status(200).json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }

  async obtenerCuentasPorCobrar(req, res, next) {
    try {
      const data = await cajaService.obtenerSaldosPendientes(req.tallerId);
      return res.status(200).json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CajaController();
