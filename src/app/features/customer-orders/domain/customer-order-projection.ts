import type {
  CustomerOrder,
  CustomerOrderProgress,
  OpsOrder,
  OrderItemStatus,
} from '../../../core/api/api-contract';

export function projectCustomerOrder(order: OpsOrder): CustomerOrder {
  return {
    id: order.id,
    createdAt: order.createdAt,
    progress: deriveCustomerProgress(order),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      cancelled: item.status === 'CANCELLED',
      refundStatus: item.refundStatus,
    })),
    paidTotal: order.paidTotal,
    cancelledTotal: order.cancelledTotal,
    activeTotal: order.activeTotal,
  };
}

export function deriveCustomerProgress(order: OpsOrder): CustomerOrderProgress {
  const activeItems = order.items.filter((item) => item.status !== 'CANCELLED');
  const firstActiveItem = activeItems[0];
  if (!firstActiveItem) return 'CANCELLED';
  const leastAdvancedStatus = activeItems.reduce<OrderItemStatus>(
    (current, item) =>
      itemStatusRank(item.status) < itemStatusRank(current) ? item.status : current,
    firstActiveItem.status,
  );
  return progressFromItemStatus(leastAdvancedStatus);
}

export function progressFromItemStatus(status: OrderItemStatus): CustomerOrderProgress {
  if (status === 'DELIVERED') return 'DELIVERED';
  if (status === 'DISPATCHED') return 'IN_TRANSIT';
  if (
    status === 'PREPARING' ||
    status === 'READY_FOR_PICKUP' ||
    status === 'IN_TRANSIT_TO_HUB' ||
    status === 'AT_HUB' ||
    status === 'READY_TO_DISPATCH'
  )
    return 'PREPARING';
  if (status === 'CANCELLED') return 'CANCELLED';
  return 'CONFIRMED';
}

export function itemStatusRank(status: OrderItemStatus): number {
  return [
    'PENDING',
    'CONFIRMED',
    'AWAITING_STORES',
    'PREPARING',
    'READY_FOR_PICKUP',
    'IN_TRANSIT_TO_HUB',
    'AT_HUB',
    'READY_TO_DISPATCH',
    'DISPATCHED',
    'DELIVERED',
  ].indexOf(status);
}
