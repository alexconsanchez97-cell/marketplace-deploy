var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/interfaces/middlewares/auth.js
var require_auth = __commonJS({
  "src/interfaces/middlewares/auth.js"(exports2, module2) {
    var jwt = require("jsonwebtoken");
    function verificarToken2(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "No se proporcion\xF3 un token" });
      }
      const token = authHeader.split(" ")[1];
      try {
        const datosUsuario = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = datosUsuario;
        next();
      } catch (error) {
        return res.status(401).json({ msg: "Token inv\xE1lido o expirado" });
      }
    }
    function permitirRoles2(...rolesPermitidos) {
      return (req, res, next) => {
        if (!rolesPermitidos.includes(req.usuario.rol)) {
          return res.status(403).json({ msg: "No tienes permiso para esta acci\xF3n" });
        }
        next();
      };
    }
    module2.exports = { verificarToken: verificarToken2, permitirRoles: permitirRoles2 };
  }
});

// src/domain/user.js
var require_user = __commonJS({
  "src/domain/user.js"(exports2, module2) {
    var ROLES_VALIDOS = ["sin_asignar", "cliente", "proveedor", "admin"];
    var Usuario = class _Usuario {
      constructor(id, nombre, email, passwordHash, rol = "sin_asignar", estado = "pendiente") {
        if (!nombre || nombre.trim().length < 2) {
          throw new Error("El nombre debe tener al menos 2 caracteres");
        }
        if (!_Usuario.esEmailValido(email)) {
          throw new Error("El email no tiene un formato v\xE1lido");
        }
        if (!passwordHash) {
          throw new Error("El usuario debe tener una contrase\xF1a (hash)");
        }
        if (!ROLES_VALIDOS.includes(rol)) {
          throw new Error(`Rol inv\xE1lido: ${rol}`);
        }
        this.id = id;
        this.nombre = nombre.trim();
        this.email = email.trim().toLowerCase();
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.estado = estado;
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
    };
    module2.exports = Usuario;
  }
});

// src/infrastructure/db.js
var require_db = __commonJS({
  "src/infrastructure/db.js"(exports2, module2) {
    require("dotenv").config();
    var { Pool } = require("pg");
    var pool = new Pool({
      user: process.env.DB_USER,
      // viene del .env, ya no escrito a mano
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
      // 5432 por default en PostgreSQL
    });
    module2.exports = pool;
  }
});

// src/domain/userRepositoryPort.js
var require_userRepositoryPort = __commonJS({
  "src/domain/userRepositoryPort.js"(exports2, module2) {
    var UserRepositoryPort = class {
      async guardar(usuario) {
        throw new Error("M\xE9todo 'guardar' no implementado");
      }
      async buscarPorId(id) {
        throw new Error("M\xE9todo 'buscarPorId' no implementado");
      }
      async buscarPorEmail(email) {
        throw new Error("M\xE9todo 'buscarPorEmail' no implementado");
      }
      async obtenerTodos() {
        throw new Error("M\xE9todo 'obtenerTodos' no implementado");
      }
      // Nuevo: para la pantalla del super donde ve a quién le falta aprobar.
      async obtenerPendientes() {
        throw new Error("M\xE9todo 'obtenerPendientes' no implementado");
      }
      async actualizar(usuario) {
        throw new Error("M\xE9todo 'actualizar' no implementado");
      }
      async eliminar(id) {
        throw new Error("M\xE9todo 'eliminar' no implementado");
      }
    };
    module2.exports = UserRepositoryPort;
  }
});

// src/infrastructure/userRepositoryAdapter.js
var require_userRepositoryAdapter = __commonJS({
  "src/infrastructure/userRepositoryAdapter.js"(exports2, module2) {
    var pool = require_db();
    var UserRepositoryPort = require_userRepositoryPort();
    var Usuario = require_user();
    var UserRepositoryAdapter = class extends UserRepositoryPort {
      // Convierte una fila de PostgreSQL en una instancia real de Usuario
      _filaAUsuario(fila) {
        if (!fila) return null;
        return new Usuario(fila.id, fila.nombre, fila.correo, fila.contrasena, fila.rol, fila.estado);
      }
      async guardar(usuario) {
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
    };
    module2.exports = UserRepositoryAdapter;
  }
});

// src/application/userService.js
var require_userService = __commonJS({
  "src/application/userService.js"(exports2, module2) {
    var bcrypt = require("bcryptjs");
    var jwt = require("jsonwebtoken");
    var Usuario = require_user();
    var UserRepositoryAdapter = require_userRepositoryAdapter();
    var userRepository = new UserRepositoryAdapter();
    async function registrarUsuario2(nombre, email, password) {
      const existente = await userRepository.buscarPorEmail(email);
      if (existente) {
        throw new Error("Ya existe un usuario con ese email");
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const usuario = new Usuario(null, nombre, email, passwordHash);
      return userRepository.guardar(usuario);
    }
    async function iniciarSesion2(email, password) {
      const usuario = await userRepository.buscarPorEmail(email);
      if (!usuario) {
        throw new Error("Correo o contrase\xF1a incorrectos");
      }
      const passwordCorrecto = await bcrypt.compare(password, usuario.passwordHash);
      if (!passwordCorrecto) {
        throw new Error("Correo o contrase\xF1a incorrectos");
      }
      const payload = { id: usuario.id, rol: usuario.rol, estado: usuario.estado, nombre: usuario.nombre };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
      return { token, usuario: payload };
    }
    async function listarUsuarios2() {
      return userRepository.obtenerTodos();
    }
    async function listarPendientes2() {
      return userRepository.obtenerPendientes();
    }
    async function aprobarUsuario2(id, rolAsignado) {
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
    async function eliminarUsuario2(id) {
      const usuario = await userRepository.buscarPorId(id);
      if (!usuario) {
        throw new Error("Usuario no encontrado");
      }
      return userRepository.eliminar(id);
    }
    module2.exports = {
      registrarUsuario: registrarUsuario2,
      iniciarSesion: iniciarSesion2,
      listarUsuarios: listarUsuarios2,
      listarPendientes: listarPendientes2,
      aprobarUsuario: aprobarUsuario2,
      obtenerUsuarioPorId,
      eliminarUsuario: eliminarUsuario2
    };
  }
});

// src/interfaces/userController.js
var require_userController = __commonJS({
  "src/interfaces/userController.js"(exports2, module2) {
    var userService = require_userService();
    var registrarUsuario2 = async (req, res) => {
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
    var iniciarSesion2 = async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ msg: "Faltan datos" });
      }
      try {
        const resultado = await userService.iniciarSesion(email, password);
        res.status(200).json(resultado);
      } catch (error) {
        console.error(error);
        res.status(401).json({ msg: error.message });
      }
    };
    var listarPendientes2 = async (req, res) => {
      try {
        const usuarios = await userService.listarPendientes();
        res.status(200).json(usuarios);
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener usuarios pendientes" });
      }
    };
    var listarUsuarios2 = async (req, res) => {
      try {
        const usuarios = await userService.listarUsuarios();
        res.status(200).json(usuarios);
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener usuarios" });
      }
    };
    var aprobarUsuario2 = async (req, res) => {
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
    var eliminarUsuario2 = async (req, res) => {
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
    module2.exports = {
      registrarUsuario: registrarUsuario2,
      iniciarSesion: iniciarSesion2,
      listarPendientes: listarPendientes2,
      listarUsuarios: listarUsuarios2,
      aprobarUsuario: aprobarUsuario2,
      eliminarUsuario: eliminarUsuario2
    };
  }
});

// src/domain/producto.js
var require_producto = __commonJS({
  "src/domain/producto.js"(exports2, module2) {
    var Producto = class {
      constructor(id, nombre, descripcion, precio, imagenUrl, proveedorId, estado = "pendiente") {
        if (!nombre || nombre.trim().length < 2) {
          throw new Error("El nombre del producto debe tener al menos 2 caracteres");
        }
        const precioNumerico = Number(precio);
        if (isNaN(precioNumerico) || precioNumerico <= 0) {
          throw new Error("El precio debe ser un n\xFAmero mayor a 0");
        }
        if (!proveedorId) {
          throw new Error("El producto debe pertenecer a un proveedor (proveedorId requerido)");
        }
        this.id = id;
        this.nombre = nombre.trim();
        this.descripcion = descripcion ? descripcion.trim() : "";
        this.precio = precioNumerico;
        this.imagenUrl = imagenUrl || "";
        this.proveedorId = proveedorId;
        this.estado = estado;
      }
      // El super llama esto para aprobar el producto y que ya aparezca
      // en el catálogo público que ve el cliente.
      aprobar() {
        this.estado = "activo";
      }
      // Se usa antes de guardar cambios de un PUT, para no repetir las
      // validaciones de precio/nombre en la capa de aplicación.
      actualizarDatos({ nombre, descripcion, precio, imagenUrl }) {
        if (nombre !== void 0) {
          if (nombre.trim().length < 2) throw new Error("El nombre debe tener al menos 2 caracteres");
          this.nombre = nombre.trim();
        }
        if (descripcion !== void 0) this.descripcion = descripcion.trim();
        if (precio !== void 0) {
          const precioNumerico = Number(precio);
          if (isNaN(precioNumerico) || precioNumerico <= 0) throw new Error("El precio debe ser mayor a 0");
          this.precio = precioNumerico;
        }
        if (imagenUrl !== void 0) this.imagenUrl = imagenUrl;
      }
    };
    module2.exports = Producto;
  }
});

// src/domain/productoRepositoryPort.js
var require_productoRepositoryPort = __commonJS({
  "src/domain/productoRepositoryPort.js"(exports2, module2) {
    var ProductoRepositoryPort = class {
      async guardar(producto) {
        throw new Error("M\xE9todo 'guardar' no implementado");
      }
      async buscarPorId(id) {
        throw new Error("M\xE9todo 'buscarPorId' no implementado");
      }
      async obtenerTodos() {
        throw new Error("M\xE9todo 'obtenerTodos' no implementado");
      }
      // Solo los ya aprobados: lo que ve el catálogo público (rol cliente)
      async obtenerActivos() {
        throw new Error("M\xE9todo 'obtenerActivos' no implementado");
      }
      // Los que el super todavía tiene que revisar
      async obtenerPendientes() {
        throw new Error("M\xE9todo 'obtenerPendientes' no implementado");
      }
      // Para que un proveedor vea SOLO sus propios productos.
      async obtenerPorProveedor(proveedorId) {
        throw new Error("M\xE9todo 'obtenerPorProveedor' no implementado");
      }
      async actualizar(producto) {
        throw new Error("M\xE9todo 'actualizar' no implementado");
      }
      async eliminar(id) {
        throw new Error("M\xE9todo 'eliminar' no implementado");
      }
    };
    module2.exports = ProductoRepositoryPort;
  }
});

// src/infrastructure/productoRepositoryAdapter.js
var require_productoRepositoryAdapter = __commonJS({
  "src/infrastructure/productoRepositoryAdapter.js"(exports2, module2) {
    var pool = require_db();
    var ProductoRepositoryPort = require_productoRepositoryPort();
    var Producto = require_producto();
    var ProductoRepositoryAdapter = class extends ProductoRepositoryPort {
      _filaAProducto(fila) {
        if (!fila) return null;
        return new Producto(fila.id, fila.nombre, fila.descripcion, fila.precio, fila.imagen_url, fila.proveedor_id, fila.estado);
      }
      async guardar(producto) {
        const query = `
      INSERT INTO productos (nombre, descripcion, precio, imagen_url, proveedor_id, estado)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
        const valores = [producto.nombre, producto.descripcion, producto.precio, producto.imagenUrl, producto.proveedorId, producto.estado];
        const resultado = await pool.query(query, valores);
        return this._filaAProducto(resultado.rows[0]);
      }
      async buscarPorId(id) {
        const resultado = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);
        return this._filaAProducto(resultado.rows[0]);
      }
      // TODOS los productos, sin importar su estado -- lo usa el admin
      async obtenerTodos() {
        const resultado = await pool.query("SELECT * FROM productos ORDER BY id");
        return resultado.rows.map((fila) => this._filaAProducto(fila));
      }
      // Solo los aprobados -- lo usa el catálogo del cliente
      async obtenerActivos() {
        const resultado = await pool.query("SELECT * FROM productos WHERE estado = 'activo' ORDER BY id");
        return resultado.rows.map((fila) => this._filaAProducto(fila));
      }
      // Esperando revisión del admin
      async obtenerPendientes() {
        const resultado = await pool.query("SELECT * FROM productos WHERE estado = 'pendiente' ORDER BY id");
        return resultado.rows.map((fila) => this._filaAProducto(fila));
      }
      async obtenerPorProveedor(proveedorId) {
        const resultado = await pool.query("SELECT * FROM productos WHERE proveedor_id = $1 ORDER BY id", [proveedorId]);
        return resultado.rows.map((fila) => this._filaAProducto(fila));
      }
      async actualizar(producto) {
        const query = `
      UPDATE productos
      SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4, estado = $5
      WHERE id = $6
      RETURNING *;
    `;
        const valores = [producto.nombre, producto.descripcion, producto.precio, producto.imagenUrl, producto.estado, producto.id];
        const resultado = await pool.query(query, valores);
        return this._filaAProducto(resultado.rows[0]);
      }
      async eliminar(id) {
        const resultado = await pool.query("DELETE FROM productos WHERE id = $1", [id]);
        return resultado.rowCount > 0;
      }
    };
    module2.exports = ProductoRepositoryAdapter;
  }
});

// src/application/productoService.js
var require_productoService = __commonJS({
  "src/application/productoService.js"(exports2, module2) {
    var Producto = require_producto();
    var ProductoRepositoryAdapter = require_productoRepositoryAdapter();
    var productoRepository = new ProductoRepositoryAdapter();
    async function crearProducto2(proveedorId, datos) {
      const producto = new Producto(null, datos.nombre, datos.descripcion, datos.precio, datos.imagenUrl, proveedorId);
      return productoRepository.guardar(producto);
    }
    async function listarCatalogo2() {
      return productoRepository.obtenerActivos();
    }
    async function listarTodosLosProductos2() {
      return productoRepository.obtenerTodos();
    }
    async function listarProductosPendientes2() {
      return productoRepository.obtenerPendientes();
    }
    async function aprobarProducto2(id) {
      const producto = await productoRepository.buscarPorId(id);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }
      producto.aprobar();
      return productoRepository.actualizar(producto);
    }
    async function listarMisProductos2(proveedorId) {
      return productoRepository.obtenerPorProveedor(proveedorId);
    }
    async function obtenerProducto(id) {
      const producto = await productoRepository.buscarPorId(id);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }
      return producto;
    }
    async function actualizarProducto2(id, datos, usuarioQueEdita) {
      const producto = await productoRepository.buscarPorId(id);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }
      const esDue\u00F1o = producto.proveedorId === usuarioQueEdita.id;
      if (usuarioQueEdita.rol !== "admin" && !esDue\u00F1o) {
        throw new Error("No tienes permiso para editar este producto");
      }
      producto.actualizarDatos(datos);
      return productoRepository.actualizar(producto);
    }
    async function eliminarProducto2(id, usuarioQueElimina) {
      const producto = await productoRepository.buscarPorId(id);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }
      const esDue\u00F1o = producto.proveedorId === usuarioQueElimina.id;
      if (usuarioQueElimina.rol !== "admin" && !esDue\u00F1o) {
        throw new Error("No tienes permiso para eliminar este producto");
      }
      return productoRepository.eliminar(id);
    }
    module2.exports = {
      crearProducto: crearProducto2,
      listarCatalogo: listarCatalogo2,
      listarTodosLosProductos: listarTodosLosProductos2,
      listarProductosPendientes: listarProductosPendientes2,
      aprobarProducto: aprobarProducto2,
      listarMisProductos: listarMisProductos2,
      obtenerProducto,
      actualizarProducto: actualizarProducto2,
      eliminarProducto: eliminarProducto2
    };
  }
});

// src/interfaces/productoController.js
var require_productoController = __commonJS({
  "src/interfaces/productoController.js"(exports2, module2) {
    var productoService = require_productoService();
    var crearProducto2 = async (req, res) => {
      try {
        const producto = await productoService.crearProducto(req.usuario.id, req.body);
        res.status(201).json(producto);
      } catch (error) {
        console.error(error);
        res.status(400).json({ msg: error.message });
      }
    };
    var listarCatalogo2 = async (req, res) => {
      try {
        const productos = await productoService.listarCatalogo();
        res.status(200).json(productos);
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener productos" });
      }
    };
    var listarTodosLosProductos2 = async (req, res) => {
      try {
        const productos = await productoService.listarTodosLosProductos();
        res.status(200).json(productos);
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener productos" });
      }
    };
    var listarProductosPendientes2 = async (req, res) => {
      try {
        const productos = await productoService.listarProductosPendientes();
        res.status(200).json(productos);
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener productos pendientes" });
      }
    };
    var aprobarProducto2 = async (req, res) => {
      const { id } = req.params;
      try {
        const producto = await productoService.aprobarProducto(id);
        res.status(200).json(producto);
      } catch (error) {
        console.error(error);
        res.status(400).json({ msg: error.message });
      }
    };
    var listarMisProductos2 = async (req, res) => {
      try {
        const productos = await productoService.listarMisProductos(req.usuario.id);
        res.status(200).json(productos);
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener tus productos" });
      }
    };
    var actualizarProducto2 = async (req, res) => {
      const { id } = req.params;
      try {
        const producto = await productoService.actualizarProducto(id, req.body, req.usuario);
        res.status(200).json(producto);
      } catch (error) {
        console.error(error);
        const codigo = error.message.includes("permiso") ? 403 : 400;
        res.status(codigo).json({ msg: error.message });
      }
    };
    var eliminarProducto2 = async (req, res) => {
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
    module2.exports = {
      crearProducto: crearProducto2,
      listarCatalogo: listarCatalogo2,
      listarTodosLosProductos: listarTodosLosProductos2,
      listarProductosPendientes: listarProductosPendientes2,
      aprobarProducto: aprobarProducto2,
      listarMisProductos: listarMisProductos2,
      actualizarProducto: actualizarProducto2,
      eliminarProducto: eliminarProducto2
    };
  }
});

// src/server.js
require("dotenv").config();
var express = require("express");
var cors = require("cors");
var { verificarToken, permitirRoles } = require_auth();
var {
  registrarUsuario,
  iniciarSesion,
  listarPendientes,
  listarUsuarios,
  aprobarUsuario,
  eliminarUsuario
} = require_userController();
var {
  crearProducto,
  listarCatalogo,
  listarTodosLosProductos,
  listarProductosPendientes,
  aprobarProducto,
  listarMisProductos,
  actualizarProducto,
  eliminarProducto
} = require_productoController();
var app = express();
app.use(cors());
app.use(express.json());
app.post("/api/register", registrarUsuario);
app.post("/api/login", iniciarSesion);
app.get("/api/usuarios/pendientes", verificarToken, permitirRoles("admin"), listarPendientes);
app.get("/api/usuarios", verificarToken, permitirRoles("admin"), listarUsuarios);
app.put("/api/usuarios/:id/aprobar", verificarToken, permitirRoles("admin"), aprobarUsuario);
app.delete("/api/usuarios/:id", verificarToken, permitirRoles("admin"), eliminarUsuario);
app.get("/api/productos", verificarToken, listarCatalogo);
app.get("/api/productos/todos", verificarToken, permitirRoles("admin"), listarTodosLosProductos);
app.get("/api/productos/pendientes", verificarToken, permitirRoles("admin"), listarProductosPendientes);
app.put("/api/productos/:id/aprobar", verificarToken, permitirRoles("admin"), aprobarProducto);
app.get("/api/productos/mios", verificarToken, permitirRoles("proveedor", "admin"), listarMisProductos);
app.post("/api/productos", verificarToken, permitirRoles("proveedor", "admin"), crearProducto);
app.put("/api/productos/:id", verificarToken, permitirRoles("proveedor", "admin"), actualizarProducto);
app.delete("/api/productos/:id", verificarToken, permitirRoles("proveedor", "admin"), eliminarProducto);
app.listen(process.env.PORT || 3e3, () => {
  console.log(`Servidor Marketplace corriendo en el puerto ${process.env.PORT || 3e3}`);
});
