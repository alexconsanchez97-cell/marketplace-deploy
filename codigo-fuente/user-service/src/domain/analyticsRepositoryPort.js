// PUERTO DE SALIDA: consultas analíticas (reportes).
// Es un contrato: dice QUÉ métricas se pueden pedir, no CÓMO se calculan.
// El CÓMO (SQL con SUM, COUNT, GROUP BY) lo hace analyticsRepositoryAdapter.js.
// Todos los métodos reciben un filtro { desde, hasta } con fechas (objetos Date).

class AnalyticsRepositoryPort { // clase molde que el adaptador hereda con extends
  async obtenerVentasPorProducto(filtro, limite) { // top de productos más vendidos
    throw new Error("Método 'obtenerVentasPorProducto' no implementado"); // si el adaptador no lo implementa, avisa aquí
  }

  async obtenerIngresosPorPeriodo(filtro, agrupacion) { // ingresos agrupados por día, semana o mes
    throw new Error("Método 'obtenerIngresosPorPeriodo' no implementado");
  }

  async obtenerConteoPorEstado(filtro) { // cuántos pedidos hay en cada estado
    throw new Error("Método 'obtenerConteoPorEstado' no implementado");
  }

  async obtenerTotalesGenerales(filtro) { // número de pedidos, ingresos y clientes distintos
    throw new Error("Método 'obtenerTotalesGenerales' no implementado");
  }
}

module.exports = AnalyticsRepositoryPort; // lo exportamos para que el adaptador lo herede
