// PUERTO DE SALIDA de correo ("emailserviceport").
// El núcleo solo sabe que ALGUIEN manda estos correos; no sabe que existe Nodemailer.

class EmailServicePort { // contrato para cualquier servicio de correo
  async enviarComprobanteCliente(orden, cliente) { // correo al cliente: su compra + datos bancarios
    throw new Error("Método 'enviarComprobanteCliente' no implementado"); // obliga al adaptador a escribirlo
  }
  async notificarNuevaOrdenAdmin(orden, cliente, adminEmail) { // correo al admin: llegó un pedido
    throw new Error("Método 'notificarNuevaOrdenAdmin' no implementado");
  }
}

module.exports = EmailServicePort; // lo exportamos para el adaptador