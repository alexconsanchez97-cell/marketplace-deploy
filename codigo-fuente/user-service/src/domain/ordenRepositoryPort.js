// PUERTO DE SALIDA: contrato para guardar/consultar órdenes (no sabe que existe PostgreSQL)

class OrdenRepositoryPort { // clase molde que el adaptador hereda con extends
  async guardar(orden) { // guardar una orden con sus productos
    throw new Error("Método 'guardar' no implementado"); // si el adaptador lo olvida, avisa aquí
  }
  async buscarPorId(id) { // traer una orden por su número
    throw new Error("Método 'buscarPorId' no implementado");
  }
  async obtenerPorCliente(clienteId) { // traer las órdenes de un cliente
    throw new Error("Método 'obtenerPorCliente' no implementado");
  }
}

module.exports = OrdenRepositoryPort; // lo exportamos para el adaptador