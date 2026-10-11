import { useState } from "react";
import apiFetch from "../api";

// Genera un código de 6 dígitos al azar. Es una función normal, NO un hook,
// por eso puede vivir fuera del componente y la llamamos cuando queramos.
function generarCodigoCaptcha() {
  // Math.random() da un decimal entre 0 y 1. Lo multiplicamos por 900000 y
  // sumamos 100000 para que SIEMPRE salga un número de exactamente 6 dígitos
  // (entre 100000 y 999999), nunca uno más corto como "4821".
  const numero = Math.floor(100000 + Math.random() * 900000);
  return numero.toString();
}

// Recibe onLogin como prop: es una función que le pasa App.jsx, para que
// App sea quien decide qué hacer con el token (guardarlo, cambiar de pantalla).
function Login({ onLogin }) {
  // "login" o "registro": controla cuál de los 2 formularios se muestra
  const [modo, setModo] = useState("login");

  // Campos compartidos por ambos formularios
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- CAPTCHA ---
  // captchaGenerado: el código que la "compu" acaba de inventar y muestra en pantalla.
  // useState(generarCodigoCaptcha) SIN paréntesis extra al final significa
  // "usa esta función para calcular el valor inicial, una sola vez".
  const [captchaGenerado, setCaptchaGenerado] = useState(generarCodigoCaptcha);
  // captchaEscrito: lo que el usuario tecleó, tratando de copiar el de arriba.
  const [captchaEscrito, setCaptchaEscrito] = useState("");

  const manejarLogin = (e) => {
    e.preventDefault(); // evita que el formulario recargue la página
    onLogin(email, password); // App.jsx hace el fetch real a /api/login
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();

    // Antes de mandar nada al backend, comparamos el código escrito contra
    // el generado. Si no coinciden, ni siquiera intentamos registrar.
    if (captchaEscrito !== captchaGenerado) {
      alert("El código de verificación no coincide. Intenta de nuevo.");
      setCaptchaGenerado(generarCodigoCaptcha()); // generamos uno nuevo
      setCaptchaEscrito(""); // limpiamos lo que había escrito
      return;
    }

    try {
      await apiFetch("/register", {
        method: "POST",
        body: JSON.stringify({ nombre, email, password }),
      });
      alert("Registro exitoso. Espera a que el administrador apruebe tu cuenta.");
      setModo("login"); // lo regresamos al login después de registrarse
      setNombre("");
      setPassword("");
      setCaptchaGenerado(generarCodigoCaptcha()); // deja uno nuevo listo para la próxima
      setCaptchaEscrito("");
    } catch (error) {
      alert(error.message);
    }
  };

  // --- Formulario de REGISTRO ---
  if (modo === "registro") {
    return (
      <div>
        <h1>Crear cuenta</h1>
        <form onSubmit={manejarRegistro}>
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <br /><br />
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br /><br />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br /><br />

          {/* --- Bloque del captcha --- */}
          <p>
            Código de verificación:{" "}
            <b style={{ letterSpacing: "4px", fontSize: "1.2em" }}>{captchaGenerado}</b>{" "}
            <button type="button" onClick={() => setCaptchaGenerado(generarCodigoCaptcha())}>
              🔄 Otro código
            </button>
          </p>
          <input
            type="text"
            placeholder="Escribe el código de arriba"
            value={captchaEscrito}
            onChange={(e) => setCaptchaEscrito(e.target.value)}
            required
          />
          <br /><br />

          <button type="submit">Registrarme</button>
        </form>
        <p>
          ¿Ya tienes cuenta?{" "}
          <button onClick={() => setModo("login")}>Iniciar sesión</button>
        </p>
      </div>
    );
  }

  // --- Formulario de LOGIN (modo por default) ---
  return (
    <div>
      <h1>Iniciar sesión</h1>
      <form onSubmit={manejarLogin}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br /><br />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">Entrar</button>
      </form>
      <p>
        ¿No tienes cuenta?{" "}
        <button onClick={() => setModo("registro")}>Regístrate</button>
      </p>
    </div>
  );
}

export default Login;