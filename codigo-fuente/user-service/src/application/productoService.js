
// Reglas de negocio de productos: un proveedor solo puede editar/borrar SUS
// PROPIOS productos, nunca los de otro proveedor. El admin sí puede tocar
// cualquiera (por si necesita corregir algo).

const Producto = require("../domain/producto");
const ProductoRepositoryAdapter = require("../infrastructure/productoRepositoryAdapter");

const productoRepository = new ProductoRepositoryAdapter();

// proveedorId viene del TOKEN (req.usuario.id), nunca del body que manda el
// cliente — así nadie puede subir un producto "a nombre de" otro proveedor.
async function crearProducto(proveedorId, datos) {
  const producto = new Producto(null, datos.nombre, datos.descripcion, datos.precio, datos.imagenUrl, proveedorId);
  return productoRepository.guardar(producto);
}

// Catálogo PÚBLICO: solo lo que ya aprobó el admin. Lo usa el rol 'cliente'
// (y también el proveedor/admin si quieren ver el catálogo "real").
async function listarCatalogo() {
  return productoRepository.obtenerActivos();
}

// TODO, sin filtrar por estado -- solo lo usa el admin, para supervisar
async function listarTodosLosProductos() {
  return productoRepository.obtenerTodos();
}

// Los que están esperando aprobación -- pantalla de "pendientes" del admin
async function listarProductosPendientes() {
  return productoRepository.obtenerPendientes();
}

// El admin aprueba: el producto pasa de 'pendiente' a 'activo'
async function aprobarProducto(id) {
  const producto = await productoRepository.buscarPorId(id);
  if (!producto) {
    throw new Error("Producto no encontrado");
  }
  producto.aprobar(); // vive en domain/producto.js
  return productoRepository.actualizar(producto);
}

async function listarMisProductos(proveedorId) {
  return productoRepository.obtenerPorProveedor(proveedorId);
}

async function obtenerProducto(id) {
  const producto = await productoRepository.buscarPorId(id);
  if (!producto) {
    throw new Error("Producto no encontrado");
  }
  return producto;
}

// usuarioQueEdita = { id, rol } que viene del token
async function actualizarProducto(id, datos, usuarioQueEdita) {
  const producto = await productoRepository.buscarPorId(id);
  if (!producto) {
    throw new Error("Producto no encontrado");
  }

  // Regla de dueño: si NO es admin, solo puede editar si el producto es suyo
  const esDueño = producto.proveedorId === usuarioQueEdita.id;
  if (usuarioQueEdita.rol !== "admin" && !esDueño) {
    throw new Error("No tienes permiso para editar este producto");
  }

  producto.actualizarDatos(datos); // valida y aplica los cambios (domain)
  return productoRepository.actualizar(producto);
}

async function eliminarProducto(id, usuarioQueElimina) {
  const producto = await productoRepository.buscarPorId(id);
  if (!producto) {
    throw new Error("Producto no encontrado");
  }

  const esDueño = producto.proveedorId === usuarioQueElimina.id;
  if (usuarioQueElimina.rol !== "admin" && !esDueño) {
    throw new Error("No tienes permiso para eliminar este producto");
  }

  return productoRepository.eliminar(id);
}

module.exports = {
  crearProducto,
  listarCatalogo,
  listarTodosLosProductos,
  listarProductosPendientes,
  aprobarProducto,
  listarMisProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
};