import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { EMPTY, switchMap, tap } from 'rxjs';

import type { Cart, CustomerOrder } from '../../../core/api/api-contract';
import { TizoApiService } from '../../../core/api/tizo-api.service';
import type { CommandState, ScreenState } from '../../../core/errors/app-error';
import {
  errorScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';

interface CartState {
  readonly cart: ScreenState<Cart>;
  readonly command: CommandState<CustomerOrder | Cart>;
  readonly checkoutKey: string | null;
}

interface QuantityCommand {
  readonly productId: string;
  readonly quantity: number;
}

const initialState: CartState = {
  cart: initialScreenState(),
  command: { status: 'idle' },
  checkoutKey: null,
};

@Injectable({ providedIn: 'root' })
export class CartStore extends ComponentStore<CartState> {
  private readonly api = inject(TizoApiService);

  readonly cart$ = this.select((state) => state.cart);
  readonly command$ = this.select((state) => state.command);

  readonly load = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ cart: initialScreenState() })),
      switchMap(() =>
        this.api.getCart().pipe(
          tapResponse(
            (cart) => this.patchState({ cart: successScreenState(cart) }),
            (error: unknown) =>
              this.patchState({ cart: errorScreenState(normalizeHttpError(error)) }),
          ),
        ),
      ),
    ),
  );

  readonly setQuantity = this.effect<QuantityCommand>((command$) =>
    command$.pipe(
      tap(() => this.patchState({ command: { status: 'submitting' } })),
      switchMap(({ productId, quantity }) =>
        this.api.setCartQuantity(productId, quantity).pipe(
          tapResponse(
            (cart) =>
              this.patchState({
                cart: successScreenState(cart),
                command: { status: 'success', data: cart },
              }),
            (error: unknown) =>
              this.patchState({
                command: { status: 'error', error: normalizeHttpError(error, true) },
              }),
          ),
        ),
      ),
    ),
  );

  readonly removeItem = this.effect<string>((productId$) =>
    productId$.pipe(
      tap(() => this.patchState({ command: { status: 'submitting' } })),
      switchMap((productId) =>
        this.api.removeCartItem(productId).pipe(
          tapResponse(
            (cart) =>
              this.patchState({
                cart: successScreenState(cart),
                command: { status: 'success', data: cart },
              }),
            (error: unknown) =>
              this.patchState({
                command: { status: 'error', error: normalizeHttpError(error, true) },
              }),
          ),
        ),
      ),
    ),
  );

  readonly checkout = this.effect<void>((trigger$) =>
    trigger$.pipe(
      switchMap(() => {
        if (this.get().command.status === 'submitting') return EMPTY;
        const idempotencyKey = this.get().checkoutKey ?? crypto.randomUUID();
        this.patchState({ checkoutKey: idempotencyKey, command: { status: 'submitting' } });
        return this.api.checkout({ idempotencyKey }).pipe(
          tapResponse(
            (order) =>
              this.patchState({
                cart: successScreenState({
                  items: [],
                  itemCount: 0,
                  total: { amountMinor: 0, currency: 'ARS' },
                }),
                command: { status: 'success', data: order },
                checkoutKey: null,
              }),
            (error: unknown) => {
              const appError = normalizeHttpError(error, true);
              this.patchState({
                command:
                  appError.recovery === 'verify-command'
                    ? { status: 'uncertain', error: appError, idempotencyKey }
                    : { status: 'error', error: appError },
              });
            },
          ),
        );
      }),
    ),
  );

  constructor() {
    super(initialState);
  }
}
