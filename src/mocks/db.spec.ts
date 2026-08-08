import type { OpsOrder } from '../app/core/api/api-contract';
import {
  buildCart,
  fingerprint,
  projectCustomerOrder,
  readDatabase,
  recalculateOrder,
  resetDatabase,
  updateDatabase,
} from './db';
import { createSeedDatabase } from './seeds';

describe('mock database domain projections', () => {
  beforeEach(() => sessionStorage.clear());

  it('calculates cart money using integer minor units', () => {
    const database = createSeedDatabase();
    database.cart = [{ productId: 'prod-running', quantity: 2 }];

    const cart = buildCart(database);

    expect(Number.isInteger(cart.total.amountMinor)).toBeTrue();
    expect(cart.total.amountMinor).toBe(14_400_000);
    expect(cart.items[0]?.lineTotal.amountMinor).toBe(14_400_000);
  });

  it('uses the least advanced active line for customer progress', () => {
    const order = createSeedDatabase().orders[0];
    expect(order).toBeDefined();

    const projection = projectCustomerOrder(order as OpsOrder);

    expect(projection.progress).toBe('CONFIRMED');
    expect('customerEmail' in projection).toBeFalse();
    expect('fulfillmentStatus' in projection).toBeFalse();
    expect('store' in (projection.items[0] ?? {})).toBeFalse();
  });

  it('recalculates partial cancellation totals atomically', () => {
    const source = createSeedDatabase().orders[0];
    expect(source).toBeDefined();
    const firstItem = source?.items[0];
    expect(firstItem).toBeDefined();

    const updated = recalculateOrder({
      ...(source as OpsOrder),
      items: (source as OpsOrder).items.map((item) =>
        item.id === firstItem?.id
          ? { ...item, status: 'CANCELLED' as const, cancelled: true }
          : item,
      ),
    });

    expect(updated.cancellationStatus).toBe('PARTIAL');
    expect(updated.cancelledTotal.amountMinor).toBe(firstItem?.lineTotal.amountMinor ?? 0);
    expect(updated.activeTotal.amountMinor + updated.cancelledTotal.amountMinor).toBe(
      updated.paidTotal.amountMinor,
    );
  });

  it('keeps an untouched order active and marks a fully cancelled order', () => {
    const source = createSeedDatabase().orders[0] as OpsOrder;

    const untouched = recalculateOrder(source);
    const fullyCancelled = recalculateOrder({
      ...source,
      items: source.items.map((item) => ({
        ...item,
        status: 'CANCELLED' as const,
        cancelled: true,
      })),
    });

    expect(untouched.cancellationStatus).toBe('NONE');
    expect(untouched.cancelledTotal.amountMinor).toBe(0);
    expect(fullyCancelled.cancellationStatus).toBe('FULL');
    expect(fullyCancelled.fulfillmentStatus).toBe('CANCELLED');
    expect(fullyCancelled.activeTotal.amountMinor).toBe(0);
  });

  it('commits database changes only when a transaction completes', () => {
    resetDatabase();
    const before = readDatabase().cart;

    expect(() =>
      updateDatabase((database) => {
        database.cart = [];
        throw new Error('simulated transaction failure');
      }),
    ).toThrowError('simulated transaction failure');

    expect(readDatabase().cart).toEqual(before);
  });

  it('creates a stable command fingerprint independent of key order', () => {
    expect(fingerprint({ reasonCode: 'A', orderId: '1042' })).toBe(
      fingerprint({ orderId: '1042', reasonCode: 'A' }),
    );
  });

  it('recovers deterministically from corrupt or outdated session data', () => {
    sessionStorage.setItem('tizo:mock-db:v1', '{not-json');
    expect(readDatabase().schemaVersion).toBe(1);

    sessionStorage.setItem(
      'tizo:mock-db:v1',
      JSON.stringify({ ...createSeedDatabase(), schemaVersion: 0 }),
    );
    expect(readDatabase().schemaVersion).toBe(1);
  });

  it('ignores cart lines whose product no longer exists', () => {
    const database = createSeedDatabase();
    database.cart = [{ productId: 'missing-product', quantity: 3 }];

    expect(buildCart(database).items).toEqual([]);
    expect(buildCart(database).total.amountMinor).toBe(0);
  });
});
