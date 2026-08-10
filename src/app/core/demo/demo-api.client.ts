import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url.token';
import { withCommandPolicy } from '../api/http-policies';

@Injectable({ providedIn: 'root' })
export class DemoApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  reset(): Observable<void> {
    return this.http.post(`${this.base}/mock/reset`, {}).pipe(
      withCommandPolicy(),
      map(() => undefined),
    );
  }
}
