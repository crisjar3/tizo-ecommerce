import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { concatMap, map } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import type { Cart, CartItem, Product } from '../../../core/api/api-contract';
import type { components } from '../../../core/api/generated/tizo-api.types';
import { withCommandPolicy, withReadPolicy } from '../../../core/api/http-policies';
import { resolveProductImage } from '../../../core/api/product-image';

type CartDto = components['schemas']['Cart'];

@Injectable({ providedIn: 'root' })
export class CartApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  get(): Observable<Cart> {
    return this.http.get<CartDto>(`${this.base}/me/cart`).pipe(withReadPolicy(), map(mapCart));
  }

  setQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.http
      .put<CartDto>(`${this.base}/me/cart/items/${productId}`, { quantity })
      .pipe(withCommandPolicy(), map(mapCart));
  }

  remove(productId: string): Observable<Cart> {
    return this.http.delete<void>(`${this.base}/me/cart/items/${productId}`).pipe(
      withCommandPolicy(),
      concatMap(() => this.get()),
    );
  }
}

export function mapCart(dto: CartDto): Cart {
  return {
    items: dto.items.map(mapCartItem),
    itemCount: dto.totalItems,
    total: { ...dto.subtotal },
  };
}

function mapCartItem(dto: CartDto['items'][number]): CartItem {
  const product: Product = {
    id: dto.productId,
    name: dto.productName,
    description: '',
    sku: dto.productId,
    store: 'Tizo',
    category: '',
    price: { ...dto.unitPrice },
    stock: dto.availableStock,
    imageUrl: resolveProductImage(dto.productId, dto.imageUrl),
    imageAlt: dto.productName,
    available: dto.availableStock > 0,
  };

  return { product, quantity: dto.quantity, lineTotal: { ...dto.lineTotal } };
}
