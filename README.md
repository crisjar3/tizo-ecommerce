# Tizo Ecommerce

Demo funcional de ecommerce y backoffice construida con Angular 16. Incluye catálogo, carrito,
checkout, pedidos del cliente, investigación operacional, solicitudes de cancelación, resolución
concurrente, reconciliación de resultados inciertos e historial auditable.

La aplicación consume un contrato REST tipado. En desarrollo ese contrato lo implementa un mock
stateful con MSW; en producción el mock está desactivado y la misma UI queda preparada para una API
real.

## Requisitos

- Node.js `18.20.8`.
- pnpm `10.34.5`.
- Chromium de Playwright para pruebas E2E.

Las versiones son deliberadamente exactas porque Angular 16 y Node 18 son líneas legadas. No uses el
pnpm global si no coincide con `packageManager`.

MSW queda fijado en `2.8.7`. Aunque MSW `2.15.0` declara Node 18, dependencias transitivas como
`type-fest@5` y `@inquirer/confirm@6` exigen Node 20 o superior y son incompatibles con
`engine-strict=true` en este proyecto.

```powershell
fnm use 18.20.8
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

## Ejecutar la aplicación

```powershell
pnpm start
```

Abrí `http://localhost:4200`. El entorno de desarrollo activa MSW y muestra el control flotante
**Demo**, desde donde se pueden reproducir estados de carga, vacío, error, offline e incertidumbre.

Rutas principales:

| Superficie  | Rutas                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| Cliente     | `/shop`, `/cart`, `/my/orders`, `/my/orders/:orderId`                            |
| Operaciones | `/operator`, `/orders`, `/cancellations`, `/cancellations/history`, `/operators` |

## Comprobaciones

```powershell
pnpm format:check
pnpm lint
pnpm test:ci
pnpm build:demo
pnpm build
pnpm e2e
```

`pnpm test:ci` ejecuta Karma con Chromium de Playwright y genera cobertura. `pnpm e2e` levanta la
aplicación en el puerto 4300 y ejecuta flujos funcionales, Axe, responsive y regresión visual.

Para aceptar intencionalmente un cambio visual después de revisarlo:

```powershell
pnpm e2e:update -- e2e/visual.spec.ts
```

## Arquitectura

La estructura es feature-first:

```text
src/app/
├── core/                 # HTTP, contrato, errores, red, sesión y configuración demo
├── shared/ui/            # shells y componentes visuales sin reglas de negocio
└── features/
    ├── catalog/
    ├── cart/
    ├── customer-orders/
    ├── ops-orders/
    ├── cancellations/
    └── operators/
```

- Las páginas no usan `HttpClient`; delegan en ComponentStores y en `TizoApiService`.
- El Router conserva búsqueda, filtros y pestañas compartibles.
- Los formularios reactivos tipados poseen selección, validación y estado sucio.
- El mock y la API real comparten las formas públicas documentadas en
  `specs/001-tizo-ecommerce/contracts/openapi.yaml`.
- El dinero se representa en unidades menores enteras mediante `Money`.
- Las mutaciones nunca se reintentan automáticamente. Un timeout queda en estado `uncertain` y se
  reconcilia por clave idempotente.

## Datos y escenarios del mock

MSW persiste la base versionada en `sessionStorage`; el operador seleccionado vive en
`localStorage`. **Restaurar datos seed** borra pedidos y decisiones creados durante la sesión.

El catálogo completo de escenarios y sus efectos está en
[docs/mock-scenarios.md](docs/mock-scenarios.md).

## Conectar la API REST real

El build de producción ya usa:

```ts
mockApi: false;
```

Para conectar el backend:

1. Configurá `apiBaseUrl` en `src/environments/environment.ts`.
2. Implementá el OpenAPI de `specs/001-tizo-ecommerce/contracts/openapi.yaml`.
3. Conservá `X-Operator-Id`, códigos de dominio, `correlationId` e idempotencia.
4. Ejecutá ambos builds y la suite contractual/E2E.

No deberían cambiar rutas, páginas, ComponentStores ni componentes. Si el backend justifica otra
forma de transporte, ajustá el mapper de `data-access`, sin filtrar DTOs a la UI. La guía detallada
está en [docs/real-api-migration.md](docs/real-api-migration.md).

## Documentación de producto

- [Flujos F01–F07](docs/06-flujos.md).
- [Arquitectura Angular](docs/08-arquitectura-frontend-angular.md).
- [Visión de producto](PRODUCT.md).
- [Decisiones visuales](DESIGN.md).
- [Manifiesto de pantallas Stitch](docs/stitch-screen-manifest.md).
- [Especificación ejecutable](specs/001-tizo-ecommerce/spec.md).
