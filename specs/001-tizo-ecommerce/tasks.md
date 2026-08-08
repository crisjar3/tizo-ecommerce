# Tasks: Tizo Ecommerce

## Phase 1: Setup

- [x] T001 Scaffold Angular 16 standalone project in `angular.json` and `src/`
- [x] T002 Pin Node, pnpm and package engines in `package.json`, `.nvmrc` and `.npmrc`
- [x] T003 Configure strict TypeScript and Angular compilation in `tsconfig*.json`
- [ ] T004 Configure ESLint, unit scripts and Playwright in `eslint.config.js` and `playwright.config.ts`
- [x] T005 Configure development, demo and production environments in `src/environments/`

## Phase 2: Foundational

- [x] T006 [P] Create design tokens and global browser surfaces in `src/styles/_tokens.scss` and `src/styles.scss`
- [x] T007 [P] Define domain and API contract types in `src/app/core/api/api-contract.ts`
- [x] T008 [P] Implement ScreenState, CommandState and AppError in `src/app/core/errors/`
- [x] T009 [P] Implement operator session and HTTP context in `src/app/core/session/`
- [x] T010 Implement MSW database, seeds and persistence in `src/mocks/`
- [x] T011 Implement idempotent MSW handlers in `src/mocks/handlers.ts`
- [x] T012 Implement runtime mock bootstrap in `src/main.ts` and `src/mocks/browser.ts`
- [x] T013 Implement shared shells and UI primitives in `src/app/shared/ui/`
- [x] T014 Configure lazy route groups in `src/app/app.routes.ts`

## Phase 3: User Story 1 - Comprar y consultar un pedido

**Independent test**: catalog → cart → checkout produces one visible order and empties the cart.

- [x] T015 [P] [US1] Test money and customer projection in `src/app/features/customer-orders/domain/*.spec.ts`
- [x] T016 [P] [US1] Implement catalog gateway and store in `src/app/features/catalog/`
- [x] T017 [P] [US1] Implement cart gateway and store in `src/app/features/cart/`
- [x] T018 [US1] Implement marketplace and product pages in `src/app/features/catalog/ui/`
- [x] T019 [US1] Implement cart and idempotent checkout page in `src/app/features/cart/ui/`
- [x] T020 [US1] Implement customer orders list/detail in `src/app/features/customer-orders/`

## Phase 4: User Story 2 - Investigar pedidos desde Operaciones

**Independent test**: selecting an operator and a URL filter exposes internal order details only in OPS.

- [ ] T021 [P] [US2] Test order DTO mappers in `src/app/features/ops-orders/data-access/*.spec.ts`
- [x] T022 [P] [US2] Implement operator selector and team pages in `src/app/features/operators/`
- [x] T023 [US2] Implement operations order store and URL filters in `src/app/features/ops-orders/state/`
- [x] T024 [US2] Implement seamless list/detail order page in `src/app/features/ops-orders/ui/`
- [x] T025 [US2] Implement order not-found and recovery behavior in `src/app/features/ops-orders/`

## Phase 5: User Story 3 - Solicitar una cancelación

**Independent test**: creating a request leaves the order unchanged and adds one REQUESTED item.

- [x] T026 [P] [US3] Test cancelability and affected amount rules in `src/app/features/cancellations/domain/*.spec.ts`
- [x] T027 [US3] Implement typed cancellation gateway in `src/app/features/cancellations/data-access/`
- [x] T028 [US3] Implement ComponentStore command states in `src/app/features/cancellations/state/`
- [x] T029 [US3] Implement OPS cancellation form in `src/app/features/cancellations/ui/ops-cancel-page.component.ts`
- [x] T030 [US3] Implement customer cancellation form in `src/app/features/cancellations/ui/customer-cancel-page.component.ts`
- [x] T031 [US3] Implement unsaved form guard in `src/app/features/cancellations/guards/`

## Phase 6: User Story 4 - Resolver y auditar cancelaciones

**Independent test**: approve/reject changes all required entities atomically and history attributes the operator.

- [ ] T032 [P] [US4] Test approval, rejection and idempotency transactions in `src/mocks/*.spec.ts`
- [x] T033 [US4] Implement request inbox and URL tabs in `src/app/features/cancellations/ui/inbox-page.component.ts`
- [x] T034 [US4] Implement request detail and operational effect panel in `src/app/features/cancellations/ui/request-detail.component.ts`
- [x] T035 [US4] Implement accessible approve/reject confirmation in `src/app/features/cancellations/ui/resolve-dialog.component.ts`
- [x] T036 [US4] Implement uncertain outcome reconciliation in `src/app/features/cancellations/state/`
- [x] T037 [US4] Implement cancellation history in `src/app/features/cancellations/ui/history-page.component.ts`
- [x] T038 [US4] Refresh customer and OPS projections after resolution in `src/app/features/cancellations/`

## Phase 7: User Story 5 - Recuperarse de estados operativos

**Independent test**: each demo scenario renders a labelled state with keyboard-accessible recovery.

- [x] T039 [P] [US5] Implement loading, empty, error and not-found states in `src/app/shared/ui/`
- [x] T040 [P] [US5] Implement offline banner and network service in `src/app/core/network/`
- [ ] T041 [US5] Implement demo scenario panel and reset action in `src/app/shared/ui/demo-panel/`
- [x] T042 [US5] Map domain error codes to recovery actions in `src/app/core/errors/error-mapper.ts`

## Phase 8: Polish and Cross-Cutting Concerns

- [ ] T043 Add E2E customer purchase test in `e2e/customer-purchase.spec.ts`
- [ ] T044 Add E2E cancellation lifecycle test in `e2e/cancellation-lifecycle.spec.ts`
- [ ] T045 Add offline, conflict and uncertainty E2E tests in `e2e/recovery.spec.ts`
- [ ] T046 Add responsive and accessibility checks in `e2e/accessibility.spec.ts`
- [ ] T047 Add canonical visual snapshots in `e2e/visual.spec.ts`
- [ ] T048 Configure frozen quality pipeline in `.github/workflows/quality.yml`
- [ ] T049 Document execution and real API migration in `README.md`
- [ ] T050 Run final build, detector and visual review over `src/app/` and `src/styles.scss`

## Dependencies

`Setup → Foundational → US1/US2 → US3 → US4 → US5 → Polish`

US1 and US2 can proceed independently after Foundational. US3 depends on order contracts from both.
US4 depends on US3. US5 components begin in Foundational and finish after feature states exist.

## Implementation Strategy

The first demonstrable slice is US1. Each later story remains independently testable and includes
its contract, state, UI and tests before the next story begins.
