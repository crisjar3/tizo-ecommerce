import type { OpsOrder } from '../../../core/api/api-contract';
import { createSeedDatabase } from '../../../../mocks/seeds';
import {
  deriveCustomerOrderStatus,
  itemStatusRank,
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
    expect(projection.status).toBe('AWAITING_STORES');
    expect(projection.itemCount).toBe(
      order.items.reduce((total, item) => total + item.quantity, 0),
    );
  });

  it('derives the public status from the order status', () => {
    const order = createSeedDatabase().orders[0] as OpsOrder;

    expect(deriveCustomerOrderStatus(order)).toBe('AWAITING_STORES');
    expect(deriveCustomerOrderStatus({ ...order, fulfillmentStatus: 'AT_HUB' })).toBe(
      'READY_TO_DISPATCH',
    );
    expect(deriveCustomerOrderStatus({ ...order, fulfillmentStatus: 'READY_TO_DISPATCH' })).toBe(
      'READY_TO_DISPATCH',
    );
    expect(
      deriveCustomerOrderStatus({
        ...order,
        fulfillmentStatus: 'PREPARING',
        dispatchedAt: order.createdAt,
      }),
    ).toBe('DISPATCHED');
    expect(deriveCustomerOrderStatus({ ...order, fulfillmentStatus: 'DISPATCHED' })).toBe(
      'DISPATCHED',
    );
    expect(deriveCustomerOrderStatus({ ...order, fulfillmentStatus: 'DELIVERED' })).toBe(
      'DELIVERED',
    );
  });

  it('ignores cancelled lines and reports a fully cancelled order', () => {
    const order = createSeedDatabase().orders[0] as OpsOrder;
    const cancelled: OpsOrder = {
      ...order,
      items: order.items.map((item) => ({ ...item, status: 'CANCELLED', cancelled: true })),
    };

    expect(deriveCustomerOrderStatus(cancelled)).toBe('CANCELLED');
    expect(deriveCustomerOrderStatus({ ...order, cancellationStatus: 'FULL' })).toBe('CANCELLED');
    expect(deriveCustomerOrderStatus({ ...order, fulfillmentStatus: 'CANCELLED' })).toBe(
      'CANCELLED',
    );
  });

  it('orders internal milestones without exposing them to the projection', () => {
    expect(itemStatusRank('PENDING')).toBeLessThan(itemStatusRank('AT_HUB'));
    expect(itemStatusRank('IN_TRANSIT_TO_HUB')).toBeLessThan(itemStatusRank('READY_TO_DISPATCH'));
    expect(itemStatusRank('AT_HUB')).toBeLessThan(itemStatusRank('DELIVERED'));
  });
});
