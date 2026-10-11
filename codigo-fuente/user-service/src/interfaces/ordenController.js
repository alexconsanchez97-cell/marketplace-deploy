// ADAPTADOR DE ENTRADA (HTTP): traduce peticiones <-> ordenService

function crearOrdenController(ordenService) { // recibe el servicio ya armado
  const crearOrden = async (req, res) => { // POST /api/ordenes  body: { items: [{ productoId, cantidad }] }
    try {
      const resultado = await ordenService.crearOrden(req.usuario, req.body.items); // req.usuario viene del token
      res.status(201).json({ msg: "Pedido registrado. Revisa tu correo.", ...resultado }); // 201 = creado
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message }); // 400 = datos inválidos
    }
  };

  const listarMisOrdenes = async (req, res) => { // GET /api/ordenes/mias
    try {
      res.status(200).json(await ordenService.listarMisOrdenes(req.usuario.id)); // solo las del usuario del token
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Error al obtener tus pedidos" });
    }
  };

  return { crearOrden, listarMisOrdenes };
}

module.exports = crearOrdenController;