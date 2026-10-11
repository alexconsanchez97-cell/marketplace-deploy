require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { verificarToken, permitirRoles } = require("./interfaces/middlewares/auth");

const {
  registrarUsuario,
  iniciarSesion,
  listarPendientes,
  listarUsuarios,
  aprobarUsuario,
  eliminarUsuario,
} = require("./interfaces/userController");

const {
  crearProducto,
  listarCatalogo,
  listarTodosLosProductos,
  listarProductosPendientes,
  aprobarProducto,
  listarMisProductos,
  actualizarProducto,
  eliminarProducto,
} = require("./interfaces/productoController");
// ---------- ÓRDENES + CORREO: aquí se conecta cada PUERTO con su ADAPTADOR ----------
const OrdenRepositoryAdapter = require("./infrastructure/ordenRepositoryAdapter"); // BD de órdenes (pg)
const ProductoRepositoryAdapter = require("./infrastructure/productoRepositoryAdapter"); // BD de productos
const UserRepositoryAdapter = require("./infrastructure/userRepositoryAdapter"); // BD de usuarios
const NodemailerAdapter = require("./infrastructure/nodemailerAdapter"); // correo (Nodemailer)
const crearOrdenService = require("./application/ordenService"); // caso de uso
const crearOrdenController = require("./interfaces/ordenController"); // controlador

const emailService = new NodemailerAdapter({ // adaptador de correo con datos del .env
  smtp: { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, // si user/pass están vacíos, usa Ethereal automático
  remitente: process.env.MAIL_FROM || "Marketplace <no-reply@marketplace.test>", // remitente
  banco: { // datos bancarios del correo (valores de ejemplo si no hay en .env)
    nombre: process.env.BANCO_NOMBRE || "BBVA México",
    titular: process.env.BANCO_TITULAR || "Marketplace S.A. de C.V.",
    clabe: process.env.BANCO_CLABE || "012180001234567891",
    cuenta: process.env.BANCO_CUENTA || "0123456789",
  },
});

const ordenController = crearOrdenController( // armamos controlador -> servicio -> puertos
  crearOrdenService({
    ordenRepository: new OrdenRepositoryAdapter(), // puerto órdenes -> PostgreSQL
    productoRepository: new ProductoRepositoryAdapter(), // puerto productos -> PostgreSQL
    userRepository: new UserRepositoryAdapter(), // puerto usuarios -> PostgreSQL
    emailService, // puerto correo -> Nodemailer
    adminEmail: process.env.ADMIN_EMAIL, // a quién avisar (opcional)
  })
);

const app = express();
app.use(cors());
app.use(express.json());

// ---------- AUTENTICACIÓN (públicas, sin token) ----------
app.post("/api/register", registrarUsuario);
app.post("/api/login", iniciarSesion);

// ---------- USUARIOS (solo admin) ----------
// verificarToken revisa el "gafete"; permitirRoles("admin") revisa que ese
// gafete diga rol=admin.
app.get("/api/usuarios/pendientes", verificarToken, permitirRoles("admin"), listarPendientes);
app.get("/api/usuarios", verificarToken, permitirRoles("admin"), listarUsuarios);
app.put("/api/usuarios/:id/aprobar", verificarToken, permitirRoles("admin"), aprobarUsuario);
app.delete("/api/usuarios/:id", verificarToken, permitirRoles("admin"), eliminarUsuario);

// ---------- PRODUCTOS ----------
// Catálogo público (solo aprobados): cualquiera con token
app.get("/api/productos", verificarToken, listarCatalogo);

// Solo admin: ver TODOS (incluye pendientes) y la lista de pendientes
app.get("/api/productos/todos", verificarToken, permitirRoles("admin"), listarTodosLosProductos);
app.get("/api/productos/pendientes", verificarToken, permitirRoles("admin"), listarProductosPendientes);
app.put("/api/productos/:id/aprobar", verificarToken, permitirRoles("admin"), aprobarProducto);

// "Mis productos" y crear: solo proveedor o admin
app.get("/api/productos/mios", verificarToken, permitirRoles("proveedor", "admin"), listarMisProductos);
app.post("/api/productos", verificarToken, permitirRoles("proveedor", "admin"), crearProducto);

// Editar/eliminar: proveedor o admin (la regla de "solo TUS productos" ya
// está adentro de productoService, aquí solo filtramos por rol)
app.put("/api/productos/:id", verificarToken, permitirRoles("proveedor", "admin"), actualizarProducto);
app.delete("/api/productos/:id", verificarToken, permitirRoles("proveedor", "admin"), eliminarProducto);
// ---------- ÓRDENES (solo clientes) ----------
app.post("/api/ordenes", verificarToken, permitirRoles("cliente"), ordenController.crearOrden); // checkout
app.get("/api/ordenes/mias", verificarToken, permitirRoles("cliente"), ordenController.listarMisOrdenes); // historial
app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor Marketplace corriendo en el puerto ${process.env.PORT || 3000}`);
});