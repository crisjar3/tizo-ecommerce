import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import { isRetryableReadError } from './http-policies';

describe('read HTTP policy', () => {
  it('retries only timeouts, network failures and server errors', () => {
    expect(isRetryableReadError(new TimeoutError())).toBeTrue();
    expect(isRetryableReadError(new HttpErrorResponse({ status: 0 }))).toBeTrue();
    expect(isRetryableReadError(new HttpErrorResponse({ status: 503 }))).toBeTrue();
    expect(isRetryableReadError(new HttpErrorResponse({ status: 409 }))).toBeFalse();
    expect(isRetryableReadError(new Error('unknown'))).toBeFalse();
  });
});
