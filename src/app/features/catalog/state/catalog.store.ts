import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

import type { Product } from '../../../core/api/api-contract';
import { TizoApiService } from '../../../core/api/tizo-api.service';
import type { ScreenState } from '../../../core/errors/app-error';
import {
  errorScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';

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
  private readonly api = inject(TizoApiService);

  readonly products$ = this.select((state) => state.products);
  readonly selectedProduct$ = this.select((state) => state.selectedProduct);

  readonly loadProducts = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ products: initialScreenState() })),
      switchMap(() =>
        this.api.listProducts().pipe(
          tapResponse(
            (products) => this.patchState({ products: successScreenState(products) }),
            (error: unknown) =>
              this.patchState({
                products: errorScreenState(normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  readonly loadProduct = this.effect<string>((productId$) =>
    productId$.pipe(
      tap(() => this.patchState({ selectedProduct: initialScreenState() })),
      switchMap((productId) =>
        this.api.getProduct(productId).pipe(
          tapResponse(
            (product) => this.patchState({ selectedProduct: successScreenState(product) }),
            (error: unknown) =>
              this.patchState({
                selectedProduct: errorScreenState(normalizeHttpError(error)),
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
