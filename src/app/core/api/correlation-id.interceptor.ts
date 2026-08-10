import { type HttpInterceptorFn } from '@angular/common/http';

function createCorrelationId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const correlationIdInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.includes('/api/')) return next(request);
  if (request.headers.has('X-Correlation-Id')) return next(request);

  return next(request.clone({ setHeaders: { 'X-Correlation-Id': createCorrelationId() } }));
};
