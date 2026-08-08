# Implementation Plan: Tizo Ecommerce

**Branch**: `main` | **Date**: 2026-08-08 | **Spec**: [spec.md](spec.md)

## Summary

Construir una SPA Angular 16 standalone que conecte compra, pedidos y cancelaciones mediante un
contrato REST tipado. HttpClient conserva el mismo comportamiento con MSW stateful o con la API
real. ComponentStore modela consultas y comandos por feature; Router y formularios conservan sus
propias responsabilidades. Stitch TizoFlujo define la composición y los tokens.

## Technical Context

**Language/Version**: TypeScript 5.1.6, Angular 16.2.12, Node 18.20.8  
**Primary Dependencies**: Angular Router/HttpClient/CDK, NgRx ComponentStore 16.3, MSW 2.15,
Lucide Angular, Fontsource Manrope  
**Storage**: sessionStorage versionado para la base mock; localStorage para operador activo  
**Testing**: Jasmine/Karma, HttpTestingController, Playwright 1.52 y Axe  
**Target Platform**: navegadores evergreen de escritorio y web móvil desde 360 px  
**Project Type**: SPA web con contrato REST externo  
**Performance Goals**: interacción fluida a 60 fps; contenido inicial dentro del presupuesto Angular  
**Constraints**: Angular/Node legados, sin SSR/PWA, sin backend o pagos reales, WCAG 2.2 AA  
**Scale/Scope**: 21 referencias Stitch, 15 rutas, 5 historias y una sesión demo determinista

## Constitution Check

### Pre-design gate

- PASS: feature-first y dominio puro.
- PASS: contrato tipado y mappers impiden que DTOs lleguen a UI.
- PASS: Router, formularios, ComponentStore y API tienen propietarios explícitos.
- PASS: comandos idempotentes, sin retry automático y con reconciliación.
- PASS: TizoFlujo y WCAG son criterios verificables.
- PASS: cada slice incluye pruebas y commit compilable.

### Post-design gate

El modelo de datos, OpenAPI y quickstart preservan todos los principios. No se requieren excepciones
ni complejidad adicional.

## Project Structure

### Documentation

```text
specs/001-tizo-ecommerce/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/openapi.yaml
|-- checklists/requirements.md
`-- tasks.md
```

### Source Code

```text
src/
|-- app/
|   |-- core/{api,errors,network,session}
|   |-- shared/ui
|   `-- features/{catalog,cart,customer-orders,ops-orders,cancellations,operators}
|-- environments
|-- mocks/{db,handlers,seeds}
`-- styles
e2e/
```

**Structure Decision**: una aplicación en la raíz. Cada feature agrupa domain, data-access, state,
ui y routes. El mock vive fuera de `app` y se importa dinámicamente únicamente en configuraciones
demo/desarrollo.

## Delivery Order

1. Toolchain y scaffold estricto.
2. Design system, shells y estados compartidos.
3. Contratos, errores, sesión, mock y persistencia.
4. Cliente: catálogo, carrito, checkout y pedidos.
5. Operaciones: órdenes, solicitudes, resolución e historial.
6. Escenarios de error, QA, CI y handoff.

## Complexity Tracking

No hay violaciones de la constitución.
