-- ============================================================
-- DATOS DE PRUEBA para el dashboard de reportes.
-- Crea 60 pedidos repartidos en los últimos 60 días, con estados variados,
-- usando los CLIENTES y PRODUCTOS ACTIVOS que ya existen en tu base.
-- Ejecutar una vez:  sudo -u postgres psql -d marketplace -f sql/datos_reportes.sql
-- ============================================================

DO $$                                             -- DO ejecuta un bloque de código PL/pgSQL una sola vez
DECLARE
  clientes  INT[];                                -- arreglo con los id de los clientes
  prods     INT[];                                -- arreglo con los id de productos activos
  v_orden   INT;                                  -- id del pedido recién creado
  n_items   INT;                                  -- cuántos productos lleva el pedido
  prod_id   INT;
  cant      INT;
  v_precio  NUMERIC(10,2);
  v_nombre  TEXT;
  suma      NUMERIC(10,2);
  v_estado  TEXT;
  azar      NUMERIC;
BEGIN
  SELECT array_agg(u.id) INTO clientes FROM usuarios u WHERE u.rol = 'cliente';      -- juntamos los clientes
  SELECT array_agg(p.id) INTO prods FROM productos p WHERE p.estado = 'activo';      -- y los productos aprobados

  IF clientes IS NULL OR prods IS NULL THEN                                     -- sin clientes o productos no se puede
    RAISE EXCEPTION 'Necesitas al menos 1 cliente y 1 producto activo';
  END IF;

  FOR i IN 1..60 LOOP                                                           -- 60 pedidos
    azar := random();                                                           -- número entre 0 y 1 para elegir el estado
    v_estado := CASE WHEN azar < 0.45 THEN 'pagada'                               -- 45% pagados
                   WHEN azar < 0.70 THEN 'enviada'                              -- 25% enviados
                   WHEN azar < 0.90 THEN 'pendiente_pago'                       -- 20% pendientes
                   ELSE 'cancelada' END;                                        -- 10% cancelados

    INSERT INTO ordenes (cliente_id, total, estado, creado_en)
    VALUES (clientes[1 + floor(random() * array_length(clientes, 1))::INT],    -- un cliente al azar
            0, v_estado,
            NOW() - (random() * 60 || ' days')::INTERVAL)                       -- una fecha al azar en los últimos 60 días
    RETURNING id INTO v_orden;

    suma := 0;
    n_items := 1 + floor(random() * 3)::INT;                                   -- de 1 a 3 productos distintos
    FOR j IN 1..n_items LOOP
      prod_id := prods[1 + floor(random() * array_length(prods, 1))::INT];     -- un producto al azar
      SELECT p.nombre, p.precio INTO v_nombre, v_precio FROM productos p WHERE p.id = prod_id;
      cant := 1 + floor(random() * 4)::INT;                                    -- de 1 a 4 piezas
      INSERT INTO orden_detalle (orden_id, producto_id, nombre_producto, precio_unitario, cantidad)
      VALUES (v_orden, prod_id, v_nombre, v_precio, cant);
      suma := suma + v_precio * cant;
    END LOOP;

    UPDATE ordenes SET total = suma WHERE id = v_orden;                        -- el total = suma de sus renglones
  END LOOP;
END $$;

SELECT o.estado, COUNT(*) FROM ordenes o GROUP BY o.estado;                           -- muestra cómo quedaron
