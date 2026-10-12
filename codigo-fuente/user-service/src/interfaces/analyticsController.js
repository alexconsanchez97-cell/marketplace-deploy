// ADAPTADOR DE ENTRADA (HTTP) para los reportes.
// Lee los filtros de la URL (req.query) y responde JSON. Nada de SQL aquí.

function crearAnalyticsController(analyticsService) {
  // Envuelve cada caso de uso con el mismo manejo de errores
  const responder = (casoDeUso) => async (req, res) => {
    try {
      // req.query trae lo que va después del ? en la URL, ej. /api/reportes/ingresos?rango=7d&agrupacion=dia
      res.status(200).json(await analyticsService[casoDeUso](req.query));
    } catch (error) {
      console.error(error);
      const esDeFiltro = /inválid|no puede/.test(error.message); // errores de validación de filtros
      res.status(esDeFiltro ? 400 : 500).json({ msg: esDeFiltro ? error.message : "Error al generar el reporte" });
    }
  };

  return {
    resumen: responder("resumen"), // GET /api/reportes/resumen
    ventasPorProducto: responder("ventasPorProducto"), // GET /api/reportes/productos
    ingresos: responder("ingresos"), // GET /api/reportes/ingresos
    estadosPedidos: responder("estadosPedidos"), // GET /api/reportes/estados
    ticketPromedio: responder("ticketPromedio"), // GET /api/reportes/ticket-promedio
  };
}

module.exports = crearAnalyticsController;
