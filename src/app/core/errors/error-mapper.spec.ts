import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import { normalizeHttpError } from './error-mapper';

describe('normalizeHttpError', () => {
  it('preserves backend conflict code and correlation id', () => {
    const result = normalizeHttpError(
      new HttpErrorResponse({
        status: 409,
        error: {
          code: 'ORDER_ALREADY_DISPATCHED',
          message: 'El paquete ya fue despachado.',
          correlationId: 'corr-123',
        },
      }),
      true,
    );

    expect(result.kind).toBe('conflict');
    expect(result.code).toBe('ORDER_ALREADY_DISPATCHED');
    expect(result.correlationId).toBe('corr-123');
    expect(result.recovery).toBe('return-order');
    expect(result.retryable).toBeFalse();
  });

  it('marks a command timeout as uncertain and non-retryable', () => {
    const result = normalizeHttpError(new TimeoutError(), true);

    expect(result.kind).toBe('timeout');
    expect(result.recovery).toBe('verify-command');
    expect(result.retryable).toBeFalse();
  });

  it('allows retrying a failed read without retrying a mutation', () => {
    const networkError = new HttpErrorResponse({ status: 0 });

    expect(normalizeHttpError(networkError).retryable).toBeTrue();
    expect(normalizeHttpError(networkError, true).retryable).toBeFalse();
  });
});
