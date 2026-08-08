# Research: Tizo Ecommerce

## Angular 16 y runtime

**Decision**: fijar Node 18.20.8, pnpm 10.34.5, Angular CLI 16.2.16 y Angular 16.2.12.  
**Rationale**: satisface la restricción Angular 16 sin depender del pnpm 11 global, que exige Node 22.  
**Alternatives considered**: Angular vigente fue descartado por decisión explícita; npm/Yarn fueron
descartados por la elección de pnpm.

## Estado remoto

**Decision**: HttpClient + ComponentStore 16, con máquinas discriminadas y recarga explícita.  
**Rationale**: evita una dependencia experimental/histórica de TanStack Angular y mantiene un
modelo compatible con Angular 16.  
**Alternatives considered**: TanStack Query histórico y NgRx Store global.

## API simulada

**Decision**: MSW 2 stateful intercepta las mismas rutas REST consumidas por HttpClient.  
**Rationale**: sustituir el mock requiere solo configuración; no existe un gateway alternativo o una
rama de lógica dentro de las features.  
**Alternatives considered**: servidor Fastify separado y servicios Angular con datos embebidos.

## Persistencia e idempotencia

**Decision**: base versionada en sessionStorage e idempotency ledger con fingerprint estable.  
**Rationale**: soporta refresh, escenarios E2E y reenvío sin contaminar sesiones posteriores.  
**Alternatives considered**: memoria volátil e IndexedDB. IndexedDB no aporta valor para el volumen
demo y complica transacciones de prueba.

## Diseño visual

**Decision**: reconstruir las 21 referencias de TizoFlujo con tokens propios y componentes
semánticos.  
**Rationale**: Stitch es autoridad visual, pero su HTML no define los límites Angular ni la
accesibilidad.  
**Alternatives considered**: copiar HTML generado o adoptar Angular Material visualmente.

## Pruebas

**Decision**: Jasmine/Karma para unidad e integración Angular; Playwright/Axe para recorrido,
responsive, visual y accesibilidad.  
**Rationale**: conserva el runner estable del legado Angular 16 y cubre comportamiento del navegador.  
**Alternatives considered**: migrar el unit runner a Vitest/Jest, descartado para reducir fricción
de compatibilidad.
