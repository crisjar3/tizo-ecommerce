<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Added principles: domain-first boundaries, typed contracts, explicit state ownership,
  safe mutations, accessible visual fidelity, verified increments
- Added sections: technology constraints, delivery workflow
- Removed sections: none
- Deferred TODOs: none
-->
# Tizo Ecommerce Constitution

## Core Principles

### I. Domain-First Feature Boundaries

Code MUST be organized by business capability. Domain rules MUST remain pure TypeScript and MUST
not depend on Angular, HTTP, MSW or browser storage. Shared modules MUST not import features.

### II. Typed Contracts at Every Boundary

TypeScript strict mode is mandatory. DTOs MUST stay inside data-access and MUST be mapped to domain
models before reaching state or UI. Money MUST use integer minor units and an ISO-4217 currency.

### III. Explicit State Ownership

The Router owns shareable navigation state, typed forms own drafts, ComponentStore owns feature
orchestration, and the API owns remote truth. Screen and command states MUST use discriminated unions
instead of combinations of unrelated booleans.

### IV. Safe and Reconcilable Commands

Mutations MUST NOT retry automatically. Every creation or resolution command MUST be idempotent.
Timeouts after submission MUST produce an uncertain state with a verification path. Cancellation
state MUST remain independent from notification and refund effects.

### V. Accessible Visual Fidelity

Stitch TizoFlujo is the binding visual authority. Interfaces MUST meet WCAG 2.2 AA, work by keyboard,
communicate status with text and color, support 360 px width, and expose loading, empty, error,
offline, not-found and uncertain states.

### VI. Verified Increments

Every feature commit MUST compile and include its relevant tests. The final tree MUST pass lint, unit,
contract, build, E2E, accessibility and visual checks. Secrets MUST never enter Git.

## Technology Constraints

- Angular 16.2 standalone and Node 18.20.8 are explicit legacy constraints.
- pnpm 10.34.5 and `pnpm-lock.yaml` are the only package resolution mechanism.
- HttpClient and ComponentStore 16 implement remote orchestration; NgRx global Store is excluded
  until a cross-feature event model justifies it.
- MSW implements the REST contract in development/demo and MUST be disabled in production.
- Angular components MUST use OnPush change detection and typed reactive forms where forms exist.

## Delivery Workflow

Spec Kit artifacts define behavior before implementation. Work proceeds in independently testable
user-story slices. Conventional commits preserve each stable increment. Contract or domain changes
MUST update the specification, OpenAPI document and affected tests in the same change.

## Governance

This constitution supersedes local convenience. Amendments require a documented rationale, migration
impact and semantic version change. Reviews MUST verify the constitution gates before accepting a
feature. A violation requires an explicit exception in the implementation plan with an owner and a
removal condition.

**Version**: 1.0.0 | **Ratified**: 2026-08-08 | **Last Amended**: 2026-08-08
