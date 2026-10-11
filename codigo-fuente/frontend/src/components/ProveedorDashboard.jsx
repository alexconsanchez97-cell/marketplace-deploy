import { useEffect, useState } from "react";
import apiFetch from "../api";

function ProveedorDashboard() {
  const [productos, setProductos] = useState([]);

  // Campos del formulario (sirve tanto para crear como para editar)
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");

  // null = estamos creando uno nuevo; con un número = estamos editando ese id
  const [editandoId, setEditandoId] = useState(null);

  const cargarProductos = async () => {
    try {
      // /productos/mios -> el backend ya sabe quién eres por el token,
      // así que solo regresa TUS productos, no los de otros proveedores.
      const datos = await apiFetch("/productos/mios");
      setProductos(datos);
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setImagenUrl("");
    setEditandoId(null);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();

    const producto = { nombre, descripcion, precio, imagenUrl };

    try {
      if (editandoId === null) {
        // Crear producto nuevo
        await apiFetch("/productos", {
          method: "POST",
          body: JSON.stringify(producto),
        });
      } else {
        // Actualizar el que se está editando
        await apiFetch(`/productos/${editandoId}`, {
          method: "PUT",
          body: JSON.stringify(producto),
        });
      }

      limpiarFormulario();
      cargarProductos(); // refresca la tabla con el cambio aplicado
    } catch (error) {
      alert(error.message);
    }
  };

  // Cuando le dan clic a "Editar" en la tabla, precargamos el formulario
  // con los datos de ESE producto.
  const editarProducto = (producto) => {
    setEditandoId(producto.id);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecio(producto.precio);
    setImagenUrl(producto.imagenUrl);
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) {
      return;
    }
    try {
      await apiFetch(`/productos/${id}`, { method: "DELETE" });
      cargarProductos();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>{editandoId === null ? "Nuevo producto" : "Editar producto"}</h2>

      <form onSubmit={guardarProducto}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="URL de imagen (opcional)"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
        />
        <button type="submit">{editandoId === null ? "Crear" : "Actualizar"}</button>

        {editandoId !== null && (
          <button type="button" onClick={limpiarFormulario}>
            Cancelar
          </button>
        )}
      </form>

      <hr />

      <h2>Mis productos</h2>

      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.descripcion}</td>
              <td>${p.precio}</td>
              <td>{p.estado === "activo" ? "✅ Aprobado" : "⏳ Pendiente"}</td>
              <td>
                <button onClick={() => editarProducto(p)}>Editar</button>
                <button onClick={() => eliminarProducto(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProveedorDashboard;