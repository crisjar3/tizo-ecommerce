import type { OpsOrder } from '../../../core/api/api-contract';
import { createSeedDatabase } from '../../../../mocks/seeds';
import {
  deriveCustomerProgress,
  itemStatusRank,
  progressFromItemStatus,
  projectCustomerOrder,
} from './customer-order-projection';

describe('customer order projection', () => {
  it('does not expose internal operation fields', () => {
    const order = createSeedDatabase().orders[0] as OpsOrder;
    const projection = projectCustomerOrder(order);

    expect('customerEmail' in projection).toBeFalse();
    expect('fulfillmentStatus' in projection).toBeFalse();
    expect('store' in (projection.items[0] ?? {})).toBeFalse();
    expect('status' in (projection.items[0] ?? {})).toBeFalse();
  });

  it('derives progress from the least advanced active line', () => {
    const order = createSeedDatabase().orders[0] as OpsOrder;

    expect(deriveCustomerProgress(order)).toBe('CONFIRMED');
  });

  it('ignores cancelled lines and reports a fully cancelled order', () => {
    const order = createSeedDatabase().orders[0] as OpsOrder;
    const cancelled: OpsOrder = {
      ...order,
      items: order.items.map((item) => ({ ...item, status: 'CANCELLED', cancelled: true })),
    };

    expect(deriveCustomerProgress(cancelled)).toBe('CANCELLED');
  });

  it('maps every operational milestone to the safe customer progress', () => {
    expect(progressFromItemStatus('PENDING')).toBe('CONFIRMED');
    expect(progressFromItemStatus('AT_HUB')).toBe('PREPARING');
    expect(progressFromItemStatus('PREPARING')).toBe('PREPARING');
    expect(progressFromItemStatus('DISPATCHED')).toBe('IN_TRANSIT');
    expect(progressFromItemStatus('DELIVERED')).toBe('DELIVERED');
    expect(progressFromItemStatus('CANCELLED')).toBe('CANCELLED');
  });

  it('orders internal milestones without exposing them to the projection', () => {
    expect(itemStatusRank('PENDING')).toBeLessThan(itemStatusRank('AT_HUB'));
    expect(itemStatusRank('AT_HUB')).toBeLessThan(itemStatusRank('DELIVERED'));
  });
});
