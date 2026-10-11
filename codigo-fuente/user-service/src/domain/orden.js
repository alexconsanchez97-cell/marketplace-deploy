// DOMINIO: Orden (pedido). Solo reglas del negocio, sin ningún require().

const ESTADOS_VALIDOS = ["pendiente_pago", "pagada", "cancelada"]; // únicos estados permitidos

class Orden { // "plantilla" para crear órdenes
  constructor(id, clienteId, items, estado = "pendiente_pago", creadoEn = null) { // estado y fecha tienen valor por defecto
    if (!clienteId) { // si no viene el cliente...
      throw new Error("La orden debe pertenecer a un cliente"); // ...detenemos todo con un error
    }
    if (!Array.isArray(items) || items.length === 0) { // si no hay productos...
      throw new Error("La orden debe tener al menos un producto"); // ...no hay nada que vender
    }
    if (!ESTADOS_VALIDOS.includes(estado)) { // si el estado no está en la lista...
      throw new Error(`Estado de orden inválido: ${estado}`); // ...lo rechazamos
    }

    this.id = id; // null si es nueva; la base de datos le pone el número
    this.clienteId = clienteId; // quién compró
    this.estado = estado; // nace "pendiente_pago"
    this.creadoEn = creadoEn; // fecha (la pone PostgreSQL)

    this.items = items.map((item) => { // .map recorre cada producto y devuelve uno revisado
      const cantidad = Number(item.cantidad); // convertimos a número por si llegó como texto
      const precio = Number(item.precioUnitario); // pg regresa los NUMERIC como texto
      if (!Number.isInteger(cantidad) || cantidad < 1) { // debe ser entera y mínimo 1
        throw new Error(`Cantidad inválida para "${item.nombreProducto}"`);
      }
      if (isNaN(precio) || precio <= 0) { // el precio debe ser un número positivo
        throw new Error(`Precio inválido para "${item.nombreProducto}"`);
      }
      return { // regresamos el producto ya limpio
        productoId: item.productoId, // id en la tabla productos
        nombreProducto: item.nombreProducto, // nombre al momento de comprar
        precioUnitario: precio, // precio como número
        cantidad, // atajo: igual que cantidad: cantidad
        subtotal: Math.round(precio * cantidad * 100) / 100, // precio x cantidad, a 2 decimales
      };
    });

    const suma = this.items.reduce((acumulado, item) => acumulado + item.subtotal, 0); // .reduce suma todos los subtotales empezando en 0
    this.total = Math.round(suma * 100) / 100; // redondeo para evitar 0.30000000000000004
  }

  referenciaDePago() { // texto para el concepto de la transferencia
    return `ORD-${String(this.id).padStart(6, "0")}`; // id 7 -> "ORD-000007" (rellena con ceros)
  }

  marcarComoPagada() { // regla para el futuro: cuando el admin confirme el depósito
    if (this.estado !== "pendiente_pago") { // solo se paga lo que estaba pendiente
      throw new Error("Solo se puede marcar como pagada una orden pendiente de pago");
    }
    this.estado = "pagada"; // cambiamos el estado
  }
}

module.exports = Orden; // exportamos la clase