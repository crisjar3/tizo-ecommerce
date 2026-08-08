# 07 — Plan de pantallas

Plan de construcción de la UI Angular: qué pantallas existen, qué contiene cada una, qué estados
debe cubrir y en qué orden se construyen.

## Criterio transversal: toda pantalla tiene seis estados

El error más común en una entrega de tres días es construir solo el estado feliz y descubrir en
la demo que la lista vacía muestra una tabla con encabezados y nada debajo.

| Estado | Cuándo | Regla |
|---|---|---|
| **Loading** | Petición en curso | Skeleton con la forma del contenido real, no un spinner centrado. |
| **Success** | Datos disponibles | — |
| **Empty** | Respuesta válida, cero resultados | Mensaje + acción sugerida. Nunca una tabla vacía. |
| **Error** | Falla la carga | Mensaje + botón de reintento. Nunca un error crudo. |
| **Offline** | Sin conexión | Banner global + escrituras deshabilitadas. |
| **Not found** | El recurso no existe | Pantalla propia con vuelta al listado. |

Cada pantalla de este plan declara explícitamente cómo resuelve los seis.

## Prioridades

| Nivel | Significado |
|---|---|
| **P0** | Sin esto no hay entrega. Se construye primero. |
| **P1** | Necesario para que la entrega se vea profesional. |
| **P2** | Solo si sobra tiempo. Su ausencia no rompe nada. |

---

## Mapa de rutas

| Ruta | Pantalla | Flujo | Prioridad |
|---|---|---|---|
| `/orders` | Listado de órdenes | F-01 | **P0** |
| `/orders/:id` | Detalle de orden | F-02 | **P0** |
| `/orders/:id/cancel` | Solicitud de cancelación | F-03 | **P0** |
| `/cancellations` | Bandeja de solicitudes | F-04 | **P0** |
| `/cancellations/:id` | Resolución de solicitud | F-05 | **P0** |
| `/operator` | Selección de operador | — | P1 |
| `/404` | Recurso inexistente | — | P1 |
| `/error` | Fallo irrecuperable | — | P2 |

> **Sobre `/orders/:id/cancel` como ruta y no como modal.** Es un formulario con estado —
> selección de líneas, motivo, `idempotency_key` viva — y necesita sobrevivir a un refresh. Un
> modal que pierde la selección al recargar es peor experiencia y peor código.

---

## Componentes compartidos

Construir estos primero evita duplicar lógica en cinco pantallas.

| Componente | Responsabilidad | Prioridad |
|---|---|---|
| `StateBadge` | Renderiza `fulfillmentStatus` o `cancellationStatus` con color y etiqueta | **P0** |
| `ItemStatusChip` | Estado de línea (`PENDING` … `AT_HUB`, `CANCELLED`) | **P0** |
| `MoneyDisplay` | Formatea centavos a moneda. **Un solo lugar donde vive el formateo.** | **P0** |
| `EmptyState` | Ilustración + mensaje + acción | **P0** |
| `ErrorState` | Mensaje + botón de reintento | **P0** |
| `LoadingSkeleton` | Skeleton parametrizable por forma | P1 |
| `ConfirmDialog` | Confirmación con resumen de consecuencias | **P0** |
| `OfflineBanner` | Banner global de desconexión | P1 |
| `OperationalEffectHint` | Traduce `operational_effect` a lenguaje llano | P1 |

> **`MoneyDisplay` no es cosmético.** Los montos viajan en centavos (doc 03). Si cada componente
> hace su propia división por 100, en algún lado va a aparecer un `$44000` o un `$440`. Un solo
> componente, un solo bug posible.

---

# F-01 · Listado de órdenes

**Ruta:** `/orders` · **Prioridad:** P0

### Contenido

| Bloque | Detalle |
|---|---|
| Buscador | Por N° de orden o nombre de cliente. Debounce 300 ms. |
| Filtros | `fulfillmentStatus` y `cancellationStatus` en selects **separados** |
| Tabla | N° · Cliente · Tiendas · Total pagado · Estado fulfillment · Estado cancelación |
| Paginación | Server-side |

**Dos columnas de estado, no una.** Son ejes ortogonales (doc 02). Fusionarlos obliga a inventar
etiquetas compuestas como "Despachado parcialmente cancelado", que no escalan.

### Estados

| Estado | Resolución |
|---|---|
| Loading | Skeleton de 5 filas con la forma de la tabla |
| Success | Tabla paginada |
| Empty (sin órdenes) | "No hay órdenes cargadas." |
| Empty (filtro sin resultados) | "Ningún resultado para estos filtros." + **botón Limpiar filtros** |
| Error | "No pudimos cargar las órdenes." + Reintentar |
| Offline | Banner global + filtros operables sobre lo ya cargado |

