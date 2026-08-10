import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { concatMap, exhaustMap, switchMap, tap } from 'rxjs';

import type { Cart, CustomerOrder } from '../../../core/api/api-contract';
import { IdempotencyKeyFactory } from '../../../core/api/idempotency-key.factory';
import type { CommandState, ScreenState } from '../../../core/errors/app-error';
import {
  beginScreenState,
  failScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';
import { CartApiClient } from '../data-access/cart-api.client';
import { CheckoutApiClient } from '../data-access/checkout-api.client';

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
  private readonly cartApi = inject(CartApiClient);
  private readonly checkoutApi = inject(CheckoutApiClient);
  private readonly idempotencyKeys = inject(IdempotencyKeyFactory);

  readonly cart$ = this.select((state) => state.cart);
  readonly command$ = this.select((state) => state.command);

  readonly load = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ cart: beginScreenState(this.get().cart) })),
      switchMap(() =>
        this.cartApi.get().pipe(
          tapResponse(
            (cart) => this.patchState({ cart: successScreenState(cart) }),
            (error: unknown) =>
              this.patchState({
                cart: failScreenState(this.get().cart, normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  readonly setQuantity = this.effect<QuantityCommand>((command$) =>
    command$.pipe(
      tap(() => this.patchState({ command: { status: 'submitting' } })),
      concatMap(({ productId, quantity }) =>
        this.cartApi.setQuantity(productId, quantity).pipe(
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
      exhaustMap((productId) =>
        this.cartApi.remove(productId).pipe(
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
      exhaustMap(() => {
        const idempotencyKey = this.get().checkoutKey ?? this.idempotencyKeys.create();
        this.patchState({ checkoutKey: idempotencyKey, command: { status: 'submitting' } });
        return this.checkoutApi.checkout({ idempotencyKey }).pipe(
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

  readonly reconcileCheckout = this.effect<string>((key$) =>
    key$.pipe(
      exhaustMap((idempotencyKey) =>
        this.checkoutApi.reconcile(idempotencyKey).pipe(
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
                  appError.kind === 'not-found'
                    ? { status: 'error', error: appError }
                    : { status: 'uncertain', error: appError, idempotencyKey },
              });
            },
          ),
        ),
      ),
    ),
  );

  constructor() {
    super(initialState);
  }
}
