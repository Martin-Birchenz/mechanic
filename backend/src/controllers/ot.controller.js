const otService = require("../services/ot.service");

class OTController {
  async crear(req, res, next) {
    try {
      const result = await otService.crearOrden(req.tallerId, req.body);
      return res.status(201).json({
        status: "success",
        message: `Orden de trabajo #${result.ordenId} generada exitosamente`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const data = await otService.obtenerDetalle(req.tallerId, Number(id));
      return res.status(200).json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const result = await otService.cambiarEstado(
        req.tallerId,
        Number(id),
        estado,
      );
      return res.status(200).json({
        status: "success",
        message: `Estado actualizado a ${estado}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async registrarCobro(req, res, next) {
    try {
      const { id } = req.params;
      const result = await otService.agregarPago(
        req.tallerId,
        Number(id),
        req.body,
      );
      return res.status(201).json({
        status: "success",
        message: "Cobro registrado correctamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listar(req, res, next) {
    try {
      const data = await otService.listarOrdenes(req.tallerId);
      return res.status(200).json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OTController();
