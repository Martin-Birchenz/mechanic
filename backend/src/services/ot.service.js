const otRepository = require("../repositories/ot.repository");

class OTService {
  async crearOrden(tallerId, data) {
    return await otRepository.createOTTransaccional(tallerId, data);
  }

  async obtenerDetalle(tallerId, ordenId) {
    const orden = await otRepository.findById(tallerId, ordenId);
    if (!orden) {
      const error = new Error(`Orden de trabajo #${ordenId} no encontrada`);
      error.statusCode = 404;
      throw error;
    }
    return orden;
  }

  async cambiarEstado(tallerId, ordenId, nuevoEstado) {
    const orden = await otRepository.findById(tallerId, ordenId);
    if (!orden) {
      const error = new Error(`Orden de trabajo #${ordenId} no encontrada`);
      error.statusCode = 404;
      throw error;
    }

    await otRepository.updateEstado(tallerId, ordenId, nuevoEstado);

    // Trigger de WhatsApp cuando el auto queda listo
    let notificacionEnviada = false;
    if (nuevoEstado === "LISTO") {
      // Acá se conectará el Webhook/Bot de WhatsApp
      console.log(
        `[WHATSAPP AUTOMATION] Notificando a ${orden.cliente_nombre} (${orden.cliente_telefono}): Vehículo ${orden.patente} listo para retirar. Saldo pendiente: $${orden.saldo_pendiente}`,
      );
      notificacionEnviada = true;
    }

    return {
      ordenId,
      estadoAnterior: orden.estado,
      nuevoEstado,
      notificacionEnviada,
      saldoPendiente: orden.saldo_pendiente,
    };
  }

  async agregarPago(tallerId, ordenId, data) {
    const orden = await otRepository.findById(tallerId, ordenId);
    if (!orden) {
      const error = new Error(`Orden de trabajo #${ordenId} no encontrada`);
      error.statusCode = 404;
      throw error;
    }

    if (orden.saldo_pendiente <= 0) {
      const error = new Error("Esta orden ya se encuentra totalmente saldada");
      error.statusCode = 400;
      throw error;
    }

    const pagoId = await otRepository.registrarPago(tallerId, ordenId, data);
    const ordenActualizada = await otRepository.findById(tallerId, ordenId);

    return {
      pagoId,
      montoCobrado: data.monto,
      totalPagado: ordenActualizada.total_pagado,
      saldoPendiente: ordenActualizada.saldo_pendiente,
    };
  }

  async listarOrdenes(tallerId) {
    return await otRepository.findAllByTaller(tallerId);
  }
}

module.exports = new OTService();
