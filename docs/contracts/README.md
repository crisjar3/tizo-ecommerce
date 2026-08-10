# Contrato de la API oficial de Tizo

La fuente de verdad de transporte para la aplicación Angular es
[`tizo.openapi.yaml`](tizo.openapi.yaml), una copia versionada del contrato publicado por la API
oficial.

- Documentación: <https://d39uqv4p1mtopj.cloudfront.net/docs>
- OpenAPI remoto: <https://d39uqv4p1mtopj.cloudfront.net/openapi/openapi.yaml>
- URL base de producción: `https://d39uqv4p1mtopj.cloudfront.net/api`

## Actualización

```powershell
pnpm api:sync
pnpm api:contract:check
```

`api:sync` descarga el contrato y vuelve a generar los tipos TypeScript. Los tipos generados son
formas de transporte: solamente pueden consumirse desde adaptadores de `data-access`, nunca desde
componentes, rutas o stores.

El linter omite únicamente `no-ambiguous-paths`: el contrato oficial contiene rutas estáticas
`by-idempotency-key` junto a rutas parametrizadas. Angular siempre invoca la ruta estática completa,
por lo que no existe ambigüedad en el cliente.
