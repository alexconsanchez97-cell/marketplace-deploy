const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // necesitas: npm install jsonwebtoken
const Usuario = require("../domain/user");
const UserRepositoryAdapter = require("../infrastructure/userRepositoryAdapter");

const userRepository = new UserRepositoryAdapter();

// Todo usuario nuevo nace con rol 'sin_asignar' y estado pendiente
async function registrarUsuario(nombre, email, password) {
  const existente = await userRepository.buscarPorEmail(email);
  if (existente) {
    throw new Error("Ya existe un usuario con ese email");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // new Usuario(...) sin pasar rol/estado usa los defaults del constructor:
  // 'sin_asignar' y 'pendiente' (los definimos en domain/user.js)
  const usuario = new Usuario(null, nombre, email, passwordHash);

  return userRepository.guardar(usuario);
}

// --- LOGIN ---
// Revisa email + password, y si son correctos genera un token JWT.
// El token es como un "gafete" firmado que el frontend guarda 
async function iniciarSesion(email, password) {
  const usuario = await userRepository.buscarPorEmail(email);
  if (!usuario) {
    throw new Error("Correo o contraseña incorrectos");
  }

  // bcrypt.compare revisa el password en texto plano contra el hash guardado
  const passwordCorrecto = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordCorrecto) {
    throw new Error("Correo o contraseña incorrectos");
  }

  // El "payload" es la información que va DENTRO del token (no es secreta,
  // cualquiera puede leerla, pero no puede FALSIFICARLA sin la JWT_SECRET).
  const payload = { id: usuario.id, rol: usuario.rol, estado: usuario.estado, nombre: usuario.nombre };

  
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

  return { token, usuario: payload };
}

async function listarUsuarios() {
  return userRepository.obtenerTodos();
}

// Lista de gente esperando aprobación (pantalla del super)
async function listarPendientes() {
  return userRepository.obtenerPendientes();
}

// El super llama esto para convertir a un 'sin_asignar' en 'cliente' o 'proveedor'.
async function aprobarUsuario(id, rolAsignado) {
  const usuario = await userRepository.buscarPorId(id);
  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  
  usuario.aprobar(rolAsignado);

  return userRepository.actualizar(usuario);
}

async function obtenerUsuarioPorId(id) {
  const usuario = await userRepository.buscarPorId(id);
  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }
  return usuario;
}

async function eliminarUsuario(id) {
  const usuario = await userRepository.buscarPorId(id);
  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }
  return userRepository.eliminar(id);
}

module.exports = {
  registrarUsuario,
  iniciarSesion,
  listarUsuarios,
  listarPendientes,
  aprobarUsuario,
  obtenerUsuarioPorId,
  eliminarUsuario,
};