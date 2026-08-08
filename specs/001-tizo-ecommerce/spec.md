# Feature Specification: Tizo Ecommerce

**Feature Branch**: `main`  
**Created**: 2026-08-08  
**Status**: Approved  
**Input**: Build the complete Tizo customer and operations experience from the documented flows and
the 21 canonical Stitch references.

## User Scenarios & Testing

### User Story 1 - Comprar y consultar un pedido (Priority: P1)

Un cliente explora el catálogo, revisa un producto, prepara el carrito y confirma una compra demo.
El pedido aparece inmediatamente en su historial con un progreso comprensible.

**Why this priority**: crea el objeto de trabajo que alimenta los demás flujos y demuestra que las
pantallas de cliente forman una experiencia funcional.

**Independent Test**: partir de una sesión restaurada, comprar dos productos y comprobar que el
carrito queda vacío y el nuevo pedido aparece en Mis pedidos con el mismo total.

**Acceptance Scenarios**:

1. **Given** un catálogo con stock, **When** el cliente agrega productos y confirma el carrito,
   **Then** el sistema crea un único pedido y muestra su detalle.
2. **Given** la misma confirmación reenviada, **When** conserva la clave original, **Then** el
   sistema devuelve el pedido existente sin duplicarlo.
3. **Given** un producto o carrito vacío, **When** el cliente consulta la superficie, **Then** ve un
   estado explicativo y una acción de recuperación.

---

### User Story 2 - Investigar pedidos desde Operaciones (Priority: P1)

Un operador selecciona su identidad, filtra pedidos y consulta estados internos por línea para
decidir si corresponde iniciar una cancelación.

**Independent Test**: seleccionar un operador, filtrar por estado, abrir una orden y confirmar que
la URL conserva el filtro y que el detalle muestra estados internos ausentes en la vista cliente.

**Acceptance Scenarios**:

1. **Given** pedidos con estados diferentes, **When** el operador filtra la lista, **Then** la URL y
   los resultados representan el mismo filtro.
2. **Given** una orden existente, **When** abre su detalle, **Then** ve cada línea, sus montos, su
   estado operacional y si puede cancelarse.
3. **Given** una orden inexistente, **When** intenta abrirla, **Then** ve una recuperación a la lista.

---

### User Story 3 - Solicitar una cancelación (Priority: P1)

Un cliente o un operador selecciona líneas completas, explica el motivo y crea una solicitud sin
modificar todavía el pedido.

**Independent Test**: crear una solicitud para una línea válida, recargar la bandeja y comprobar que
la solicitud está `REQUESTED` mientras el pedido conserva su estado anterior.

**Acceptance Scenarios**:

1. **Given** una orden cancelable, **When** el actor selecciona líneas y motivo, **Then** ve el monto
   afectado y puede crear una única solicitud.
2. **Given** un formulario modificado, **When** el actor intenta abandonarlo, **Then** confirma la
   pérdida del borrador.
3. **Given** una orden despachada, una cancelación previa o ninguna línea válida, **When** intenta
   solicitar, **Then** recibe una explicación y una recuperación específica.

---

### User Story 4 - Resolver y auditar cancelaciones (Priority: P1)

Un operador revisa solicitudes pendientes, entiende su efecto operacional y aprueba o rechaza. El
cliente ve el resultado sin detalles internos y el historial conserva quién decidió.

**Independent Test**: aprobar una solicitud y comprobar en una sola observación que la línea queda
cancelada, los montos cambian, la solicitud termina, el historial atribuye al operador y el cliente
ve la proyección actualizada.

**Acceptance Scenarios**:

1. **Given** una solicitud todavía válida, **When** el operador aprueba, **Then** el sistema aplica
   todos los cambios o ninguno y la marca `COMPLETED`.
2. **Given** una solicitud pendiente, **When** el operador rechaza con motivo, **Then** el pedido no
   cambia y el historial registra el rechazo.
3. **Given** que otra persona resolvió la solicitud, **When** el operador confirma, **Then** el
   sistema muestra el conflicto y recarga en modo lectura.
