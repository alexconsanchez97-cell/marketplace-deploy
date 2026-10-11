// api.js
//
// En vez de escribir fetch(...) completo en cada componente (y repetir el
// manejo de errores 10 veces), centralizamos aquí UNA función que todos usan.
// Así, si mañana cambia la URL del backend, solo la cambias en un lugar.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"; // base de tu backend

async function apiFetch(endpoint, opciones = {}) {
  // Cada vez que se llama, revisamos si hay un token guardado del login.
  const token = localStorage.getItem("token");

  // Armamos los headers: Content-Type siempre, y Authorization SOLO si hay token
  // (login y register no lo necesitan, todo lo de).
  const headers = {
    "Content-Type": "application/json",
    ...(opciones.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Hacemos la petición real, combinando lo que nos pasaron (method, body)
  // con los headers que acabamos de armar.
  const respuesta = await fetch(`${API_URL}${endpoint}`, {
    ...opciones,
    headers,
  });

  // Intentamos leer el body como JSON. Si el servidor no mandó JSON válido
  // (ej. se cayó por completo), evitamos que truene aquí con .catch(() => ({}))
  const datos = await respuesta.json().catch(() => ({}));

  // Si el status HTTP no es 2xx, respuesta.ok es false: convertimos eso en
  // un error de JavaScript normal, para poder usar try/catch en los componentes.
  if (!respuesta.ok) {
    throw new Error(datos.msg || "Error en la peticion al servidor");
  }

  return datos;
}

export default apiFetch;