import type { OpsOrder } from '../../../core/api/api-contract';
import { createSeedDatabase } from '../../../../mocks/seeds';
import { hasCancellableItems } from './ops-order.rules';

describe('operations order rules', () => {
  it('allows cancellation while at least one line is eligible', () => {
    const order = createSeedDatabase().orders[0] as OpsOrder;
    expect(hasCancellableItems(order.items)).toBeTrue();
  });

  it('does not allow cancellation after dispatch', () => {
    const order = createSeedDatabase().orders[1] as OpsOrder;
    expect(hasCancellableItems(order.items)).toBeFalse();
  });
});
