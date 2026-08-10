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

  it('classifies validation, not found, forbidden and server responses', () => {
    expect(normalizeHttpError(new HttpErrorResponse({ status: 422 })).kind).toBe('validation');
    expect(normalizeHttpError(new HttpErrorResponse({ status: 404 })).kind).toBe('not-found');
    expect(normalizeHttpError(new HttpErrorResponse({ status: 403 })).kind).toBe('forbidden');

    const server = normalizeHttpError(new HttpErrorResponse({ status: 503 }));
    expect(server.kind).toBe('server');
    expect(server.retryable).toBeTrue();
  });

  it('falls back safely for malformed HTTP envelopes and unknown errors', () => {
    const malformed = normalizeHttpError(
      new HttpErrorResponse({ status: 409, error: { message: 'missing code' } }),
    );
    expect(malformed.kind).toBe('conflict');
    expect(malformed.code).toBe('HTTP_409');
    expect(malformed.title).toBe('La información cambió');

    const unknown = normalizeHttpError(new Error('private details'));
    expect(unknown.kind).toBe('unknown');
    expect(unknown.message).not.toContain('private details');
  });

  it('preserves field errors from validation envelopes', () => {
    const result = normalizeHttpError(
      new HttpErrorResponse({
        status: 400,
        error: {
          code: 'INVALID_REASON',
          message: 'Revisá el motivo.',
          correlationId: 'corr-fields',
          fieldErrors: { reasonNote: ['Escribí más detalle.'] },
        },
      }),
      true,
    );

    expect(result.fieldErrors?.['reasonNote']).toEqual(['Escribí más detalle.']);
    expect(result.status).toBe(400);
  });

  it('reads the official RFC 9457 problem envelope and recovery action', () => {
    const result = normalizeHttpError(
      new HttpErrorResponse({
        status: 422,
        error: {
          type: 'https://tizo.test/problems/cart-empty',
          title: 'Validation error',
          status: 422,
          detail: 'The cart is empty.',
          instance: '/api/me/orders',
          error: {
            category: 'DOMAIN',
            code: 'CART_EMPTY',
            message: 'Agregá productos antes de confirmar.',
            correlationId: 'corr-official',
            retryable: false,
            recoveryAction: 'FIX_REQUEST',
          },
        },
      }),
      true,
    );

    expect(result.code).toBe('CART_EMPTY');
    expect(result.message).toBe('Agregá productos antes de confirmar.');
    expect(result.correlationId).toBe('corr-official');
    expect(result.recovery).toBe('fix-request');
  });
});
