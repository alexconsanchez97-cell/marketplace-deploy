// Mismo patrón que el de usuarios, ahora para la tabla "productos".

const pool = require("./db");
const ProductoRepositoryPort = require("../domain/productoRepositoryPort");
const Producto = require("../domain/producto");

class ProductoRepositoryAdapter extends ProductoRepositoryPort {
  _filaAProducto(fila) {
    if (!fila) return null;
    return new Producto(fila.id, fila.nombre, fila.descripcion, fila.precio, fila.imagen_url, fila.proveedor_id, fila.estado);
  }

  async guardar(producto) {
    // guardamos "estado" (nace en 'pendiente', del constructor de Producto)
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, imagen_url, proveedor_id, estado)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const valores = [producto.nombre, producto.descripcion, producto.precio, producto.imagenUrl, producto.proveedorId, producto.estado];
    const resultado = await pool.query(query, valores);
    return this._filaAProducto(resultado.rows[0]);
  }

  async buscarPorId(id) {
    const resultado = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);
    return this._filaAProducto(resultado.rows[0]);
  }

  // TODOS los productos, sin importar su estado -- lo usa el admin
  async obtenerTodos() {
    const resultado = await pool.query("SELECT * FROM productos ORDER BY id");
    return resultado.rows.map((fila) => this._filaAProducto(fila));
  }

  // Solo los aprobados -- lo usa el catálogo del cliente
  async obtenerActivos() {
    const resultado = await pool.query("SELECT * FROM productos WHERE estado = 'activo' ORDER BY id");
    return resultado.rows.map((fila) => this._filaAProducto(fila));
  }

  // Esperando revisión del admin
  async obtenerPendientes() {
    const resultado = await pool.query("SELECT * FROM productos WHERE estado = 'pendiente' ORDER BY id");
    return resultado.rows.map((fila) => this._filaAProducto(fila));
  }

  async obtenerPorProveedor(proveedorId) {
    const resultado = await pool.query("SELECT * FROM productos WHERE proveedor_id = $1 ORDER BY id", [proveedorId]);
    return resultado.rows.map((fila) => this._filaAProducto(fila));
  }

  async actualizar(producto) {
    // Se agrega "estado" al UPDATE para que aprobarProducto() pueda
    // guardar el cambio de 'pendiente' a 'activo'.
    const query = `
      UPDATE productos
      SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4, estado = $5
      WHERE id = $6
      RETURNING *;
    `;
    const valores = [producto.nombre, producto.descripcion, producto.precio, producto.imagenUrl, producto.estado, producto.id];
    const resultado = await pool.query(query, valores);
    return this._filaAProducto(resultado.rows[0]);
  }

  async eliminar(id) {
    const resultado = await pool.query("DELETE FROM productos WHERE id = $1", [id]);
    return resultado.rowCount > 0;
  }
}

module.exports = ProductoRepositoryAdapter;