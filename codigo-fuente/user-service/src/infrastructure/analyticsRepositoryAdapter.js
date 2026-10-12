// ADAPTADOR DE SALIDA: implementa AnalyticsRepositoryPort con PostgreSQL.
// Toda la agregación (SUM, COUNT, AVG, GROUP BY) se hace en la base de datos,
// así Node.js recibe solo los resultados y no miles de filas.

const pool = require("./db"); // la conexión a PostgreSQL que ya tenías
const AnalyticsRepositoryPort = require("../domain/analyticsRepositoryPort"); // el contrato que cumplimos

// Solo estos valores pueden ir dentro de date_trunc (protege contra inyección SQL)
const AGRUPACIONES = { dia: "day", semana: "week", mes: "month" }; // nombre en español -> nombre que entiende PostgreSQL

// Los pedidos cancelados no cuentan como venta
const SOLO_VENTAS = "o.estado <> 'cancelada'"; // <> significa "distinto de"

class AnalyticsRepositoryAdapter extends AnalyticsRepositoryPort { // extends = cumple el contrato del puerto
  async obtenerVentasPorProducto({ desde, hasta }, limite) {
    const resultado = await pool.query(
      `SELECT d.producto_id,
              d.nombre_producto,
              SUM(d.cantidad)                     AS unidades,  -- piezas vendidas de ese producto
              SUM(d.cantidad * d.precio_unitario) AS monto      -- dinero recaudado por ese producto
         FROM orden_detalle d
         JOIN ordenes o ON o.id = d.orden_id                    -- unimos cada renglón con su orden para filtrar por fecha y estado
        WHERE o.creado_en >= $1 AND o.creado_en < $2            -- solo pedidos dentro del rango
          AND ${SOLO_VENTAS}
        GROUP BY d.producto_id, d.nombre_producto               -- una fila por producto
        ORDER BY unidades DESC, monto DESC                      -- los más vendidos primero
        LIMIT $3`,                                              // top 5 o top 10
      [desde, hasta, limite] // $1, $2, $3 (parámetros: evitan inyección SQL)
    );
    return resultado.rows.map((f) => ({ // convertimos cada fila a un objeto limpio
      productoId: f.producto_id,
      nombre: f.nombre_producto,
      unidades: Number(f.unidades), // SUM regresa texto en pg; lo pasamos a número
      monto: Number(f.monto),
    }));
  }

  async obtenerIngresosPorPeriodo({ desde, hasta }, agrupacion) {
    const unidad = AGRUPACIONES[agrupacion]; // "day", "week" o "month"
    if (!unidad) throw new Error("Agrupación inválida"); // cualquier otro valor se rechaza
    const resultado = await pool.query(
      `SELECT to_char(date_trunc('${unidad}', o.creado_en), 'YYYY-MM-DD') AS periodo, -- recorta al inicio del día/semana/mes y lo pasa a texto
              SUM(o.total)                       AS ingresos,  -- dinero de ese periodo
              COUNT(*)                           AS pedidos    -- cuántos pedidos hubo
         FROM ordenes o
        WHERE o.creado_en >= $1 AND o.creado_en < $2
          AND ${SOLO_VENTAS}
        GROUP BY periodo                                       -- una fila por periodo
        ORDER BY periodo`,                                     // del más viejo al más nuevo (para la gráfica)
      [desde, hasta]
    );
    return resultado.rows.map((f) => ({
      periodo: f.periodo, // fecha como "2026-10-11"
      ingresos: Number(f.ingresos),
      pedidos: Number(f.pedidos),
    }));
  }

  async obtenerConteoPorEstado({ desde, hasta }) {
    const resultado = await pool.query(
      `SELECT o.estado, COUNT(*) AS cantidad   -- cuántos pedidos hay en cada estado
         FROM ordenes o
        WHERE o.creado_en >= $1 AND o.creado_en < $2
        GROUP BY o.estado`,                    // aquí SÍ incluimos cancelados
      [desde, hasta]
    );
    return resultado.rows.map((f) => ({ estado: f.estado, cantidad: Number(f.cantidad) }));
  }

  async obtenerTotalesGenerales({ desde, hasta }) {
    const resultado = await pool.query(
      `SELECT COUNT(*)                     AS pedidos,   -- pedidos vendidos
              COALESCE(SUM(o.total), 0)    AS ingresos,  -- COALESCE: si no hay pedidos, regresa 0 en vez de NULL
              COUNT(DISTINCT o.cliente_id) AS clientes   -- clientes distintos que compraron
         FROM ordenes o
        WHERE o.creado_en >= $1 AND o.creado_en < $2
          AND ${SOLO_VENTAS}`,
      [desde, hasta]
    );
    const f = resultado.rows[0]; // siempre regresa una sola fila
    return { pedidos: Number(f.pedidos), ingresos: Number(f.ingresos), clientes: Number(f.clientes) };
  }
}

module.exports = AnalyticsRepositoryAdapter; // lo exportamos para conectarlo en server.js
