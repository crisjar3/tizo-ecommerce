import { type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { OperatorSessionService } from '../session/operator-session.service';

export const operatorContextInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.includes('/api/ops/')) return next(request);

  const operator = inject(OperatorSessionService).activeOperator;
  return next(operator ? request.clone({ setHeaders: { 'X-Operator-Id': operator.id } }) : request);
};
