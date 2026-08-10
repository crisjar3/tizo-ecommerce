import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import type { Product } from '../../../core/api/api-contract';
import type { components } from '../../../core/api/generated/tizo-api.types';
import { withReadPolicy } from '../../../core/api/http-policies';
import { resolveProductImage } from '../../../core/api/product-image';

type ProductSummaryDto = components['schemas']['ProductSummary'];
type ProductDetailDto = components['schemas']['ProductDetail'];
type ProductListResponseDto = components['schemas']['ProductListResponse'];

export interface CatalogQuery {
  readonly search?: string;
  readonly category?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(query: CatalogQuery = {}): Observable<readonly Product[]> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.category) params = params.set('category', query.category);
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);

    return this.http.get<ProductListResponseDto>(`${this.base}/catalog/products`, { params }).pipe(
      withReadPolicy(),
      map((response) => response.items.map(mapProductSummary)),
    );
  }

  get(productId: string): Observable<Product> {
    return this.http
      .get<ProductDetailDto>(`${this.base}/catalog/products/${productId}`)
      .pipe(withReadPolicy(), map(mapProductDetail));
  }
}

export function mapProductSummary(dto: ProductSummaryDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    sku: dto.id,
    store: dto.category,
    category: dto.category,
    price: { ...dto.price },
    stock: dto.availableStock,
    imageUrl: resolveProductImage(dto.id, dto.imageUrl),
    imageAlt: dto.name,
    available: dto.available,
  };
}

function mapProductDetail(dto: ProductDetailDto): Product {
  return {
    ...mapProductSummary(dto),
    longDescription: dto.longDescription,
    imageUrls: dto.imageUrls.map((url) => resolveProductImage(dto.id, url)),
    attributes: dto.attributes.map((attribute) => ({ ...attribute })),
  };
}