> Los dos vacíos son **distintos**. "No hay nada" y "no hay nada *que coincida*" requieren
> acciones opuestas: cargar datos o limpiar el filtro. Usar el mismo mensaje deja al operador
> sin salida.

### Edge cases

| Caso | Resolución |
|---|---|
| Nombre de cliente muy largo | Truncar con ellipsis + `title` completo |
| Orden con 1 sola tienda | Se muestra igual, sin caso especial |
| Total en cero | `MoneyDisplay` lo renderiza, no se oculta |
| Página fuera de rango tras filtrar | Volver a página 1 automáticamente |

---

# F-02 · Detalle de orden

**Ruta:** `/orders/:id` · **Prioridad:** P0

### Contenido

| Bloque | Detalle |
|---|---|
| Encabezado | N° orden, cliente, fecha de pago, ambos estados |
| Alerta de bloqueo | Si el paquete no puede salir, indicar **qué línea lo demora** |
| Tabla de líneas | Producto · Tienda · Cantidad · Total · Estado |
| Totales | Subtotal, envío, total pagado. Si hay cancelaciones: monto cancelado y vigente |
| Historial | Solicitudes previas de la orden, incluidos rechazos |
| Acción | Botón "Solicitar cancelación de productos" |

### Estados del botón de acción

| Situación | Botón | Mensaje visible |
|---|---|---|
| Cancelable | Habilitado | — |
| `dispatchedAt` presente | Deshabilitado | "El paquete ya fue despachado. Corresponde una devolución." |
| Cancelación efectiva previa | Deshabilitado | "Esta orden ya tuvo su cancelación." |

**El motivo se muestra siempre.** Un botón gris sin explicación es un ticket de soporte.

### Estados

| Estado | Resolución |
|---|---|
| Loading | Skeleton de encabezado + 3 filas |
| Success | Detalle completo |
| Empty | No aplica — una orden siempre tiene líneas |
| Error | "No pudimos cargar la orden." + Reintentar |
| **Not found** | Pantalla 404 con vuelta a `/orders` |
| Offline | Banner + botón de acción deshabilitado |

### Edge cases

| Caso | Resolución |
|---|---|
| Todas las líneas ya canceladas | Historial visible, botón deshabilitado |
| Orden con una sola línea | El botón funciona igual; F-03 advertirá que es cancelación total |
| Muchas líneas (>20) | Tabla con scroll propio, encabezado fijo |
| Orden despachada entre la carga y el clic | El backend rechaza. Ver *Mapeo de errores*. |

---

# F-03 · Solicitud de cancelación

**Ruta:** `/orders/:id/cancel` · **Prioridad:** P0

Es la pantalla más delicada del sistema: una sola oportunidad por orden.

### Contenido

| Bloque | Detalle |
|---|---|
| **Aviso de irreversibilidad** | Fijo arriba, siempre visible. No es un tooltip. |
| Lista seleccionable | Checkbox por línea con producto, tienda, monto y estado |
| Efecto por línea | Al marcar, se muestra qué va a pasar físicamente |
| Motivo | Select obligatorio del catálogo de `reason_code` |
| Nota | Textarea. **Obligatoria si el motivo es `OTHER`** |
| Resumen en vivo | Cantidad seleccionada · monto afectado · monto que queda vigente |
| Acciones | Volver · Confirmar |

### El aviso que no puede faltar

```
⚠️  Esta orden admite UNA SOLA cancelación.
    Seleccioná ahora todos los productos a cancelar.
    No vas a poder volver a cancelar más tarde.
```

Con RN-26 vigente, un operador que confirma sin darse cuenta de que faltaba una línea queda sin
salida. El aviso es parte de la regla, no decoración.

### Estados

| Estado | Resolución |
|---|---|
| Loading | Skeleton de lista |
| Success | Formulario operable |
| Empty | No aplica |
| Error de carga | "No pudimos cargar los productos." + Reintentar |
| **Submitting** | Botón en loading, formulario bloqueado, **sin posibilidad de doble envío** |
| Error de envío | Ver *Mapeo de errores* |
| Offline | Banner + Confirmar deshabilitado con "Sin conexión. No se puede confirmar." |

### Edge cases

| Caso | Resolución |
|---|---|
| **Ninguna línea seleccionada** | Confirmar deshabilitado |
| **Todas las líneas seleccionadas** | Advertencia extra: "Vas a cancelar la orden completa." |
| Motivo `OTHER` sin nota | Confirmar deshabilitado + campo marcado |
| Doble clic en Confirmar | Botón se bloquea al primer clic. La `idempotency_key` es la red de seguridad. |
| Refresh de la página | Se pierde la selección. **La `idempotency_key` se regenera.** Aceptable: nada se envió. |
| Navegar afuera con selección | `CanDeactivate` guard: "Tenés una selección sin confirmar." |
| Orden despachada mientras completa | El backend rechaza al confirmar → redirigir a F-02 con el motivo |

