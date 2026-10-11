// Traduce HTTP <-> userService. Nada de SQL

const userService = require("../application/userService");

const registrarUsuario = async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ msg: "Faltan datos" });
  }

  try {
    const usuario = await userService.registrarUsuario(nombre, email, password);
    res.status(201).json({ msg: "Registrado. Espera a que el administrador apruebe tu cuenta.", usuario });
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: error.message });
  }
};

const iniciarSesion = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Faltan datos" });
  }

  try {
    const resultado = await userService.iniciarSesion(email, password);
    res.status(200).json(resultado); // { token, usuario }
  } catch (error) {
    console.error(error);
    res.status(401).json({ msg: error.message });
  }
};

// Solo el admin puede ver esta lista (protegido con permitirRoles("admin") en server.js)
const listarPendientes = async (req, res) => {
  try {
    const usuarios = await userService.listarPendientes();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener usuarios pendientes" });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await userService.listarUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener usuarios" });
  }
};

// PUT /api/usuarios/:id/aprobar   body: { rol: "proveedor" | "cliente" }
const aprobarUsuario = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!rol) {
    return res.status(400).json({ msg: "Debes indicar el rol a asignar (cliente o proveedor)" });
  }

  try {
    const usuario = await userService.aprobarUsuario(id, rol);
    res.status(200).json(usuario);
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: error.message });
  }
};

const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await userService.eliminarUsuario(id);
    res.status(200).json({ msg: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    const codigo = error.message === "Usuario no encontrado" ? 404 : 400;
    res.status(codigo).json({ msg: error.message });
  }
};

module.exports = {
  registrarUsuario,
  iniciarSesion,
  listarPendientes,
  listarUsuarios,
  aprobarUsuario,
  eliminarUsuario,
};