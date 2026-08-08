import type { Money, OpsOrderItem } from '../../../core/api/api-contract';

export function cancellableItems(items: readonly OpsOrderItem[]): readonly OpsOrderItem[] {
  return items.filter(
    (item) =>
      item.cancellable &&
      item.status !== 'CANCELLED' &&
      item.status !== 'DISPATCHED' &&
      item.status !== 'DELIVERED',
  );
}

export function affectedAmount(
  items: readonly OpsOrderItem[],
  selectedIds: readonly string[],
): Money {
  const selected = items.filter((item) => selectedIds.includes(item.id));
  return {
    amountMinor: selected.reduce((total, item) => total + item.lineTotal.amountMinor, 0),
    currency: selected[0]?.lineTotal.currency ?? items[0]?.lineTotal.currency ?? 'ARS',
  };
}
