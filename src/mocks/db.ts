import type {
  AuditEvent,
  CancellationRequest,
  Cart,
  Operator,
  OpsOrder,
  OrderItemStatus,
  Product,
} from '../app/core/api/api-contract';
import { itemStatusRank } from '../app/features/customer-orders/domain/customer-order-projection';
import { createSeedDatabase } from './seeds';

export { projectCustomerOrder } from '../app/features/customer-orders/domain/customer-order-projection';

export interface StoredCartItem {
  productId: string;
  quantity: number;
}

export interface IdempotencyRecord {
  scope: string;
  key: string;
  fingerprint: string;
  status: number;
  response: unknown;
}

export interface MockDatabase {
  schemaVersion: number;
  products: Product[];
  cart: StoredCartItem[];
  orders: OpsOrder[];
  requests: CancellationRequest[];
  operators: Operator[];
  audit: AuditEvent[];
  idempotency: IdempotencyRecord[];
}

const STORAGE_KEY = 'tizo:mock-db:v1';

export function readDatabase(): MockDatabase {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return resetDatabase();

  try {
    const parsed = JSON.parse(stored) as MockDatabase;
    if (parsed.schemaVersion !== 1) return resetDatabase();
    return parsed;
  } catch {
    return resetDatabase();
  }
}

export function writeDatabase(database: MockDatabase): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

export function resetDatabase(): MockDatabase {
  const database = createSeedDatabase();
  writeDatabase(database);
  return database;
}

export function updateDatabase<T>(mutator: (database: MockDatabase) => T): T {
  const draft = structuredClone(readDatabase());
  const result = mutator(draft);
  writeDatabase(draft);
  return result;
}

export function buildCart(database: MockDatabase): Cart {
  const items = database.cart.flatMap((line) => {
    const product = database.products.find((candidate) => candidate.id === line.productId);
    if (!product) return [];
    return [
      {
        product,
        quantity: line.quantity,
        lineTotal: {
          amountMinor: product.price.amountMinor * line.quantity,
          currency: product.price.currency,
        },
      },
    ];
  });
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: {
      amountMinor: items.reduce((sum, item) => sum + item.lineTotal.amountMinor, 0),
      currency: 'ARS',
    },
  };
}

export function recalculateOrder(order: OpsOrder): OpsOrder {
  const cancelledAmount = order.items
    .filter((item) => item.status === 'CANCELLED')
    .reduce((sum, item) => sum + item.lineTotal.amountMinor, 0);
  const activeItems = order.items.filter((item) => item.status !== 'CANCELLED');
  const firstActiveItem = activeItems[0];
  const cancellationStatus =
    cancelledAmount === 0 ? 'NONE' : activeItems.length === 0 ? 'FULL' : 'PARTIAL';
  const fulfillmentStatus: OrderItemStatus = firstActiveItem
    ? activeItems.reduce<OrderItemStatus>(
        (current, item) =>
          itemStatusRank(item.status) < itemStatusRank(current) ? item.status : current,
        firstActiveItem.status,
      )
    : 'CANCELLED';

  return {
    ...order,
    fulfillmentStatus,
    cancellationStatus,
    cancelledTotal: { amountMinor: cancelledAmount, currency: order.paidTotal.currency },
    activeTotal: {
      amountMinor: order.paidTotal.amountMinor - cancelledAmount,
      currency: order.paidTotal.currency,
    },
    version: order.version + 1,
  };
}

export function fingerprint(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as object).sort());
}
