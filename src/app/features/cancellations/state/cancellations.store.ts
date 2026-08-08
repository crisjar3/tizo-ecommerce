import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { EMPTY, switchMap, tap } from 'rxjs';

import type {
  AuditEvent,
  CancellationRequest,
  CreateCancellationCommand,
  ResolveCancellationCommand,
} from '../../../core/api/api-contract';
import { TizoApiService } from '../../../core/api/tizo-api.service';
import type { CommandState, ScreenState } from '../../../core/errors/app-error';
import {
  errorScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';

interface CancellationsState {
  readonly requests: ScreenState<readonly CancellationRequest[]>;
  readonly selected: ScreenState<CancellationRequest>;
  readonly history: ScreenState<readonly AuditEvent[]>;
  readonly command: CommandState<CancellationRequest>;
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
  private readonly api = inject(TizoApiService);
  readonly requests$ = this.select((state) => state.requests);
  readonly selected$ = this.select((state) => state.selected);
  readonly history$ = this.select((state) => state.history);
  readonly command$ = this.select((state) => state.command);

  readonly loadRequests = this.effect<string>((status$) =>
    status$.pipe(
      tap(() => this.patchState({ requests: initialScreenState() })),
      switchMap((status) =>
        this.api.listCancellationRequests(status).pipe(
          tapResponse(
            (requests) => this.patchState({ requests: successScreenState(requests) }),
            (error: unknown) =>
              this.patchState({ requests: errorScreenState(normalizeHttpError(error)) }),
          ),
        ),
      ),
    ),
  );

  readonly loadRequest = this.effect<string>((requestId$) =>
    requestId$.pipe(
      tap(() => this.patchState({ selected: initialScreenState() })),
      switchMap((requestId) =>
        this.api.getCancellationRequest(requestId).pipe(
          tapResponse(
            (request) => this.patchState({ selected: successScreenState(request) }),
            (error: unknown) =>
              this.patchState({ selected: errorScreenState(normalizeHttpError(error)) }),
          ),
        ),
      ),
    ),
  );

  readonly loadHistory = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ history: initialScreenState() })),
      switchMap(() =>
        this.api.listCancellationHistory().pipe(
          tapResponse(
            (history) => this.patchState({ history: successScreenState(history) }),
            (error: unknown) =>
              this.patchState({ history: errorScreenState(normalizeHttpError(error)) }),
          ),
        ),
      ),
    ),
  );

  readonly create = this.effect<CreateRequestEffect>((effect$) =>
    effect$.pipe(
      switchMap(({ command, customer }) => {
        if (this.get().command.status === 'submitting') return EMPTY;
        this.patchState({ command: { status: 'submitting' } });
        return this.api.createCancellation(command, customer).pipe(
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
      switchMap(({ requestId, action, command }) => {
        if (this.get().command.status === 'submitting') return EMPTY;
        this.patchState({ command: { status: 'submitting' } });
        const request$ =
          action === 'approve'
            ? this.api.approveCancellation(requestId, command)
            : this.api.rejectCancellation(requestId, command);
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
      switchMap((key) =>
        this.api.reconcileCancellation(key).pipe(
          tapResponse(
            (request) =>
              this.patchState({
                selected: successScreenState(request),
                command: { status: 'success', data: request },
              }),
            (error: unknown) => this.setCommandError(error, key),
          ),
        ),
      ),
    ),
  );

  readonly resetCommand = this.updater((state) => ({ ...state, command: { status: 'idle' } }));

  constructor() {
    super({
      requests: initialScreenState(),
      selected: initialScreenState(),
      history: initialScreenState(),
      command: { status: 'idle' },
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
