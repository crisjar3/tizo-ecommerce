# Quickstart: validar Tizo Ecommerce

## Prerrequisitos

- Node 18.20.8 activo mediante fnm.
- Corepack habilitado.
- pnpm 10.34.5 indicado por `package.json`.

## Ejecutar

```powershell
fnm use 18.20.8
corepack pnpm install --frozen-lockfile
corepack pnpm start
```

Abrir `http://localhost:4200`. La configuración development inicia MSW y muestra una franja
"Entorno demo".

## Flujo principal

1. Restaurar datos demo desde el menú.
2. Abrir `/shop`, agregar dos productos y completar el checkout.
3. Confirmar el pedido en `/my/orders` y anotar su identificador.
4. Elegir un operador en `/operator`.
5. Abrir el pedido en `/orders`, seleccionar una línea y crear la solicitud.
6. Resolverla desde `/cancellations`.
7. Volver a `/my/orders/:id` y comprobar monto y línea cancelada.
8. Consultar `/cancellations/history` para verificar actor y resolución.

## Escenarios de recuperación

El panel demo permite activar loading, empty, error, offline, conflicto y timeout posterior al
commit. En el último caso la UI debe mostrar resultado incierto y resolverlo mediante verificación,
sin repetir el POST.

## Quality gate

```powershell
corepack pnpm lint
corepack pnpm test:ci
corepack pnpm build:demo
corepack pnpm build
corepack pnpm e2e
```

El contrato esperado está en [contracts/openapi.yaml](contracts/openapi.yaml).
