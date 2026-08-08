# Migración del mock a una API REST real

## Precondiciones del backend

El backend debe implementar los endpoints consumidos por
`src/app/core/api/tizo-api.service.ts`, usando las formas públicas definidas en
`src/app/core/api/api-contract.ts`, y preservar:

- dinero en unidades menores enteras y moneda ISO-4217;
- endpoints separados para cliente y operaciones;
- proyección cliente sin tienda, hub, estado interno de línea ni efecto operacional;
- `X-Operator-Id` en las rutas `/api/ops`;
- envelopes de error con `code`, `message`, `correlationId` y errores de campo opcionales;
- idempotencia para checkout, creación, aprobación y rechazo;
- reconciliación de solicitudes por clave idempotente;
- resolución atómica de orden, solicitud y auditoría.

## Cambio de configuración

En `src/environments/environment.ts`:

```ts
export const environment = {
  production: true,
  mockApi: false,
  apiBaseUrl: 'https://api.example.com/api',
  demoControls: false,
} as const;
```

Con `mockApi=false`, `src/main.ts` no inicia MSW. Angular conserva los mismos servicios, stores,
rutas y páginas.

## Validación

1. Ejecutar `pnpm build` y comprobar que el bootstrap no intenta registrar el worker.
2. Ejecutar pruebas contractuales contra un entorno aislado del backend.
3. Verificar códigos `409`, especialmente despacho, resolución concurrente e idempotencia.
4. Simular timeout posterior al commit y confirmar que el GET de reconciliación encuentra el
   resultado.
5. Ejecutar la suite E2E con `baseURL` y `apiBaseUrl` del entorno de integración.
6. Revisar que ninguna respuesta cliente incluya campos operacionales.

## Cambios permitidos

Si la API real introduce una diferencia justificada, el ajuste debe quedar en un gateway o mapper de
`data-access`. No se modifican componentes para adaptarlos a DTOs, y los DTOs nunca se almacenan en
ComponentStore ni se exponen a templates.
