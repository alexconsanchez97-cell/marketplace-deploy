// Mismo patrón que userRepositoryPort: contrato para las operaciones sobre
// productos, sin saber todavía que por debajo hay PostgreSQL.

class ProductoRepositoryPort {
  async guardar(producto) {
    throw new Error("Método 'guardar' no implementado");
  }
  async buscarPorId(id) {
    throw new Error("Método 'buscarPorId' no implementado");
  }
  async obtenerTodos() {
    throw new Error("Método 'obtenerTodos' no implementado");
  }
  // Solo los ya aprobados: lo que ve el catálogo público (rol cliente)
  async obtenerActivos() {
    throw new Error("Método 'obtenerActivos' no implementado");
  }
  // Los que el super todavía tiene que revisar
  async obtenerPendientes() {
    throw new Error("Método 'obtenerPendientes' no implementado");
  }
  // Para que un proveedor vea SOLO sus propios productos.
  async obtenerPorProveedor(proveedorId) {
    throw new Error("Método 'obtenerPorProveedor' no implementado");
  }
  async actualizar(producto) {
    throw new Error("Método 'actualizar' no implementado");
  }
  async eliminar(id) {
    throw new Error("Método 'eliminar' no implementado");
  }
}

module.exports = ProductoRepositoryPort;