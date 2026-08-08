import { Pipe, type PipeTransform } from '@angular/core';

import type { Money } from '../../../core/api/api-contract';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: Money | number, currency = 'ARS'): string {
    const amountMinor = typeof value === 'number' ? value : value.amountMinor;
    const resolvedCurrency = typeof value === 'number' ? currency : value.currency;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: resolvedCurrency,
      maximumFractionDigits: 0,
    }).format(amountMinor / 100);
  }
}
