import type { OpsOrderItem } from '../../../core/api/api-contract';

export function hasCancellableItems(items: readonly OpsOrderItem[]): boolean {
  return items.some(
    (item) =>
      item.cancellable &&
      item.status !== 'CANCELLED' &&
      item.status !== 'DISPATCHED' &&
      item.status !== 'DELIVERED',
  );
}
