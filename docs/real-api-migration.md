# Integración con la API oficial de Tizo

## Estado actual

La aplicación Angular consume la API oficial tanto en desarrollo como en producción:

- Documentación: <https://d39uqv4p1mtopj.cloudfront.net/docs>
- OpenAPI: <https://d39uqv4p1mtopj.cloudfront.net/openapi/openapi.yaml>
- URL base: `https://d39uqv4p1mtopj.cloudfront.net/api`

MSW no forma parte del bundle de producción. El modo mock se inicia explícitamente con
`pnpm start:mock` y utiliza los mismos endpoints y DTO que la API oficial.

## Límites de transporte

El contrato versionado vive en `docs/contracts/tizo.openapi.yaml`. Los tipos generados están en
`src/app/core/api/generated/tizo-api.types.ts` y solo se importan desde adaptadores de
`data-access`. Las rutas, componentes y stores reciben modelos del dominio, nunca DTO HTTP.

Los clientes están separados por capacidad:

- catálogo;
- carrito y checkout;
- pedidos del cliente;
- pedidos operacionales;
- cancelaciones;
- operadores;
- controles del mock.

Las lecturas aplican timeout y reintentos acotados solamente para red, timeout y `5xx`. Los comandos
no se reintentan automáticamente: usan claves idempotentes y, ante un resultado incierto, consultan
el endpoint de reconciliación correspondiente.

## Actualizar el contrato

```powershell
pnpm api:sync
pnpm api:contract:check
```

`api:sync` descarga el OpenAPI oficial, verifica que el documento recibido sea YAML y regenera los
tipos. El cambio debe revisarse antes de adaptar mappers o clientes. Un cambio del backend no debe
propagarse a templates ni ComponentStores.

## Validación local

```powershell
pnpm lint
pnpm test:ci
pnpm build:mock
pnpm build
pnpm e2e
pnpm e2e:official
```

`pnpm e2e` ejecuta la cobertura funcional completa sobre el mock determinístico. La prueba
`e2e:official` valida por navegador las superficies de lectura de catálogo, carrito, pedidos,
operadores y órdenes. Deliberadamente no ejecuta checkout ni cancelaciones contra el entorno oficial
compartido.

## Despliegue

Netlify ejecuta `pnpm run build`. El artefacto resultante:

- usa la URL oficial;
- no contiene `mockServiceWorker.js`;
- elimina cualquier registro legado del worker antes del bootstrap;
- conserva la redirección SPA hacia `index.html` para rutas profundas.

Si se incorpora otro entorno, la única diferencia permitida en configuración es `apiBaseUrl`. Una
diferencia justificada del transporte se resuelve en el cliente o mapper de la feature, sin cambiar
la UI ni el dominio.
