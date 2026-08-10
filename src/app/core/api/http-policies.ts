import { HttpErrorResponse } from '@angular/common/http';
import { retry, throwError, timeout, TimeoutError, timer } from 'rxjs';
import type { MonoTypeOperatorFunction } from 'rxjs';

const READ_TIMEOUT_MS = 10_000;
const COMMAND_TIMEOUT_MS = 15_000;

export function withReadPolicy<T>(): MonoTypeOperatorFunction<T> {
  return (source) =>
    source.pipe(
      timeout(READ_TIMEOUT_MS),
      retry({
        count: 2,
        delay: (error: unknown, retryCount) =>
          isRetryableReadError(error) ? timer(200 * retryCount) : throwError(() => error),
      }),
    );
}

export function withCommandPolicy<T>(): MonoTypeOperatorFunction<T> {
  return (source) => source.pipe(timeout(COMMAND_TIMEOUT_MS));
}

export function isRetryableReadError(error: unknown): boolean {
  return (
    error instanceof TimeoutError ||
    (error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500))
  );
}
