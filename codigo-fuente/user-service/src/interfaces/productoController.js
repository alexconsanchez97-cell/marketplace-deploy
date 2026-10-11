const productoService = require("../application/productoService");

// Solo proveedores activos llegan aquí (protegido en server.js).
// req.usuario.id viene del token, NO del body — así el proveedor no puede
// mentir sobre quién es el dueño del producto.
const crearProducto = async (req, res) => {
  try {
    const producto = await productoService.crearProducto(req.usuario.id, req.body);
    res.status(201).json(producto);
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: error.message });
  }
};

// Catálogo público (solo aprobados): lo usan clientes, proveedores y admin
const listarCatalogo = async (req, res) => {
  try {
    const productos = await productoService.listarCatalogo();
    res.status(200).json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener productos" });
  }
};

// TODO sin filtrar -- solo admin
const listarTodosLosProductos = async (req, res) => {
  try {
    const productos = await productoService.listarTodosLosProductos();
    res.status(200).json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener productos" });
  }
};

// Pendientes de aprobación -- solo admin
const listarProductosPendientes = async (req, res) => {
  try {
    const productos = await productoService.listarProductosPendientes();
    res.status(200).json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener productos pendientes" });
  }
};

// PUT /api/productos/:id/aprobar -- solo admin
const aprobarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const producto = await productoService.aprobarProducto(id);
    res.status(200).json(producto);
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: error.message });
  }
};

// el proveedor ve solo lo que él subió
const listarMisProductos = async (req, res) => {
  try {
    const productos = await productoService.listarMisProductos(req.usuario.id);
    res.status(200).json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener tus productos" });
  }
};

const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    // req.usuario = { id, rol } viene del token, se usa para revisar dueño
    const producto = await productoService.actualizarProducto(id, req.body, req.usuario);
    res.status(200).json(producto);
  } catch (error) {
    console.error(error);
    const codigo = error.message.includes("permiso") ? 403 : 400;
    res.status(codigo).json({ msg: error.message });
  }
};

const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    await productoService.eliminarProducto(id, req.usuario);
    res.status(200).json({ msg: "Producto eliminado correctamente" });
  } catch (error) {
    console.error(error);
    const codigo = error.message.includes("permiso") ? 403 : 400;
    res.status(codigo).json({ msg: error.message });
  }
};

module.exports = {
  crearProducto,
  listarCatalogo,
  listarTodosLosProductos,
  listarProductosPendientes,
  aprobarProducto,
  listarMisProductos,
  actualizarProducto,
  eliminarProducto,
};