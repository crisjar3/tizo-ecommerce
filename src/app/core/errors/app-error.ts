import type { ApiErrorEnvelope } from '../api/api-contract';

export type AppErrorKind =
  | 'network'
  | 'timeout'
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'forbidden'
  | 'server'
  | 'unknown';

export type RecoveryAction =
  | 'retry-read'
  | 'verify-command'
  | 'open-existing'
  | 'return-order'
  | 'reload-readonly'
  | 'none';

export interface AppError {
  readonly kind: AppErrorKind;
  readonly code: string;
  readonly title: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly recovery: RecoveryAction;
  readonly status?: number;
  readonly correlationId?: string;
  readonly fieldErrors?: ApiErrorEnvelope['fieldErrors'];
}

export type ScreenState<T> =
  | { readonly status: 'loading'; readonly data: null; readonly error: null }
  | { readonly status: 'refreshing'; readonly data: T; readonly error: null }
  | {
      readonly status: 'success';
      readonly data: T;
      readonly error: null;
      readonly updatedAt: number;
    }
  | { readonly status: 'error'; readonly data: T | null; readonly error: AppError };

export type CommandState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: AppError }
  | { readonly status: 'uncertain'; readonly idempotencyKey: string; readonly error: AppError };

export const initialScreenState = <T>(): ScreenState<T> => ({
  status: 'loading',
  data: null,
  error: null,
});

export const successScreenState = <T>(data: T): ScreenState<T> => ({
  status: 'success',
  data,
  error: null,
  updatedAt: Date.now(),
});

export const errorScreenState = <T>(error: AppError, data: T | null = null): ScreenState<T> => ({
  status: 'error',
  data,
  error,
});

export const idleCommandState = <T>(): CommandState<T> => ({ status: 'idle' });
