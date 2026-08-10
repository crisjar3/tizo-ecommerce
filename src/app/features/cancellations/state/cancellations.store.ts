import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { exhaustMap, switchMap, tap } from 'rxjs';

import type {
  AuditEvent,
  CancellationRequest,
  CreateCancellationCommand,
  ResolveCancellationCommand,
} from '../../../core/api/api-contract';
import type { CommandState, ScreenState } from '../../../core/errors/app-error';
import {
  beginScreenState,
  failScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';
import { CancellationsApiClient } from '../data-access/cancellations-api.client';
import type { IdempotencyScope } from '../data-access/cancellations-api.client';

interface CancellationsState {
  readonly requests: ScreenState<readonly CancellationRequest[]>;
  readonly selected: ScreenState<CancellationRequest>;
  readonly history: ScreenState<readonly AuditEvent[]>;
  readonly command: CommandState<CancellationRequest>;
  readonly reconciliation: { readonly customer: boolean; readonly scope: IdempotencyScope } | null;
}

interface CreateRequestEffect {
  readonly command: CreateCancellationCommand;
  readonly customer: boolean;
}

interface ResolveRequestEffect {
  readonly requestId: string;
  readonly action: 'approve' | 'reject';
  readonly command: ResolveCancellationCommand;
}

@Injectable()
export class CancellationsStore extends ComponentStore<CancellationsState> {
  private readonly api = inject(CancellationsApiClient);
  readonly requests$ = this.select((state) => state.requests);
  readonly selected$ = this.select((state) => state.selected);
  readonly history$ = this.select((state) => state.history);
  readonly command$ = this.select((state) => state.command);

  readonly loadRequests = this.effect<string>((status$) =>
    status$.pipe(
      tap(() => this.patchState({ requests: beginScreenState(this.get().requests) })),
      switchMap((status) =>
        this.api.list(status).pipe(
          tapResponse(
            (requests) => this.patchState({ requests: successScreenState(requests) }),
            (error: unknown) =>
              this.patchState({
                requests: failScreenState(this.get().requests, normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  readonly loadRequest = this.effect<string>((requestId$) =>
    requestId$.pipe(
      tap(() => this.patchState({ selected: beginScreenState(this.get().selected) })),
      switchMap((requestId) =>
        this.api.get(requestId).pipe(
          tapResponse(
            (request) => this.patchState({ selected: successScreenState(request) }),
            (error: unknown) =>
              this.patchState({
                selected: failScreenState(this.get().selected, normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  readonly loadHistory = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ history: beginScreenState(this.get().history) })),
      switchMap(() =>
        this.api.history().pipe(
          tapResponse(
            (history) => this.patchState({ history: successScreenState(history) }),
            (error: unknown) =>
              this.patchState({
                history: failScreenState(this.get().history, normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  readonly create = this.effect<CreateRequestEffect>((effect$) =>
    effect$.pipe(
      exhaustMap(({ command, customer }) => {
        this.patchState({
          command: { status: 'submitting' },
          reconciliation: { customer, scope: 'CREATE' },
        });
        return this.api.create(command, customer).pipe(
          tapResponse(
            (request) =>
              this.patchState({
                selected: successScreenState(request),
                command: { status: 'success', data: request },
              }),
            (error: unknown) => this.setCommandError(error, command.idempotencyKey),
          ),
        );
      }),
    ),
  );

  readonly resolve = this.effect<ResolveRequestEffect>((effect$) =>
    effect$.pipe(
      exhaustMap(({ requestId, action, command }) => {
        this.patchState({
          command: { status: 'submitting' },
          reconciliation: { customer: false, scope: action === 'approve' ? 'APPROVE' : 'REJECT' },
        });
        const request$ =
          action === 'approve'
            ? this.api.approve(requestId, command)
            : this.api.reject(requestId, command);
        return request$.pipe(
          tapResponse(
            (request) =>
              this.patchState({
                selected: successScreenState(request),
                command: { status: 'success', data: request },
              }),
            (error: unknown) => this.setCommandError(error, command.idempotencyKey),
          ),
        );
      }),
    ),
  );

  readonly reconcile = this.effect<string>((key$) =>
    key$.pipe(
      exhaustMap((key) => {
        const reconciliation = this.get().reconciliation;
        const request$ = reconciliation?.customer
          ? this.api.reconcileCustomer(key)
          : this.api.reconcileOps(key, reconciliation?.scope ?? 'CREATE');
        return request$.pipe(
          tapResponse(
            (request) =>
              this.patchState({
                selected: successScreenState(request),
                command: { status: 'success', data: request },
              }),
            (error: unknown) => this.setCommandError(error, key),
          ),
        );
      }),
    ),
  );

  readonly resetCommand = this.updater((state) => ({ ...state, command: { status: 'idle' } }));

  constructor() {
    super({
      requests: initialScreenState(),
      selected: initialScreenState(),
      history: initialScreenState(),
      command: { status: 'idle' },
      reconciliation: null,
    });
  }

  private setCommandError(error: unknown, idempotencyKey: string): void {
    const appError = normalizeHttpError(error, true);
    this.patchState({
      command:
        appError.recovery === 'verify-command'
          ? { status: 'uncertain', error: appError, idempotencyKey }
          : { status: 'error', error: appError },
    });
  }
}
