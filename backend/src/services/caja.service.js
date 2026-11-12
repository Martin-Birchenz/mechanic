const cajaRepository = require("../repositories/caja.repository");

class CajaService {
  async obtenerResumenDiario(tallerId, fechaFiltro) {
    const fecha = fechaFiltro || new Date().toISOString().split("T")[0];

    const [totalesMetodo, transacciones] = await Promise.all([
      cajaRepository.findBalanceDiario(tallerId, fecha),
      cajaRepository.findTransaccionesDelDia(tallerId, fecha),
    ]);

    const totalCobrado = totalesMetodo.reduce(
      (acc, row) => acc + Number(row.subtotal),
      0,
    );

    return {
      fecha,
      total_cobrado: Number(totalCobrado.toFixed(2)),
      desglose_metodos: totalesMetodo.map((m) => ({
        metodo_pago: m.metodo_pago,
        cantidad_transacciones: m.cantidad_transacciones,
        subtotal: Number(m.subtotal),
      })),
      transacciones,
    };
  }

  async obtenerSaldosPendientes(tallerId) {
    const pendientes = await cajaRepository.findCuentasPorCobrar(tallerId);
    const totalDeudaGlobal = pendientes.reduce(
      (acc, row) => acc + Number(row.saldo_pendiente),
      0,
    );

    return {
      total_deuda_global: Number(totalDeudaGlobal.toFixed(2)),
      cantidad_ordenes_pendientes: pendientes.length,
      ordenes: pendientes,
    };
  }
}

module.exports = new CajaService();
