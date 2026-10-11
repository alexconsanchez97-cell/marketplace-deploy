// Implementa el contrato de userRepositoryPort.js usando PostgreSQL de verdad

const pool = require("./db");
const UserRepositoryPort = require("../domain/userRepositoryPort");
const Usuario = require("../domain/user");

class UserRepositoryAdapter extends UserRepositoryPort {
  // Convierte una fila de PostgreSQL en una instancia real de Usuario
  _filaAUsuario(fila) {
    if (!fila) return null;
    return new Usuario(fila.id, fila.nombre, fila.correo, fila.contrasena, fila.rol, fila.estado);
  }

  async guardar(usuario) {
    // RETURNING * hace que PostgreSQL nos devuelva la fila recién creada,
    // incluyendo el id que él mismo generó (SERIAL).
    const query = `
      INSERT INTO usuarios (nombre, correo, contrasena, rol, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const valores = [usuario.nombre, usuario.email, usuario.passwordHash, usuario.rol, usuario.estado];
    const resultado = await pool.query(query, valores);
    return this._filaAUsuario(resultado.rows[0]);
  }

  async buscarPorId(id) {
    const resultado = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    return this._filaAUsuario(resultado.rows[0]);
  }

  async buscarPorEmail(email) {
    const resultado = await pool.query("SELECT * FROM usuarios WHERE correo = $1", [email]);
    return this._filaAUsuario(resultado.rows[0]);
  }

  async obtenerTodos() {
    const resultado = await pool.query("SELECT * FROM usuarios ORDER BY id");
    return resultado.rows.map((fila) => this._filaAUsuario(fila));
  }

  async obtenerPendientes() {
    // Los que el super todavía tiene que revisar
    const resultado = await pool.query("SELECT * FROM usuarios WHERE estado = 'pendiente' ORDER BY id");
    return resultado.rows.map((fila) => this._filaAUsuario(fila));
  }

  async actualizar(usuario) {
    const query = `
      UPDATE usuarios
      SET nombre = $1, correo = $2, rol = $3, estado = $4
      WHERE id = $5
      RETURNING *;
    `;
    const valores = [usuario.nombre, usuario.email, usuario.rol, usuario.estado, usuario.id];
    const resultado = await pool.query(query, valores);
    return this._filaAUsuario(resultado.rows[0]);
  }

  async eliminar(id) {
    const resultado = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    return resultado.rowCount > 0;
  }
}

module.exports = UserRepositoryAdapter;