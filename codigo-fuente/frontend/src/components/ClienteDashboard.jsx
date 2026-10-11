import { useEffect, useState } from "react"; // useState guarda datos; useEffect corre código al cargar
import apiFetch from "../api"; // tu función que llama al backend con el token

const dinero = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n); // 1499.9 -> "$1,499.90"

function ClienteDashboard() {
  const [productos, setProductos] = useState([]); // catálogo que viene del backend
  const [carrito, setCarrito] = useState([]); // [{ producto, cantidad }] lo que va agregando el cliente
  const [vista, setVista] = useState("catalogo"); // pantalla visible: "catalogo" | "checkout" | "confirmacion"
  const [enviando, setEnviando] = useState(false); // true mientras esperamos al backend (desactiva el botón)
  const [confirmacion, setConfirmacion] = useState(null); // respuesta del backend después de comprar

  useEffect(() => { // al aparecer la pantalla...
    apiFetch("/productos") // ...pedimos el catálogo
      .then((datos) => setProductos(datos)) // lo guardamos
      .catch((error) => alert(error.message)); // si falla, avisamos
  }, []); // [] = solo una vez

  const agregarAlCarrito = (producto) => {
    setCarrito((anterior) => { // trabajamos sobre el carrito anterior
      const existe = anterior.find((item) => item.producto.id === producto.id); // ¿ya estaba?
      if (existe) { // si ya estaba, le sumamos 1
        return anterior.map((item) => (item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      }
      return [...anterior, { producto, cantidad: 1 }]; // si no, lo agregamos con cantidad 1
    });
  };

  const cambiarCantidad = (productoId, nuevaCantidad) => {
    const cantidad = Number(nuevaCantidad); // lo que escribió, como número
    if (cantidad < 1) return quitarDelCarrito(productoId); // si llega a 0, lo quitamos
    setCarrito((anterior) => anterior.map((item) => (item.producto.id === productoId ? { ...item, cantidad } : item))); // cambia solo ese
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito((anterior) => anterior.filter((item) => item.producto.id !== productoId)); // deja todos menos ese
  };

  const total = carrito.reduce((suma, item) => suma + Number(item.producto.precio) * item.cantidad, 0); // total para mostrar
  const piezas = carrito.reduce((suma, item) => suma + item.cantidad, 0); // cuántas piezas lleva

  const confirmarPedido = async () => {
    setEnviando(true); // evita doble clic
    try {
      const respuesta = await apiFetch("/ordenes", { // POST /api/ordenes
        method: "POST",
        body: JSON.stringify({ // solo mandamos id y cantidad; el precio lo pone el backend
          items: carrito.map((item) => ({ productoId: item.producto.id, cantidad: item.cantidad })),
        }),
      });
      setConfirmacion(respuesta); // guardamos { referencia, orden, correoEnviado }
      setCarrito([]); // vaciamos el carrito
      setVista("confirmacion"); // pasamos a la pantalla de "gracias"
    } catch (error) {
      alert(error.message); // ej. "El producto 5 no está disponible"
    } finally {
      setEnviando(false); // reactivamos el botón
    }
  };

  // ===== PANTALLA 3: CONFIRMACIÓN =====
  if (vista === "confirmacion" && confirmacion) {
    return (
      <div>
        <h2>✅ ¡Pedido registrado!</h2>
        <p>Tu pedido <b>{confirmacion.referencia}</b> quedó como <b>Pendiente de Pago</b>.</p>
        <p>Total a pagar: <b>{dinero(confirmacion.orden.total)}</b></p>
        <p>
          {confirmacion.correoEnviado // mensaje distinto si el correo falló
            ? "Te enviamos a tu correo el desglose y los datos bancarios para pagar."
            : "Tu pedido se guardó, pero no se pudo enviar el correo."}
        </p>
        <button onClick={() => setVista("catalogo")}>Seguir comprando</button>
      </div>
    );
  }

  // ===== PANTALLA 2: CHECKOUT =====
  if (vista === "checkout") {
    return (
      <div>
        <h2>Revisa tu pedido</h2>
        <table border="1">
          <thead>
            <tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
          </thead>
          <tbody>
            {carrito.map((item) => ( // un renglón por producto
              <tr key={item.producto.id}>
                <td>{item.producto.nombre}</td>
                <td>{dinero(item.producto.precio)}</td>
                <td>
                  <input
                    type="number" // campo numérico
                    min="1" // mínimo 1
                    value={item.cantidad} // cantidad actual
                    onChange={(e) => cambiarCantidad(item.producto.id, e.target.value)} // al cambiar, actualiza
                    style={{ width: "60px" }}
                  />
                </td>
                <td>{dinero(Number(item.producto.precio) * item.cantidad)}</td>
                <td><button onClick={() => quitarDelCarrito(item.producto.id)}>Quitar</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Total: {dinero(total)}</h3>
        <p><b>Método de pago:</b> transferencia bancaria. Al confirmar, recibirás los datos por correo.</p>

        <button onClick={() => setVista("catalogo")}>← Seguir comprando</button>{" "}
        <button onClick={confirmarPedido} disabled={enviando || carrito.length === 0}>
          {enviando ? "Enviando..." : "Confirmar pedido"}
        </button>
      </div>
    );
  }

  // ===== PANTALLA 1: CATÁLOGO =====
  return (
    <div>
      <h2>Catálogo de productos</h2>

      <button onClick={() => setVista("checkout")} disabled={carrito.length === 0}>
        🛒 Ver carrito ({piezas}) — {dinero(total)}
      </button>
      <br /><br />

      <table border="1">
        <thead>
          <tr><th>Imagen</th><th>Nombre</th><th>Descripción</th><th>Precio</th><th>Comprar</th></tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td>{p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} width="80" /> : "Sin imagen"}</td>
              <td>{p.nombre}</td>
              <td>{p.descripcion}</td>
              <td>{dinero(p.precio)}</td>
              <td><button onClick={() => agregarAlCarrito(p)}>Agregar al carrito</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClienteDashboard;