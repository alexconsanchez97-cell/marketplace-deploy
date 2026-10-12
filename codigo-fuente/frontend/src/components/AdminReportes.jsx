import { useEffect, useState } from "react"; // useState guarda datos; useEffect corre código cuando algo cambia
import apiFetch from "../api"; // tu función que llama al backend con el token
import {
  ResponsiveContainer, // hace que la gráfica ocupe el ancho disponible
  BarChart, Bar, // gráfica de barras
  PieChart, Pie, Cell, // gráfica circular y el color de cada rebanada
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, // ejes, cuadrícula, cuadrito al pasar el mouse y leyenda
} from "recharts";

const dinero = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n); // 1499.9 -> "$1,499.90"
const hoyTexto = () => new Date().toLocaleDateString("en-CA"); // fecha de hoy como "2026-10-11" (formato que usa <input type="date">)

// Un color fijo por estado, para que siempre se lean igual
const COLOR_ESTADO = { pendiente_pago: "#d97706", pagada: "#16a34a", enviada: "#2563eb", cancelada: "#dc2626" };

// Opciones de los botones de rango
const RANGOS = [
  { valor: "7d", texto: "Últimos 7 días" },
  { valor: "30d", texto: "Últimos 30 días" },
  { valor: "mes", texto: "Este mes" },
  { valor: "personalizado", texto: "Rango personalizado" },
];

// Estilos reutilizables (objetos de JavaScript que React convierte en CSS)
const tarjeta = { border: "1px solid #3f3f46", borderRadius: 8, padding: 16, flex: "1 1 180px" };
const caja = { border: "1px solid #3f3f46", borderRadius: 8, padding: 16, marginTop: 16 };

function AdminReportes() {
  const [rango, setRango] = useState("30d"); // rango elegido
  const [desde, setDesde] = useState(""); // fecha inicial (solo para "personalizado")
  const [hasta, setHasta] = useState(hoyTexto()); // fecha final (solo para "personalizado")
  const [agrupacion, setAgrupacion] = useState("dia"); // dia | semana | mes
  const [limite, setLimite] = useState(5); // top 5 o top 10
  const [datos, setDatos] = useState(null); // respuesta de /reportes/resumen
  const [cargando, setCargando] = useState(false); // true mientras esperamos al backend

  const cargar = async () => {
    if (rango === "personalizado" && (!desde || !hasta)) return; // falta elegir fechas: no pedimos nada todavía
    setCargando(true);
    try {
      // URLSearchParams arma el texto después del "?" de la URL: rango=30d&agrupacion=dia&limite=5...
      const params = new URLSearchParams({ rango, agrupacion, limite });
      if (rango === "personalizado") { params.set("desde", desde); params.set("hasta", hasta); }
      setDatos(await apiFetch(`/reportes/resumen?${params}`)); // GET /api/reportes/resumen
    } catch (error) {
      alert(error.message);
    } finally {
      setCargando(false);
    }
  };

  // Se vuelve a pedir el reporte cada vez que cambia alguno de estos filtros
  useEffect(() => { cargar(); }, [rango, desde, hasta, agrupacion, limite]);

  return (
    <div>
      <hr />
      <h2>Dashboard de ventas</h2>

      {/* ---------- FILTROS ---------- */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {RANGOS.map((r) => (
          <button key={r.valor} onClick={() => setRango(r.valor)} disabled={rango === r.valor}>
            {r.texto}
          </button>
        ))}

        {rango === "personalizado" && ( // las fechas solo aparecen en rango personalizado
          <>
            <label>Desde <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} /></label>
            <label>Hasta <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} /></label>
          </>
        )}

        <label>
          Agrupar por{" "}
          <select value={agrupacion} onChange={(e) => setAgrupacion(e.target.value)}>
            <option value="dia">Día</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
        </label>

        <label>
          Ranking{" "}
          <select value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
          </select>
        </label>

        {cargando && <span>Cargando...</span>}
      </div>

      {rango === "personalizado" && !desde && <p>Elige la fecha "Desde" para ver el reporte.</p>}

      {datos && (
        <>
          {/* ---------- TARJETAS (KPIs) ---------- */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
            <div style={tarjeta}><small>Ingresos totales</small><h3>{dinero(datos.ticket.ingresos)}</h3></div>
            <div style={tarjeta}><small>Pedidos vendidos</small><h3>{datos.ticket.pedidos}</h3></div>
            <div style={tarjeta}><small>Ticket promedio por pedido</small><h3>{dinero(datos.ticket.porPedido)}</h3></div>
            <div style={tarjeta}><small>Gasto promedio por cliente</small><h3>{dinero(datos.ticket.porUsuario)}</h3></div>
          </div>

          {/* ---------- INGRESOS EN EL TIEMPO ---------- */}
          <div style={caja}>
            <h3>Ingresos por {agrupacion === "dia" ? "día" : agrupacion}</h3>
            {datos.ingresos.serie.length === 0 ? (
              <p>No hay ventas en este rango.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={datos.ingresos.serie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="periodo" />
                  <YAxis tickFormatter={(v) => `$${v.toLocaleString("es-MX")}`} />
                  <Tooltip formatter={(v, nombre) => (nombre === "Ingresos" ? dinero(v) : v)} contentStyle={{ color: "#111" }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {/* ---------- ESTADOS DE PEDIDOS ---------- */}
            <div style={{ ...caja, flex: "1 1 320px" }}>
              <h3>Estado de los pedidos</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={datos.estados.filter((e) => e.cantidad > 0)} // no dibujamos rebanadas vacías
                    dataKey="cantidad" // el tamaño de la rebanada
                    nameKey="etiqueta" // el nombre que sale en la leyenda
                    outerRadius={100}
                    label={({ payload }) => `${payload.porcentaje}%`} // porcentaje encima de cada rebanada
                  >
                    {datos.estados.filter((e) => e.cantidad > 0).map((e) => (
                      <Cell key={e.estado} fill={COLOR_ESTADO[e.estado]} /> // color según el estado
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} pedidos`} contentStyle={{ color: "#111" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <table border="1" style={{ width: "100%" }}>
                <thead><tr><th>Estado</th><th>Pedidos</th><th>%</th></tr></thead>
                <tbody>
                  {datos.estados.map((e) => (
                    <tr key={e.estado}><td>{e.etiqueta}</td><td>{e.cantidad}</td><td>{e.porcentaje}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---------- RANKING DE PRODUCTOS ---------- */}
            <div style={{ ...caja, flex: "1 1 320px" }}>
              <h3>Top {limite} productos más vendidos</h3>
              {datos.productos.length === 0 ? (
                <p>No hay ventas en este rango.</p>
              ) : (
                <table border="1" style={{ width: "100%" }}>
                  <thead><tr><th>#</th><th>Producto</th><th>Unidades</th><th>Monto</th></tr></thead>
                  <tbody>
                    {datos.productos.map((p, i) => ( // i = posición en el ranking (empieza en 0)
                      <tr key={p.productoId ?? p.nombre}>
                        <td>{i + 1}</td>
                        <td>{p.nombre}</td>
                        <td>{p.unidades}</td>
                        <td>{dinero(p.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReportes;
