// PUERTO DE ENTRADA / CASO DE USO: AnalyticsService.
// Recibe los filtros que manda el dashboard, los valida, pide los datos
// al puerto de salida y arma las métricas finales (porcentajes, ticket promedio).
// No sabe nada de SQL ni de Express.

// Estados que existen en el dominio y cómo se muestran en el reporte
const ESTADOS = {
  pendiente_pago: "Pendiente",
  pagada: "Pagado",
  enviada: "Enviado",
  cancelada: "Cancelado",
};

const redondear = (n) => Math.round(n * 100) / 100; // deja 2 decimales

// Convierte los filtros del dashboard en un rango de fechas { desde, hasta }
// rango: "7d" | "30d" | "mes" | "personalizado"; para "personalizado" se usan desde/hasta ("2026-10-01")
function calcularRango({ rango = "30d", desde, hasta }, ahora = new Date()) {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()); // hoy a las 00:00
  const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000); // mañana a las 00:00 (el "hasta" no se incluye)

  if (rango === "7d") return { desde: new Date(manana - 7 * 864e5), hasta: manana }; // 864e5 = milisegundos de un día
  if (rango === "30d") return { desde: new Date(manana - 30 * 864e5), hasta: manana };
  if (rango === "mes") return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1), hasta: manana }; // del día 1 a hoy
  if (rango === "personalizado") {
    const inicio = new Date(`${desde}T00:00:00`); // fecha local a las 00:00
    const fin = new Date(`${hasta}T00:00:00`);
    if (isNaN(inicio) || isNaN(fin)) throw new Error("Fechas inválidas: usa el formato AAAA-MM-DD");
    if (inicio > fin) throw new Error("La fecha 'desde' no puede ser mayor que 'hasta'");
    return { desde: inicio, hasta: new Date(fin.getTime() + 864e5) }; // incluimos el día "hasta" completo
  }
  throw new Error("Rango inválido: usa 7d, 30d, mes o personalizado");
}

// "Fábrica" del servicio: recibe el puerto de salida ya conectado (inyección de dependencias)
function crearAnalyticsService({ analyticsRepository }) {
  async function ventasPorProducto(filtros) {
    const limite = Number(filtros.limite) === 5 ? 5 : 10; // solo se permite top 5 o top 10
    return analyticsRepository.obtenerVentasPorProducto(calcularRango(filtros), limite);
  }

  async function ingresos(filtros) {
    const agrupacion = filtros.agrupacion || "dia"; // dia | semana | mes
    const rango = calcularRango(filtros);
    const serie = await analyticsRepository.obtenerIngresosPorPeriodo(rango, agrupacion);
    const total = serie.reduce((suma, p) => suma + p.ingresos, 0); // suma de todos los periodos
    return { agrupacion, total: redondear(total), serie };
  }

  async function estadosPedidos(filtros) {
    const conteos = await analyticsRepository.obtenerConteoPorEstado(calcularRango(filtros));
    const total = conteos.reduce((suma, c) => suma + c.cantidad, 0); // total de pedidos del rango
    // Regresamos los 4 estados siempre (con 0 si no hay), para que la gráfica no cambie de forma
    return Object.entries(ESTADOS).map(([clave, etiqueta]) => {
      const cantidad = conteos.find((c) => c.estado === clave)?.cantidad || 0; // ?. evita error si no lo encuentra
      return { estado: clave, etiqueta, cantidad, porcentaje: total ? redondear((cantidad * 100) / total) : 0 };
    });
  }

  async function ticketPromedio(filtros) {
    const t = await analyticsRepository.obtenerTotalesGenerales(calcularRango(filtros));
    return {
      pedidos: t.pedidos,
      clientes: t.clientes,
      ingresos: redondear(t.ingresos),
      porPedido: t.pedidos ? redondear(t.ingresos / t.pedidos) : 0, // gasto medio por pedido
      porUsuario: t.clientes ? redondear(t.ingresos / t.clientes) : 0, // gasto medio por cliente
    };
  }

  // Todo junto, para que el dashboard haga una sola petición
  async function resumen(filtros) {
    const [productos, ingresosData, estados, ticket] = await Promise.all([ // corre las 4 consultas en paralelo
      ventasPorProducto(filtros),
      ingresos(filtros),
      estadosPedidos(filtros),
      ticketPromedio(filtros),
    ]);
    const { desde, hasta } = calcularRango(filtros);
    return { rango: { desde, hasta }, productos, ingresos: ingresosData, estados, ticket };
  }

  return { ventasPorProducto, ingresos, estadosPedidos, ticketPromedio, resumen };
}

module.exports = { crearAnalyticsService, calcularRango };
