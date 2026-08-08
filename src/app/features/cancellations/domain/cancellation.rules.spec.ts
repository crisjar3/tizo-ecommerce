import type { OpsOrder } from '../../../core/api/api-contract';
import { createSeedDatabase } from '../../../../mocks/seeds';
import { affectedAmount, cancellableItems } from './cancellation.rules';

describe('cancellation rules', () => {
  const order = createSeedDatabase().orders[0] as OpsOrder;

  it('selects only whole cancellable lines', () => {
    expect(cancellableItems(order.items).map((item) => item.id)).toEqual([
      'item-1042-1',
      'item-1042-2',
      'item-1042-3',
    ]);
    expect(cancellableItems(createSeedDatabase().orders[1]?.items ?? [])).toEqual([]);
  });

  it('sums affected money in minor units', () => {
    const result = affectedAmount(order.items, ['item-1042-1', 'item-1042-3']);
    expect(result.amountMinor).toBe(8_440_000);
    expect(Number.isInteger(result.amountMinor)).toBeTrue();
  });
});
