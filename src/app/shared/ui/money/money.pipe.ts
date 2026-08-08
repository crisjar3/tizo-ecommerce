import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(amountMinor: number, currency = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amountMinor / 100);
  }
}
