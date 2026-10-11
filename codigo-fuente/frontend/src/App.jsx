import { useState } from "react";
import apiFetch from "./api";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import ProveedorDashboard from "./components/ProveedorDashboard";
import ClienteDashboard from "./components/ClienteDashboard";

function App() {
  // Al cargar la página, revisamos si ya había una sesión guardada en
  // localStorage (así, si le das F5, no te regresa al login).
  // useState(() => {...}) con función es para que esto solo se ejecute
  // UNA vez, al crear el componente, no en cada render.
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem("usuario");
    return guardado ? JSON.parse(guardado) : null;
  });

  // Esta función se la pasamos a <Login> como prop onLogin.
  // Aquí SÍ hacemos el fetch real, porque App es quien decide qué hacer
  // con el resultado (guardar token, cambiar de pantalla).
  const iniciarSesion = async (email, password) => {
    try {
      const datos = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // datos = { token, usuario: { id, rol, estado, nombre } }
      localStorage.setItem("token", datos.token);
      localStorage.setItem("usuario", JSON.stringify(datos.usuario));

      setUsuario(datos.usuario); // esto hace que React vuelva a dibujar la pantalla
    } catch (error) {
      alert(error.message);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  // Si no hay sesión iniciada, lo único que se muestra es el login.
  if (!usuario) {
    return <Login onLogin={iniciarSesion} />;
  }

  return (
    <div>
      <h1>Marketplace</h1>

      <p>
        Sesión iniciada como: <b>{usuario.nombre}</b> — rol: <b>{usuario.rol}</b>
      </p>

      <button onClick={cerrarSesion}>Cerrar sesión</button>

      <hr />

      {/* Aquí está la magia de "un dashboard distinto según el rol":
          solo UNO de estos 4 bloques se muestra, según usuario.rol */}

      {usuario.rol === "admin" && <AdminDashboard />}

      {usuario.rol === "proveedor" && <ProveedorDashboard />}

      {usuario.rol === "cliente" && <ClienteDashboard />}

      {usuario.rol === "sin_asignar" && (
        <p>
          Tu cuenta todavía no ha sido aprobada por el administrador.
          Intenta iniciar sesión más tarde.
        </p>
      )}
    </div>
  );
}

export default App;