// PLANTILLAS DE CORREO: funciones que reciben datos y regresan { asunto, html, texto }

function formatearDinero(cantidad) { // 1499.9 -> "$1,499.90"
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(cantidad); // Intl viene incluido en JavaScript
}

function escaparHtml(texto) { // evita que un nombre con <etiquetas> rompa el correo
  return String(texto) // nos aseguramos de que sea texto
    .replace(/&/g, "&amp;") // & -> &amp;
    .replace(/</g, "&lt;") // < -> &lt; (ya no puede abrir una etiqueta)
    .replace(/>/g, "&gt;") // > -> &gt;
    .replace(/"/g, "&quot;"); // " -> &quot;
}

function tablaDeProductos(orden) { // tabla HTML con productos y total (la usan los 2 correos)
  const filas = orden.items // recorremos los productos...
    .map((item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${escaparHtml(item.nombreProducto)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.cantidad}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatearDinero(item.precioUnitario)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatearDinero(item.subtotal)}</td>
        </tr>`) // ...y cada uno se vuelve un renglón <tr>
    .join(""); // pegamos todos los renglones en un solo texto

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f4f4f5">
          <th style="padding:8px;text-align:left">Producto</th>
          <th style="padding:8px">Cant.</th>
          <th style="padding:8px;text-align:right">Precio</th>
          <th style="padding:8px;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:8px;text-align:right"><b>Total</b></td>
          <td style="padding:8px;text-align:right"><b>${formatearDinero(orden.total)}</b></td>
        </tr>
      </tfoot>
    </table>`;
}

// Correo 1: para el CLIENTE (compra + datos bancarios). banco viene del .env
function plantillaComprobanteCliente(orden, cliente, banco) {
  const referencia = orden.referenciaDePago(); // ej. "ORD-000007"
  const asunto = `Tu pedido ${referencia} — Pendiente de pago`; // lo que se ve en la bandeja

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
    <h2 style="color:#1d4ed8">¡Gracias por tu compra, ${escaparHtml(cliente.nombre)}!</h2>
    <p>Recibimos tu pedido <b>${referencia}</b>. Su estado es <b style="color:#b45309">Pendiente de Pago</b>.</p>
    <h3>Resumen de tu compra</h3>
    ${tablaDeProductos(orden)}
    <h3>Instrucciones de pago</h3>
    <p>Transfiere o deposita <b>${formatearDinero(orden.total)}</b> a esta cuenta:</p>
    <ul>
      <li><b>Banco:</b> ${escaparHtml(banco.nombre)}</li>
      <li><b>Titular:</b> ${escaparHtml(banco.titular)}</li>
      <li><b>CLABE:</b> ${escaparHtml(banco.clabe)}</li>
      <li><b>Cuenta:</b> ${escaparHtml(banco.cuenta)}</li>
      <li><b>Concepto / referencia:</b> ${referencia}</li>
    </ul>
    <p>Tu pedido se procesará cuando confirmemos el depósito.</p>
    <p style="color:#888;font-size:12px">Correo automático, no respondas a este mensaje.</p>
  </div>`;

  const texto = `Pedido ${referencia} - Pendiente de Pago. Total: ${formatearDinero(orden.total)}. ` + // versión sin HTML
    `Paga a ${banco.nombre}, CLABE ${banco.clabe}, concepto ${referencia}.`;

  return { asunto, html, texto }; // las 3 partes del correo
}

// Correo 2: para el ADMIN (aviso de pedido nuevo)
function plantillaNuevaOrdenAdmin(orden, cliente) {
  const referencia = orden.referenciaDePago();
  const asunto = `Nuevo pedido ${referencia} de ${cliente.nombre}`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
    <h2>Llegó un pedido nuevo</h2>
    <p><b>Pedido:</b> ${referencia}<br/>
       <b>Cliente:</b> ${escaparHtml(cliente.nombre)} (${escaparHtml(cliente.email)})<br/>
       <b>Estado:</b> Pendiente de Pago<br/>
       <b>Total:</b> ${formatearDinero(orden.total)}</p>
    ${tablaDeProductos(orden)}
  </div>`;

  const texto = `Nuevo pedido ${referencia} de ${cliente.nombre}. Total: ${formatearDinero(orden.total)}.`;

  return { asunto, html, texto };
}

module.exports = { plantillaComprobanteCliente, plantillaNuevaOrdenAdmin }; // exportamos las 2 plantillas