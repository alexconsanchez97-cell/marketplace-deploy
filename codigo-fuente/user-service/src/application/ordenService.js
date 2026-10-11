// APLICACIÓN: caso de uso "crear orden". No tiene require de pg ni de Nodemailer:
// recibe los puertos ya conectados desde server.js (inyección de dependencias).

const Orden = require("../domain/orden"); // solo dependemos del dominio

function crearOrdenService({ ordenRepository, productoRepository, userRepository, emailService, adminEmail }) { // recibe los puertos
  async function crearOrden(usuarioToken, itemsSolicitados) { // usuarioToken viene del token; items del carrito
    if (!Array.isArray(itemsSolicitados) || itemsSolicitados.length === 0) { // carrito vacío
      throw new Error("El carrito está vacío");
    }

    const cantidadesPorProducto = new Map(); // junta cantidades si el mismo producto viene repetido
    for (const item of itemsSolicitados) { // recorremos el carrito
      const id = Number(item.productoId); // id como número
      if (!id) throw new Error("Producto inválido en el carrito"); // id vacío
      cantidadesPorProducto.set(id, (cantidadesPorProducto.get(id) || 0) + Number(item.cantidad)); // suma cantidades
    }

    const items = []; // productos verificados
    for (const [productoId, cantidad] of cantidadesPorProducto) { // por cada producto...
      const producto = await productoRepository.buscarPorId(productoId); // ...lo buscamos en la BD (el precio real sale de aquí)
      if (!producto || producto.estado !== "activo") { // si no existe o no está aprobado
        throw new Error(`El producto ${productoId} no está disponible`);
      }
      items.push({ productoId: producto.id, nombreProducto: producto.nombre, precioUnitario: producto.precio, cantidad }); // datos reales
    }

    const orden = new Orden(null, usuarioToken.id, items); // nace "pendiente_pago"; el dominio calcula el total
    const ordenGuardada = await ordenRepository.guardar(orden); // puerto de BD
    const cliente = await userRepository.buscarPorId(usuarioToken.id); // necesitamos su email

    let correosAdmin = adminEmail ? [adminEmail] : []; // ADMIN_EMAIL del .env
    if (correosAdmin.length === 0) { // si no hay, avisamos a todos los admin
      const todos = await userRepository.obtenerTodos();
      correosAdmin = todos.filter((u) => u.rol === "admin").map((u) => u.email);
    }

    const envios = await Promise.allSettled([ // manda todos los correos aunque alguno falle
      emailService.enviarComprobanteCliente(ordenGuardada, cliente), // al cliente
      ...correosAdmin.map((correo) => emailService.notificarNuevaOrdenAdmin(ordenGuardada, cliente, correo)), // a cada admin
    ]);
    envios.filter((e) => e.status === "rejected") // los que fallaron...
      .forEach((e) => console.error("⚠️ No se pudo enviar un correo:", e.reason.message)); // ...solo se anotan; la orden ya quedó guardada

    return {
      orden: ordenGuardada, // la orden completa
      referencia: ordenGuardada.referenciaDePago(), // ej. "ORD-000007"
      correoEnviado: envios[0].status === "fulfilled", // true si salió el correo del cliente
    };
  }

  async function listarMisOrdenes(clienteId) { // historial del cliente
    return ordenRepository.obtenerPorCliente(clienteId);
  }

  return { crearOrden, listarMisOrdenes }; // los 2 casos de uso
}

module.exports = crearOrdenService;