# Tizo Ecommerce

Aplicación funcional de ecommerce y backoffice construida con Angular 16. Incluye catálogo, carrito,
checkout, pedidos del cliente, investigación operacional, solicitudes de cancelación, resolución
concurrente, reconciliación de resultados inciertos e historial auditable.

La aplicación consume la API oficial de Tizo en desarrollo y producción. Su OpenAPI se versiona y
genera los DTO de transporte; cada feature los adapta a modelos del dominio antes de llegar al estado
o a la interfaz. El mock stateful con MSW se conserva como un entorno aislado para pruebas y demos.

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

Abrí `http://localhost:4200`. Esta ejecución usa
`https://d39uqv4p1mtopj.cloudfront.net/api` y no registra el worker de MSW.

Para trabajar con datos determinísticos sin escribir en la API oficial:

```powershell
pnpm start:mock
```

El modo mock muestra el control flotante **Demo**, desde donde se pueden reproducir estados de carga,
vacío, error, offline e incertidumbre.

Rutas principales:

| Superficie  | Rutas                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| Cliente     | `/shop`, `/cart`, `/my/orders`, `/my/orders/:orderId`                            |
| Operaciones | `/operator`, `/orders`, `/cancellations`, `/cancellations/history`, `/operators` |

## Comprobaciones

```powershell
pnpm format:check
pnpm lint
pnpm api:contract:check
pnpm test:ci
pnpm build:mock
pnpm build
pnpm e2e
pnpm e2e:official
```

`pnpm test:ci` ejecuta Karma con Chromium de Playwright y genera cobertura. `pnpm e2e` levanta la
aplicación mock en el puerto 4300 y ejecuta flujos funcionales, Axe, responsive y regresión visual.
`pnpm e2e:official` ejecuta únicamente lecturas seguras contra la API oficial desde localhost; no
crea pedidos ni cancelaciones.

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

- Las páginas no usan `HttpClient`; delegan en ComponentStores y clientes pequeños por feature.
- El Router conserva búsqueda, filtros y pestañas compartibles.
- Los formularios reactivos tipados poseen selección, validación y estado sucio.
- Los DTO se generan desde
  [`docs/contracts/tizo.openapi.yaml`](docs/contracts/tizo.openapi.yaml) y permanecen dentro de
  `data-access`.
- Los modelos de [`src/app/core/api/api-contract.ts`](src/app/core/api/api-contract.ts) son
  independientes de las formas HTTP.
- El dinero se representa en unidades menores enteras mediante `Money`.
- Las mutaciones nunca se reintentan automáticamente. Un timeout queda en estado `uncertain` y se
  reconcilia por clave idempotente.

## Datos y escenarios del mock

El mock se inicia únicamente con `pnpm start:mock`. MSW persiste la base versionada en
`sessionStorage`; el operador seleccionado vive en
`localStorage`. **Restaurar datos seed** borra pedidos y decisiones creados durante la sesión.

El catálogo completo de escenarios y sus efectos está en
[docs/mock-scenarios.md](docs/mock-scenarios.md).

## API oficial

Desarrollo, producción y Netlify usan:

```ts
mockApi: false;
apiBaseUrl: 'https://d39uqv4p1mtopj.cloudfront.net/api';
```

El cliente envía `X-Operator-Id` en el contexto operacional, normaliza errores RFC 9457 y conserva
idempotencia y reconciliación para los comandos. Para actualizar el contrato publicado ejecutá
`pnpm api:sync`, revisá el diff y validá con `pnpm api:contract:check`. La guía detallada está en
[docs/real-api-migration.md](docs/real-api-migration.md).

## Documentación de producto

- [Flujos F01–F07](docs/06-flujos.md).
- [Arquitectura Angular](docs/08-arquitectura-frontend-angular.md).
- [Visión de producto](PRODUCT.md).
- [Decisiones visuales](DESIGN.md).
- [Manifiesto de pantallas Stitch](docs/stitch-screen-manifest.md).
