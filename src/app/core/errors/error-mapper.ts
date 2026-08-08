import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import type { ApiErrorEnvelope } from '../api/api-contract';
import type { AppError, RecoveryAction } from './app-error';

const recoveryByCode: Readonly<Record<string, RecoveryAction>> = {
  ORDER_ALREADY_DISPATCHED: 'return-order',
  ORDER_ALREADY_HAS_CANCELLATION: 'open-existing',
  NO_CANCELLABLE_ITEMS: 'return-order',
  REQUEST_ALREADY_RESOLVED: 'reload-readonly',
  CONCURRENT_MODIFICATION: 'reload-readonly',
};

export function normalizeHttpError(error: unknown, command = false): AppError {
  if (error instanceof TimeoutError) {
    return {
      kind: 'timeout',
      code: 'TIMEOUT',
      title: command ? 'No sabemos si se completó' : 'La carga tardó demasiado',
      message: command
        ? 'La respuesta se perdió. Verificá el estado antes de volver a intentar.'
        : 'No recibimos una respuesta a tiempo.',
      retryable: !command,
      recovery: command ? 'verify-command' : 'retry-read',
    };
  }

  if (!(error instanceof HttpErrorResponse)) {
    return {
      kind: 'unknown',
      code: 'UNKNOWN',
      title: 'No fue posible continuar',
      message: 'Ocurrió un error inesperado.',
      retryable: false,
      recovery: 'none',
    };
  }

  const envelope = readEnvelope(error.error);
  const code = envelope?.code ?? `HTTP_${error.status}`;
  const recovery =
    recoveryByCode[code] ?? (command && error.status === 0 ? 'verify-command' : 'none');

  if (error.status === 0) {
    return {
      kind: 'network',
      code,
      title: command ? 'No sabemos si se completó' : 'Sin conexión',
      message: command
        ? 'No recibimos confirmación. Verificá el resultado antes de reenviar.'
        : 'No fue posible conectarse al servicio.',
      retryable: !command,
      recovery: command ? 'verify-command' : 'retry-read',
    };
  }

  const kind =
    error.status === 400 || error.status === 422
      ? 'validation'
      : error.status === 404
        ? 'not-found'
        : error.status === 409
          ? 'conflict'
          : error.status === 403
            ? 'forbidden'
            : error.status >= 500
              ? 'server'
              : 'unknown';

  return {
    kind,
    code,
    title: titleFor(code, error.status),
    message: envelope?.message ?? 'No fue posible completar la operación.',
    retryable: !command && error.status >= 500,
    recovery,
    status: error.status,
    correlationId: envelope?.correlationId,
    fieldErrors: envelope?.fieldErrors,
  };
}

function readEnvelope(value: unknown): ApiErrorEnvelope | null {
  if (!value || typeof value !== 'object' || !('code' in value) || !('message' in value))
    return null;
  return value as ApiErrorEnvelope;
}

function titleFor(code: string, status: number): string {
  const known: Readonly<Record<string, string>> = {
    ORDER_ALREADY_DISPATCHED: 'El paquete ya fue despachado',
    ORDER_ALREADY_HAS_CANCELLATION: 'La orden ya tiene una cancelación',
    NO_CANCELLABLE_ITEMS: 'No hay productos cancelables',
    REQUEST_ALREADY_RESOLVED: 'La solicitud ya fue resuelta',
    IDEMPOTENCY_KEY_REUSED: 'La confirmación no coincide',
  };
  return known[code] ?? (status === 409 ? 'La información cambió' : 'No fue posible continuar');
}
