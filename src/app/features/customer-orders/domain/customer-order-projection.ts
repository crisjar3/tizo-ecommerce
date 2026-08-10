import type {
  CustomerOrder,
  CustomerOrderStatus,
  OpsOrder,
  OrderItemStatus,
} from '../../../core/api/api-contract';

export function projectCustomerOrder(order: OpsOrder): CustomerOrder {
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: deriveCustomerOrderStatus(order),
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      cancelled: item.status === 'CANCELLED',
      refundStatus: item.refundStatus,
      cancellable: item.cancellable,
    })),
    paidTotal: order.paidTotal,
    cancelledTotal: order.cancelledTotal,
    activeTotal: order.activeTotal,
  };
}

export function deriveCustomerOrderStatus(order: OpsOrder): CustomerOrderStatus {
  const allItemsCancelled =
    order.items.length > 0 && order.items.every((item) => item.status === 'CANCELLED');
  if (
    order.cancellationStatus === 'FULL' ||
    order.fulfillmentStatus === 'CANCELLED' ||
    allItemsCancelled
  ) {
    return 'CANCELLED';
  }
  if (order.fulfillmentStatus === 'DELIVERED') return 'DELIVERED';
  if (order.dispatchedAt !== null || order.fulfillmentStatus === 'DISPATCHED') return 'DISPATCHED';
  if (order.fulfillmentStatus === 'AT_HUB' || order.fulfillmentStatus === 'READY_TO_DISPATCH') {
    return 'READY_TO_DISPATCH';
  }
  return 'AWAITING_STORES';
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
