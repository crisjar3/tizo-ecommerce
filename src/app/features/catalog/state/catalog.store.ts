import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

import type { Product } from '../../../core/api/api-contract';
import type { ScreenState } from '../../../core/errors/app-error';
import {
  beginScreenState,
  failScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';
import { CatalogApiClient } from '../data-access/catalog-api.client';

interface CatalogState {
  readonly products: ScreenState<readonly Product[]>;
  readonly selectedProduct: ScreenState<Product>;
}

const initialState: CatalogState = {
  products: initialScreenState(),
  selectedProduct: initialScreenState(),
};

@Injectable()
export class CatalogStore extends ComponentStore<CatalogState> {
  private readonly api = inject(CatalogApiClient);

  readonly products$ = this.select((state) => state.products);
  readonly selectedProduct$ = this.select((state) => state.selectedProduct);

  readonly loadProducts = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ products: beginScreenState(this.get().products) })),
      switchMap(() =>
        this.api.list().pipe(
          tapResponse(
            (products) => this.patchState({ products: successScreenState(products) }),
            (error: unknown) =>
              this.patchState({
                products: failScreenState(this.get().products, normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  readonly loadProduct = this.effect<string>((productId$) =>
    productId$.pipe(
      tap(() => this.patchState({ selectedProduct: beginScreenState(this.get().selectedProduct) })),
      switchMap((productId) =>
        this.api.get(productId).pipe(
          tapResponse(
            (product) => this.patchState({ selectedProduct: successScreenState(product) }),
            (error: unknown) =>
              this.patchState({
                selectedProduct: failScreenState(
                  this.get().selectedProduct,
                  normalizeHttpError(error),
                ),
              }),
          ),
        ),
      ),
    ),
  );

  constructor() {
    super(initialState);
  }
}
