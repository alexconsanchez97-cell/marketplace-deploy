// ADAPTADOR DE SALIDA: guarda órdenes en PostgreSQL (cumple el contrato de ordenRepositoryPort)

const pool = require("./db"); // la conexión a PostgreSQL que ya tenías
const OrdenRepositoryPort = require("../domain/ordenRepositoryPort"); // el contrato a cumplir
const Orden = require("../domain/orden"); // la clase del dominio

class OrdenRepositoryAdapter extends OrdenRepositoryPort { // extends = hereda el contrato y lo implementa
  // Convierte filas de la BD (snake_case) en un objeto Orden (camelCase)
  _filasAOrden(filaOrden, filasDetalle) {
    if (!filaOrden) return null; // si no se encontró, regresamos null
    const items = filasDetalle.map((d) => ({ // cada renglón de orden_detalle se vuelve un item
      productoId: d.producto_id, // columna producto_id -> propiedad productoId
      nombreProducto: d.nombre_producto,
      precioUnitario: d.precio_unitario,
      cantidad: d.cantidad,
    }));
    return new Orden(filaOrden.id, filaOrden.cliente_id, items, filaOrden.estado, filaOrden.creado_en); // armamos la Orden
  }

  async guardar(orden) {
    // TRANSACCIÓN: o se guarda la orden con TODOS sus productos, o no se guarda nada
    const cliente = await pool.connect(); // conexión exclusiva (necesaria para transacciones)
    try {
      await cliente.query("BEGIN"); // inicia la transacción

      const resOrden = await cliente.query( // insertamos la orden principal
        `INSERT INTO ordenes (cliente_id, total, estado)
         VALUES ($1, $2, $3)
         RETURNING *;`, // RETURNING * regresa la fila creada con su id y fecha
        [orden.clienteId, orden.total, orden.estado] // $1, $2, $3 se reemplazan por estos (evita inyección SQL)
      );
      const filaOrden = resOrden.rows[0]; // la orden recién creada

      const filasDetalle = []; // aquí juntamos los renglones guardados
      for (const item of orden.items) { // por cada producto de la orden...
        const resDetalle = await cliente.query( // ...insertamos un renglón
          `INSERT INTO orden_detalle (orden_id, producto_id, nombre_producto, precio_unitario, cantidad)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *;`,
          [filaOrden.id, item.productoId, item.nombreProducto, item.precioUnitario, item.cantidad]
        );
        filasDetalle.push(resDetalle.rows[0]); // lo guardamos en el arreglo
      }

      await cliente.query("COMMIT"); // todo bien: confirmamos los cambios
      return this._filasAOrden(filaOrden, filasDetalle); // regresamos la Orden ya con id
    } catch (error) {
      await cliente.query("ROLLBACK"); // algo falló: deshacemos TODO
      throw error; // y avisamos del error hacia arriba
    } finally {
      cliente.release(); // pase lo que pase, devolvemos la conexión
    }
  }

  async buscarPorId(id) {
    const resOrden = await pool.query("SELECT * FROM ordenes WHERE id = $1", [id]); // la orden
    if (resOrden.rows.length === 0) return null; // no existe
    const resDetalle = await pool.query("SELECT * FROM orden_detalle WHERE orden_id = $1 ORDER BY id", [id]); // sus productos
    return this._filasAOrden(resOrden.rows[0], resDetalle.rows); // armamos la Orden
  }

  async obtenerPorCliente(clienteId) {
    const resOrdenes = await pool.query("SELECT * FROM ordenes WHERE cliente_id = $1 ORDER BY id DESC", [clienteId]); // la más nueva primero
    const ordenes = []; // aquí juntamos las órdenes completas
    for (const fila of resOrdenes.rows) { // por cada orden...
      const resDetalle = await pool.query("SELECT * FROM orden_detalle WHERE orden_id = $1 ORDER BY id", [fila.id]); // ...sus productos
      ordenes.push(this._filasAOrden(fila, resDetalle.rows)); // la agregamos ya armada
    }
    return ordenes; // arreglo de Orden
  }
}

module.exports = OrdenRepositoryAdapter; // lo exportamos para server.js