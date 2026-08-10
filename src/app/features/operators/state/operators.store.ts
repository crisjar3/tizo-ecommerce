import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

import type { Operator } from '../../../core/api/api-contract';
import type { ScreenState } from '../../../core/errors/app-error';
import {
  beginScreenState,
  failScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';
import { OperatorsApiClient } from '../data-access/operators-api.client';

interface OperatorsState {
  readonly operators: ScreenState<readonly Operator[]>;
}

@Injectable()
export class OperatorsStore extends ComponentStore<OperatorsState> {
  private readonly api = inject(OperatorsApiClient);
  readonly operators$ = this.select((state) => state.operators);

  readonly load = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ operators: beginScreenState(this.get().operators) })),
      switchMap(() =>
        this.api.list().pipe(
          tapResponse(
            (operators) => this.patchState({ operators: successScreenState(operators) }),
            (error: unknown) =>
              this.patchState({
                operators: failScreenState(this.get().operators, normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  constructor() {
    super({ operators: initialScreenState() });
  }
}
