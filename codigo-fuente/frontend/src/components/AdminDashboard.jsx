import { useEffect, useState } from "react";
import apiFetch from "../api";

function AdminDashboard() {
  const [pendientes, setPendientes] = useState([]); // usuarios esperando aprobación
  const [todos, setTodos] = useState([]); // lista completa de usuarios
  const [productos, setProductos] = useState([]); // TODOS los productos (cualquier estado)
  const [productosPendientes, setProductosPendientes] = useState([]); // esperando aprobación

  // Igual que rolElegido pero para productos: no necesita elegir nada,
  // solo aprobar, así que no hace falta un objeto de selección aquí.

  // Guarda qué rol eligió el admin para cada usuario pendiente, ANTES de
  // darle clic a "Aprobar". Es un objeto { idUsuario: "cliente" | "proveedor" }
  const [rolElegido, setRolElegido] = useState({});

  // --- PESTAÑAS ---
  // Guarda cuál de las 3 secciones está visible ahorita. Empieza en
  // "pendientes" porque es lo más urgente que el admin debe revisar.
  const [pestañaActiva, setPestañaActiva] = useState("pendientes");

  // Trae las 3 listas del backend. La separamos en su propia función porque
  // la usamos varias veces: al cargar la pantalla, y después de cada acción.
  const cargarDatos = async () => {
    try {
      const listaPendientes = await apiFetch("/usuarios/pendientes");
      setPendientes(listaPendientes);

      const listaTodos = await apiFetch("/usuarios");
      setTodos(listaTodos);

      // /productos/todos trae TODOS los productos sin filtrar por estado
      // (a diferencia de /productos, que solo regresa los ya aprobados
      // y es el que usa el catálogo del cliente).
      const listaProductos = await apiFetch("/productos/todos");
      setProductos(listaProductos);

      const listaProductosPendientes = await apiFetch("/productos/pendientes");
      setProductosPendientes(listaProductosPendientes);
    } catch (error) {
      alert(error.message);
    }
  };

  // El array vacío [] al final significa "ejecuta esto solo UNA vez,
  // cuando el componente aparece en pantalla por primera vez".
  useEffect(() => {
    cargarDatos();
  }, []);

  const aprobar = async (id) => {
    const rol = rolElegido[id]; // qué rol seleccionó el admin para este id

    if (!rol) {
      alert("Selecciona un rol (cliente o proveedor) antes de aprobar");
      return;
    }

    try {
      await apiFetch(`/usuarios/${id}/aprobar`, {
        method: "PUT",
        body: JSON.stringify({ rol }),
      });
      cargarDatos(); // refresca ambas listas: el usuario ya no sale en pendientes
    } catch (error) {
      alert(error.message);
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Eliminar este usuario permanentemente?")) {
      return;
    }
    try {
      await apiFetch(`/usuarios/${id}`, { method: "DELETE" });
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  // Igual que eliminarUsuario, pero para productos. El backend ya permite
  // que un admin borre CUALQUIER producto, no solo los de un proveedor
  // específico (revisa productoService.js: "usuarioQueElimina.rol !== 'admin'").
  const aprobarProducto = async (id) => {
    try {
      await apiFetch(`/productos/${id}/aprobar`, { method: "PUT" });
      cargarDatos(); // el producto sale de "pendientes" y pasa a "activo"
    } catch (error) {
      alert(error.message);
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Eliminar este producto permanentemente?")) {
      return;
    }
    try {
      await apiFetch(`/productos/${id}`, { method: "DELETE" });
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      {/* --- Botones de pestaña ---
          Cada botón cambia pestañaActiva; abajo, cada sección solo se
          dibuja si pestañaActiva coincide con su nombre. */}
      <div>
        <button
          onClick={() => setPestañaActiva("pendientes")}
          disabled={pestañaActiva === "pendientes"}
        >
          Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setPestañaActiva("usuarios")}
          disabled={pestañaActiva === "usuarios"}
        >
          Todos los usuarios ({todos.length})
        </button>
        <button
          onClick={() => setPestañaActiva("productosPendientes")}
          disabled={pestañaActiva === "productosPendientes"}
        >
          Productos pendientes ({productosPendientes.length})
        </button>
        <button
          onClick={() => setPestañaActiva("productos")}
          disabled={pestañaActiva === "productos"}
        >
          Todos los productos ({productos.length})
        </button>
      </div>

      <hr />

      {pestañaActiva === "pendientes" && (
      <div>
      <h2>Usuarios pendientes de aprobación</h2>

      {pendientes.length === 0 && <p>No hay usuarios pendientes.</p>}

      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Asignar rol</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pendientes.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>
                {/* Cuando cambia el select, guardamos la elección en el
                    objeto rolElegido, usando el id del usuario como llave */}
                <select
                  defaultValue=""
                  onChange={(e) =>
                    setRolElegido({ ...rolElegido, [u.id]: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Elegir...
                  </option>
                  <option value="cliente">Cliente</option>
                  <option value="proveedor">Proveedor</option>
                </select>
              </td>
              <td>
                <button onClick={() => aprobar(u.id)}>Aprobar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}

      {pestañaActiva === "usuarios" && (
      <div>
      <h2>Todos los usuarios</h2>

      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {todos.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.rol}</td>
              <td>{u.estado}</td>
              <td>
                <button onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}

      {pestañaActiva === "productosPendientes" && (
      <div>
      <h2>Productos pendientes de aprobación</h2>

      {productosPendientes.length === 0 && <p>No hay productos pendientes.</p>}

      <table border="1">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>ID del proveedor</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {productosPendientes.map((p) => (
            <tr key={p.id}>
              <td>
                {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} width="80" /> : "Sin imagen"}
              </td>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.descripcion}</td>
              <td>${p.precio}</td>
              <td>{p.proveedorId}</td>
              <td>
                <button onClick={() => aprobarProducto(p.id)}>Aprobar</button>
                <button onClick={() => eliminarProducto(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}

      {pestañaActiva === "productos" && (
      <div>
      <h2>Todos los productos</h2>

      {productos.length === 0 && <p>Todavía no hay productos.</p>}

      <table border="1">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>ID del proveedor</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td>
                {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} width="80" /> : "Sin imagen"}
              </td>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.descripcion}</td>
              <td>${p.precio}</td>
              <td>{p.proveedorId}</td>
              <td>{p.estado}</td>
              <td>
                <button onClick={() => eliminarProducto(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}
    </div>
  );
}

export default AdminDashboard;