### La `idempotency_key`

**Se genera al montar el componente, no en el clic.** Si se generara en el clic, cada clic
produciría una clave distinta y el doble clic se leería como segundo intento — el error exacto
que RN-28 existe para evitar.

---

# F-04 · Bandeja de solicitudes

**Ruta:** `/cancellations` · **Prioridad:** P0

### Contenido

| Bloque | Detalle |
|---|---|
| Tabs | Pendientes · Resueltas · Rechazadas |
| Tabla | N° solicitud · Orden · Cant. productos · Monto · Motivo · Antigüedad |
| **Marca de invalidez** | Fila destacada si la solicitud ya no es resoluble |
| Acción por fila | "Revisar" → F-05 |

### La marca de invalidez

Entre que una solicitud se crea y alguien la resuelve pasa tiempo real, y el paquete puede haber
salido. **La validez se reevalúa al listar, no se lee del registro.**

```
⚠️ #C-204   #1035   1   $15.000   Sin stock   hace 3 h
   El paquete de esta orden fue despachado hace 20 min.
```

Marcar la fila **antes** del clic convierte un error en una advertencia.

### Estados

| Estado | Resolución |
|---|---|
| Loading | Skeleton de 5 filas |
| Success | Tabla por tab |
| **Empty (Pendientes)** | "No hay solicitudes pendientes." — es un estado **bueno**, redactarlo en positivo |
| Empty (otros tabs) | "Todavía no hay solicitudes resueltas." |
| Error | Mensaje + Reintentar |
| Offline | Banner + acciones deshabilitadas |

### Edge cases

| Caso | Resolución |
|---|---|
| Solicitud resuelta por otro operador mientras mirás | Al entrar a F-05, conflicto controlado |
| Antigüedad > 24 h | Mostrar fecha absoluta en lugar de "hace X" |
| Muchas solicitudes | Paginación server-side |

---

# F-05 · Resolución de solicitud

**Ruta:** `/cancellations/:id` · **Prioridad:** P0

El núcleo del sistema. Acá se ejecuta la cancelación.

### Contenido

| Bloque | Detalle |
|---|---|
| Encabezado | N° solicitud, orden, quién la pidió, cuándo, motivo |
| Lista de productos | Producto, tienda, monto, estado actual |
| **Efecto operativo** | Por línea, en lenguaje llano |
| Impacto económico | Monto afectado · monto que queda vigente |
| **Semáforo de validez** | Verde si es resoluble, rojo con el motivo si no |
| Acciones | Rechazar · Aceptar |
| Confirmación | `ConfirmDialog` con resumen antes de ejecutar |

### El efecto operativo en lenguaje llano

```
Campera impermeable   OutdoorMax   $44.000
Estado actual: Preparando
→ La tienda detiene la preparación y repone stock
```

Si la línea está en `AT_HUB`:

```
→ Hay que extraer el producto del paquete ya armado
   y devolverlo a la tienda
```

El operador tiene que saber que aceptar significa que alguien va a mover cajas.

### Estados

| Estado | Resolución |
|---|---|
| Loading | Skeleton |
| Success · resoluble | Semáforo verde, ambos botones activos |
| Success · **no resoluble** | Semáforo rojo con motivo, Aceptar deshabilitado, Rechazar activo |
| Success · ya resuelta | Modo lectura con el resultado y quién la resolvió |
| **Submitting** | Botones bloqueados, indicador de progreso |
| Error de carga | Mensaje + Reintentar |
| Not found | 404 con vuelta a `/cancellations` |
| Offline | Banner + ambas acciones deshabilitadas |

### Edge cases

| Caso | Resolución |
|---|---|
| Otro operador la resolvió recién | `409 REQUEST_ALREADY_RESOLVED` → recargar en modo lectura |
| La orden se despachó mientras revisabas | `409 ORDER_ALREADY_DISPATCHED` → la solicitud pasa a `REJECTED` |
| Conflicto de concurrencia | `409` → "Alguien más modificó la orden. Recargá y volvé a intentar." |
| Rechazar sin motivo | Pedir `rejection_note` opcional pero sugerida |
| **Aceptar y perder conexión** | Ver sección de desconexión — el caso más peligroso |

---

# F-07 · Vista del cliente ⚪ NO SE CONSTRUYE

Especificada en el doc 06. Queda fuera del slice: el enunciado pide una UI para el flujo de
cancelación, que es back-office. El portal del cliente es una superficie adicional que no
agrega cobertura sobre ninguna regla de negocio.

---

# Pantallas transversales

## Selección de operador · P1

**Ruta:** `/operator`

No hay autenticación real. Un selector de operador que persiste en `localStorage` y viaja como
header en cada request.

