// Estos son los ÚNICOS roles válidos en el sistema. Los ponemos en un array
// para poder validar contra él en vez de escribir el mismo texto muchas veces.
const ROLES_VALIDOS = ["sin_asignar", "cliente", "proveedor", "admin"];

class Usuario {
  constructor(id, nombre, email, passwordHash, rol = "sin_asignar", estado = "pendiente") {
    if (!nombre || nombre.trim().length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }

    if (!Usuario.esEmailValido(email)) {
      throw new Error("El email no tiene un formato válido");
    }

    if (!passwordHash) {
      throw new Error("El usuario debe tener una contraseña (hash)");
    }

    // --- Validación nueva: el rol debe ser uno de los 4 permitidos ---
    if (!ROLES_VALIDOS.includes(rol)) {
      throw new Error(`Rol inválido: ${rol}`);
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.email = email.trim().toLowerCase();
    this.passwordHash = passwordHash;
    this.rol = rol; // 'sin_asignar' | 'cliente' | 'proveedor' | 'admin'
    this.estado = estado; // 'pendiente' | 'activo'
  }

  static esEmailValido(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // El super usa este método para aprobar a un usuario recién registrado.
  // Solo se puede asignar 'cliente' o 'proveedor'
  aprobar(rolAsignado) {
    if (!["cliente", "proveedor"].includes(rolAsignado)) {
      throw new Error("Solo se puede aprobar como 'cliente' o 'proveedor'");
    }
    this.rol = rolAsignado;
    this.estado = "activo";
  }

  // Métodos de conveniencia: hacen el código de otras capas más legible
  // (if (usuario.esProveedorActivo()) en vez de repetir la comparación).
  estaActivo() {
    return this.estado === "activo";
  }

  esProveedorActivo() {
    return this.rol === "proveedor" && this.estaActivo();
  }

  esAdmin() {
    return this.rol === "admin";
  }
}

module.exports = Usuario;