4. **Given** una respuesta perdida después de confirmar, **When** el resultado es incierto, **Then**
   el operador puede verificarlo sin reenviar el comando.

---

### User Story 5 - Recuperarse de estados operativos (Priority: P2)

Cliente y operador pueden reconocer y recuperar estados de carga, vacío, error, desconexión,
recurso inexistente y resultado incierto.

**Independent Test**: activar cada escenario demo y comprobar que muestra título, explicación,
acción apropiada y navegación por teclado.

## Edge Cases

- La misma clave idempotente llega con un payload diferente.
- La orden cambia entre la solicitud y la resolución.
- La conexión se pierde antes o después de que un comando se aplique.
- Todas las líneas de una orden quedan canceladas.
- Algunas líneas quedan activas y determinan el progreso cliente.
- Un pedido no tiene resultados para un filtro compartido.
- Los datos persistidos pertenecen a una versión anterior del mock.

## Requirements

### Functional Requirements

- **FR-001**: El cliente MUST poder explorar productos, mantener un carrito y crear un pedido demo.
- **FR-002**: El sistema MUST representar dinero en unidades menores y conservar una moneda por pedido.
- **FR-003**: El cliente MUST ver una proyección sin estados internos, hub ni tiendas.
- **FR-004**: Operaciones MUST ver estados internos por línea y efectos operacionales.
- **FR-005**: El actor MUST seleccionar líneas completas y un motivo antes de solicitar cancelación.
- **FR-006**: Crear una solicitud MUST dejar el pedido sin cambios hasta su aprobación.
- **FR-007**: El sistema MUST impedir más de una cancelación efectiva por pedido.
- **FR-008**: Aprobar MUST cambiar líneas, montos, estados, solicitud y auditoría de forma atómica.
- **FR-009**: Rechazar MUST conservar el pedido y registrar código, nota y operador.
- **FR-010**: Los comandos MUST ser idempotentes y rechazar una clave reutilizada con otro contenido.
- **FR-011**: Un comando con resultado incierto MUST ofrecer verificación sin reintento automático.
- **FR-012**: Los filtros y pestañas compartibles MUST sobrevivir recarga y navegación mediante URL.
- **FR-013**: Cada superficie MUST representar carga, vacío, error, offline y recurso ausente.
- **FR-014**: La interfaz MUST funcionar por teclado, con foco visible y texto para cada estado.
- **FR-015**: La sesión demo MUST permitir restaurar un conjunto de datos determinista.
- **FR-016**: Los efectos externos MUST conservar un estado separado de la cancelación.

### Key Entities

- **Product**: producto comprable, precio, tienda y stock demo.
- **Cart**: selección temporal del cliente y sus cantidades.
- **Order**: compra, montos, estados derivados y líneas.
- **CancellationRequest**: intención, líneas congeladas, motivo, actor y resolución.
- **Operator**: identidad operacional que atribuye comandos.
- **AuditEvent**: evidencia inmutable de transiciones.
- **RefundProjection**: resultado simulado independiente de la cancelación.

## Assumptions

- La identidad cliente es fija y no requiere autenticación.
- ARS y `es-AR` son los valores demo.
- Los servicios externos son simulados y no generan movimientos reales.
- La cancelación parcial de una cantidad está fuera de alcance.
- La referencia visual vinculante es Stitch TizoFlujo.

## Success Criteria

- **SC-001**: Un usuario puede completar catálogo → carrito → pedido en menos de tres minutos.
- **SC-002**: Un operador puede localizar y abrir una orden en menos de un minuto conservando sus filtros al recargar.
- **SC-003**: Todos los reenvíos idempotentes producen exactamente un pedido o una solicitud.
- **SC-004**: Ningún escenario de fallo transaccional deja cambios parciales observables.
- **SC-005**: Las 21 referencias canónicas tienen una ruta, estado o componente verificable.
- **SC-006**: Las rutas críticas funcionan a 360, 768 y 1280 px sin pérdida de acciones.
- **SC-007**: Las verificaciones automatizadas no reportan violaciones de accesibilidad críticas o serias.