**Por qué no auth completa:** la auditoría necesita `requested_by` (doc 03), no necesita un
sistema de identidad. Construir JWT, refresh tokens y guards en una prueba de tres días consume
tiempo que el enunciado no evalúa. Se documenta como decisión de alcance y se entregan las
credenciales de demo que el enunciado pide.

## 404 · P1

Mensaje claro + botón de vuelta al listado correspondiente. Sin stack traces.

## Error irrecuperable · P2

`ErrorHandler` global de Angular. Pantalla con mensaje genérico y botón de recarga. Nunca un
error crudo en pantalla.

---

# Manejo de desconexión

## Detección

`navigator.onLine` más los eventos `online` / `offline`. Un servicio único expone un observable
que consumen el banner y los guards de escritura.

## Comportamiento

| Momento | Qué pasa |
|---|---|
| Offline al cargar | Banner + estado de error con reintento |
| Se corta estando en una pantalla | Banner aparece. Lo cargado sigue visible y navegable. |
| Offline con formulario abierto | Confirmar deshabilitado, con motivo explícito |
| Vuelve la conexión | Banner desaparece. **No se reintenta solo.** |

> **No hay reintento automático de escrituras.** Reenviar sin que el operador lo pida es cómo se
> duplican operaciones. La lectura se puede reintentar sola; la escritura la decide una persona.

## El caso peligroso: se corta después de enviar

El operador aceptó, el request salió, y la conexión murió antes de la respuesta. **No se sabe si
la operación se ejecutó.**

```
┌──────────────────────────────────────────────────────┐
│  ⚠️  No pudimos confirmar el resultado                │
│                                                      │
│  Se perdió la conexión mientras se procesaba la      │
│  operación. Puede haberse completado.                │
│                                                      │
│  Verificá el estado antes de volver a intentar.      │
│                                                      │
│        [ Ver estado de la solicitud ]                │
└──────────────────────────────────────────────────────┘
```

**Nunca ofrecer "Reintentar" acá.** Se ofrece **verificar**.

Y si el operador reintenta desde cero, la `idempotency_key` sigue siendo la misma —se generó al
montar la pantalla— así que un reenvío devuelve el resultado original en lugar de duplicar
(RN-28). El diseño de la clave y el diseño de esta pantalla son la misma decisión.

---

# Mapeo de errores backend → UI

| Código | Mensaje al operador | Acción ofrecida |
|---|---|---|
| `ORDER_ALREADY_DISPATCHED` | "El paquete ya fue despachado. Corresponde tramitar una devolución." | Volver a la orden |
| `ORDER_ALREADY_HAS_CANCELLATION` | "Esta orden ya tuvo su cancelación." | Ver la cancelación existente |
| `NO_CANCELLABLE_ITEMS` | "No hay productos cancelables en esta orden." | Volver a la orden |
| `REQUEST_ALREADY_RESOLVED` | "Otro operador ya resolvió esta solicitud." | Recargar en modo lectura |
| `VALIDATION_ERROR` | Mensaje por campo | Corregir en el formulario |
| `409` de concurrencia | "Alguien más modificó la orden mientras trabajabas." | Recargar y reintentar |
| `500` | "Algo falló de nuestro lado." | Reintentar |
| Timeout / red | Ver caso de desconexión | Verificar estado |

**Los tres primeros no son intercambiables.** Cada uno habilita una acción distinta: uno manda a
devoluciones, otro a una cancelación ya hecha, otro a revisar la orden. Un mensaje genérico deja
al operador sin saber qué hacer.

---

# Plan de ejecución

### Etapa 1 · Base — P0

1. `MoneyDisplay`, `StateBadge`, `ItemStatusChip`
2. `EmptyState`, `ErrorState`
3. Layout, rutas, cliente HTTP con interceptor de errores
4. Selección de operador (mínima)

### Etapa 2 · Lectura — P0

5. F-01 · Listado de órdenes, con sus dos estados vacíos
6. F-02 · Detalle de orden, con estados del botón

### Etapa 3 · Núcleo — P0

7. F-03 · Solicitud, con aviso de irreversibilidad e `idempotency_key`
8. F-04 · Bandeja, con revalidación al listar
9. F-05 · Resolución, con semáforo y `ConfirmDialog`
10. Mapeo completo de errores

### Etapa 4 · Robustez — P1

11. `OfflineBanner` y guards de escritura
12. Pantalla de resultado incierto
13. `CanDeactivate` en F-03
14. Skeletons

### Etapa 5 · Si sobra — P2

15. 404 y error global dedicados
16. `OperationalEffectHint` con textos afinados
17. Historial de solicitudes en F-02

> **La etapa 3 es la que evalúan.** Si el tiempo aprieta, se recorta la 5 y se simplifica la 4,
> nunca la 3. Un flujo completo con estados básicos vale más que pantallas pulidas sin el núcleo
> cerrado.
