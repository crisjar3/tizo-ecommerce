import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import type { Operator } from '../../../core/api/api-contract';
import type { components } from '../../../core/api/generated/tizo-api.types';
import { withReadPolicy } from '../../../core/api/http-policies';

type OperatorListDto = components['schemas']['OperatorListResponse'];

@Injectable({ providedIn: 'root' })
export class OperatorsApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(active = true, search = ''): Observable<readonly Operator[]> {
    let params = new HttpParams().set('active', active);
    if (search) params = params.set('search', search);
    return this.http.get<OperatorListDto>(`${this.base}/ops/operators`, { params }).pipe(
      withReadPolicy(),
      map((response) => response.items.map(mapOperator)),
    );
  }
}

function mapOperator(dto: OperatorListDto['items'][number]): Operator {
  return {
    id: dto.id,
    name: dto.name,
    initials: initials(dto.name),
    team: dto.role === 'SUPERVISOR' ? 'Supervisión' : 'Operaciones',
    online: dto.active,
    resolvedCount: 0,
    email: dto.email,
    role: dto.role,
    active: dto.active,
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
