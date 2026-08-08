import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

import type { Operator } from '../../../core/api/api-contract';
import { TizoApiService } from '../../../core/api/tizo-api.service';
import type { ScreenState } from '../../../core/errors/app-error';
import {
  errorScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';

interface OperatorsState {
  readonly operators: ScreenState<readonly Operator[]>;
}

@Injectable()
export class OperatorsStore extends ComponentStore<OperatorsState> {
  private readonly api = inject(TizoApiService);
  readonly operators$ = this.select((state) => state.operators);

  readonly load = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ operators: initialScreenState() })),
      switchMap(() =>
        this.api.listOperators().pipe(
          tapResponse(
            (operators) => this.patchState({ operators: successScreenState(operators) }),
            (error: unknown) =>
              this.patchState({ operators: errorScreenState(normalizeHttpError(error)) }),
          ),
        ),
      ),
    ),
  );

  constructor() {
    super({ operators: initialScreenState() });
  }
}
