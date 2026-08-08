import { MoneyPipe } from './money.pipe';

describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();

  it('formats integer minor units without decimal arithmetic', () => {
    expect(pipe.transform({ amountMinor: 1_890_000, currency: 'ARS' })).toContain('18.900');
  });

  it('keeps backwards-compatible number input for compact views', () => {
    expect(pipe.transform(7_200_000, 'ARS')).toContain('72.000');
  });
});
