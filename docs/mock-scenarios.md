# Escenarios de la API simulada

El panel **Demo** aparece únicamente cuando `demoControls=true`. Cambiar el escenario recarga la
ruta actual y conserva la base de la sesión. **Restaurar datos seed** vuelve al escenario normal y
recrea productos, carrito, pedidos, operadores, solicitudes e historial.

| Escenario | Comportamiento | Uso esperado |
|---|---|---|
| Normal | Latencia breve y datos stateful | Recorrer los flujos completos |
| Carga lenta | Respuestas de aproximadamente 2,2 segundos | Ver loading y evitar parpadeos |
| Sin datos | Catálogo y listados vacíos | Verificar empty states y recuperaciones |
| Error 500 | Las lecturas fallan con un envelope tipado | Validar título, mensaje y reintento |
| Sin conexión | MSW emite un error de red | Validar banner, conservación del formulario y bloqueo humano |
| Resultado incierto | La mutación se confirma en la base y se pierde la respuesta | Verificar reconciliación sin reenvío |

## Datos seed relevantes

- Orden `1042`: tres líneas en estados `AT_HUB`, `PREPARING` y `CONFIRMED`; todas cancelables.
- Orden `1040`: una línea `DISPATCHED`; la cancelación debe responder
  `ORDER_ALREADY_DISPATCHED`.
- Solicitud `C-206`: rechazada y disponible para probar detalle e historial.
- Operadores: Mariana Sosa, Tomás Leiva, Lucía Méndez y Diego Acosta.

## Persistencia e idempotencia

- Base del mock: `sessionStorage`, clave versionada `tizo:mock-db:v1`.
- Escenario activo: `sessionStorage`, clave `tizo:mock-scenario:v1`.
- Operador activo: `localStorage`, clave `tizo:active-operator:v1`.
- Checkout, creación, aprobación y rechazo registran una clave idempotente.
- Misma clave y mismo payload: devuelve el resultado original.
- Misma clave y payload distinto: `409 IDEMPOTENCY_KEY_REUSED`.

No se implementa cola offline. Una escritura sin confirmación debe reconciliarse; nunca se reenvía
automáticamente.
