const portalService = require("../services/portal.service");

class PortalController {
  async obtenerEstadoPublico(req, res, next) {
    try {
      const { slug, patente } = req.params;
      const data = await portalService.consultarSeguimiento(slug, patente);
      return res.status(200).json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }

  async webhookWhatsApp(req, res, next) {
    try {
      const { slug } = req.params;
      const data = await portalService.procesarMensajeWhatsApp(slug, req.body);
      return res.status(200).json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PortalController();
