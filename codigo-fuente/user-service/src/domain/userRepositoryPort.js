// Contrato: qué operaciones necesita el sistema sobre usuarios, sin decir
// cómo se implementan (eso lo hace el adaptador de infrastructure).

class UserRepositoryPort {
  async guardar(usuario) {
    throw new Error("Método 'guardar' no implementado");
  }
  async buscarPorId(id) {
    throw new Error("Método 'buscarPorId' no implementado");
  }
  async buscarPorEmail(email) {
    throw new Error("Método 'buscarPorEmail' no implementado");
  }
  async obtenerTodos() {
    throw new Error("Método 'obtenerTodos' no implementado");
  }
  // Nuevo: para la pantalla del super donde ve a quién le falta aprobar.
  async obtenerPendientes() {
    throw new Error("Método 'obtenerPendientes' no implementado");
  }
  async actualizar(usuario) {
    throw new Error("Método 'actualizar' no implementado");
  }
  async eliminar(id) {
    throw new Error("Método 'eliminar' no implementado");
  }
}

module.exports = UserRepositoryPort;