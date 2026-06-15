import { Pipe, PipeTransform } from '@angular/core';

const formatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

@Pipe({ name: 'currencyCop' })
export class CurrencyCopPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '';
    // es-CO produces "$25.000" already; strip any trailing " COP" artifact
    return formatter
      .format(value)
      .replace(/\s*COP\s*/g, '')
      .replace(/\$\s+/, '$')
      .trim();
  }
}
