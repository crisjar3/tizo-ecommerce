import type {
  CancellationRequest,
  Cart,
  Money,
  Operator,
  OpsOrder,
  OpsOrderItem,
  OrderItemStatus,
  Product,
} from '../app/core/api/api-contract';
import type { components } from '../app/core/api/generated/tizo-api.types';
import type { MockDatabase } from './db';

type Schema = components['schemas'];

export function toProductSummary(product: Product): Schema['ProductSummary'] {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    imageUrl: product.imageUrl,
    price: toMoney(product.price),
    availableStock: product.stock,
    available: product.available ?? product.stock > 0,
  };
}

export function toProductDetail(product: Product): Schema['ProductDetail'] {
  return {
    ...toProductSummary(product),
    longDescription: product.longDescription ?? product.description,
    imageUrls: product.imageUrls ? [...product.imageUrls] : [product.imageUrl],
    attributes: product.attributes ? product.attributes.map((attribute) => ({ ...attribute })) : [],
  };
}

export function toCart(cart: Cart): Schema['Cart'] {
  return {
    id: 'cart-customer-001',
    customerId: 'customer-001',
    items: cart.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      imageUrl: item.product.imageUrl,
      unitPrice: toMoney(item.product.price),
      quantity: item.quantity,
      lineTotal: toMoney(item.lineTotal),
      availableStock: item.product.stock,
    })),
    subtotal: toMoney(cart.total),
    totalItems: cart.itemCount,
    updatedAt: new Date().toISOString(),
  };
}

export function toCustomerOrderSummary(order: OpsOrder): Schema['CustomerOrderSummary'] {
  return {
    id: order.id,
    displayNumber: order.id,
    createdAt: order.createdAt,
    status: toOrderStatus(order),
    cancellationStatus:
      order.cancellationStatus === 'REQUESTED' ? 'NONE' : order.cancellationStatus,
    progressStatus: toCustomerProgress(order.fulfillmentStatus),
    paidTotal: toMoney(order.paidTotal),
    activeTotal: toMoney(order.activeTotal),
    totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
    cancelledItems: order.items
      .filter((item) => item.cancelled)
      .reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function toCustomerOrderDetail(
  order: OpsOrder,
  database: MockDatabase,
): Schema['CustomerOrderDetail'] {
  const cancellation = database.requests.find(
    (request) => request.orderId === order.id && request.status !== 'REJECTED',
  );
  return {
    ...toCustomerOrderSummary(order),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.name,
      imageUrl: productImage(database, item.productId),
      quantity: item.quantity,
      unitPrice: unitPrice(item),
      lineTotal: toMoney(item.lineTotal),
      customerStatus: toCustomerItemStatus(item),
      cancellable: item.cancellable && order.dispatchedAt === null,
    })),
    deliveryAddress: demoAddress(order.customerName),
    cancellation: cancellation
      ? {
          requestId: cancellation.id,
          status:
            cancellation.status === 'COMPLETED'
              ? 'COMPLETED'
              : cancellation.status === 'REJECTED'
                ? 'REJECTED'
                : 'PENDING',
          affectedAmount: toMoney(cancellation.affectedAmount),
          requestedAt: cancellation.requestedAt,
          resolvedAt: cancellation.resolvedAt ?? null,
          refund: {
            status: cancellation.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_REQUIRED',
            amount:
              cancellation.status === 'COMPLETED' ? toMoney(cancellation.affectedAmount) : null,
            updatedAt: cancellation.resolvedAt ?? null,
          },
        }
      : null,
    version: order.version,
  };
}

export function toOpsOrderSummary(order: OpsOrder): Schema['OpsOrderSummary'] {
  return {
    id: order.id,
    displayNumber: order.id,
    customer: { id: 'customer-001', name: order.customerName, email: order.customerEmail },
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
    status: toOrderStatus(order),
    cancellationStatus:
      order.cancellationStatus === 'REQUESTED' ? 'NONE' : order.cancellationStatus,
    dispatchedAt: order.dispatchedAt,
    paidTotal: toMoney(order.paidTotal),
    activeTotal: toMoney(order.activeTotal),
    totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
    cancelledItems: order.items
      .filter((item) => item.cancelled)
      .reduce((sum, item) => sum + item.quantity, 0),
    version: order.version,
  };
}

export function toOpsOrderDetail(
  order: OpsOrder,
  database: MockDatabase,
): Schema['OpsOrderDetail'] {
  const eligibleItemIds = order.items
    .filter((item) => item.cancellable && order.dispatchedAt === null)
    .map((item) => item.id);
  return {
    ...toOpsOrderSummary(order),
    items: order.items.map((item) => toOpsOrderItem(item, order, database)),
    deliveryAddress: demoAddress(order.customerName),
    stores: Array.from(new Set(order.items.map((item) => item.store))).map((name, index) => ({
      id: `store-${index + 1}`,
      name,
    })),
    hub: { id: 'hub-demo', name: 'Hub Tizo' },
    activeCancellationRequestId:
      database.requests.find(
        (request) => request.orderId === order.id && request.status === 'PENDING',
      )?.id ?? null,
    cancellationEligibility: {
      eligible: eligibleItemIds.length > 0,
      eligibleItemIds,
      blockedBy:
        order.dispatchedAt !== null
          ? 'DISPATCHED'
          : order.cancellationStatus === 'FULL'
            ? 'EFFECTIVE_CANCELLATION'
            : eligibleItemIds.length
              ? null
              : 'NO_ELIGIBLE_ITEMS',
    },
  };
}

export function toOperator(operator: Operator): Schema['Operator'] {
  return {
    id: operator.id,
    name: operator.name,
    email: operator.email ?? `${operator.id}@tizo.test`,
    avatarUrl: null,
    role: operator.role ?? (operator.team.includes('Super') ? 'SUPERVISOR' : 'OPERATOR'),
    active: operator.active ?? operator.online,
  };
}

export function toCancellationSummary(
  request: CancellationRequest,
): Schema['CancellationRequestSummary'] {
  return {
    id: request.id,
    orderId: request.orderId,
    orderDisplayNumber: request.orderId,
    status: request.status,
    requestedBy: { type: 'OPERATOR', id: 'operator-demo', name: request.requesterName },
    requestedAt: request.requestedAt,
    resolvedAt: request.resolvedAt ?? null,
    reasonCode: toReasonCode(request.reasonCode),
    requestedAmount: toMoney(request.affectedAmount),
    itemCount: request.itemIds.length,
  };
}

export function toCancellationDetail(
  request: CancellationRequest,
  database: MockDatabase,
): Schema['CancellationRequestDetail'] {
  const order = database.orders.find((candidate) => candidate.id === request.orderId);
  return {
    id: request.id,
    orderId: request.orderId,
    orderDisplayNumber: request.orderId,
    status: request.status,
    requestedBy: { type: 'OPERATOR', id: 'operator-demo', name: request.requesterName },
    resolvedBy: request.resolverName
      ? { type: 'OPERATOR', id: 'operator-demo', name: request.resolverName }
      : null,
    requestedAt: request.requestedAt,
    resolvedAt: request.resolvedAt ?? null,
    reasonCode: toReasonCode(request.reasonCode),
    reasonNote: request.reasonNote || null,
    rejectionCode: toRejectionCode(request.rejectionCode),
    rejectionNote: request.rejectionNote ?? null,
    items: request.items.map((item) => {
      const current = order?.items.find((candidate) => candidate.id === item.itemId);
      return {
        itemId: item.itemId,
        productId: current?.productId ?? item.itemId,
        productName: item.name,
        storeId: `store-${item.store.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        storeName: item.store,
        quantity: current?.quantity ?? 1,
        unitPrice: current ? unitPrice(current) : toMoney(item.amount),
        requestedAmount: toMoney(item.amount),
        currentStatus: toOrderItemStatus(current?.status ?? item.itemStatusBefore),
        stillCancellable: current?.cancellable ?? false,
      };
    }),
    requestedAmount: toMoney(request.affectedAmount),
    currentAffectedAmount: toMoney(request.affectedAmount),
    effectiveOrderId: request.effectiveOrderId ?? null,
    expectedOrderVersion: request.currentOrderVersion ?? order?.version ?? 1,
    currentOrderVersion: order?.version ?? request.currentOrderVersion ?? 1,
    orderDispatchedAt: order?.dispatchedAt ?? null,
    stillValid: request.validNow,
    invalidatedBy: request.validNow ? null : invalidatedBy(request, order),
    refund: {
      status: request.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_REQUIRED',
      amount: request.status === 'COMPLETED' ? toMoney(request.affectedAmount) : null,
      providerReference: null,
      updatedAt: request.resolvedAt ?? null,
      failureCode: null,
    },
    effects: [],
    audit: [],
    version: request.version,
  };
}

export function toHistory(database: MockDatabase): Schema['CancellationHistoryItem'][] {
  return database.requests
    .filter(
      (request): request is CancellationRequest & { resolvedAt: string } =>
        (request.status === 'COMPLETED' || request.status === 'REJECTED') &&
        typeof request.resolvedAt === 'string',
    )
    .map((request) => ({
      requestId: request.id,
      orderId: request.orderId,
      orderDisplayNumber: request.orderId,
      status: request.status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED',
      reasonCode: toReasonCode(request.reasonCode),
      rejectionCode: toRejectionCode(request.rejectionCode),
      requestedBy: { type: 'OPERATOR', id: 'operator-demo', name: request.requesterName },
      resolvedBy: request.resolverName
        ? { type: 'OPERATOR', id: 'operator-demo', name: request.resolverName }
        : null,
      requestedAt: request.requestedAt,
      resolvedAt: request.resolvedAt,
      affectedAmount: toMoney(request.affectedAmount),
      refundStatus: request.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_REQUIRED',
    }));
}

export function pagination(totalItems: number, page = 1, pageSize = 20): Schema['Pagination'] {
  return { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) };
}

function toOpsOrderItem(
  item: OpsOrderItem,
  order: OpsOrder,
  database: MockDatabase,
): Schema['OpsOrderItem'] {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.name,
    imageUrl: productImage(database, item.productId),
    storeId: `store-${item.store.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    storeName: item.store,
    quantity: item.quantity,
    unitPrice: unitPrice(item),
    lineTotal: toMoney(item.lineTotal),
    status: toOrderItemStatus(item.status),
    cancellable: item.cancellable && order.dispatchedAt === null,
    cancelledAt: item.cancelled ? order.createdAt : null,
  };
}

function toOrderStatus(order: OpsOrder): Schema['OrderStatus'] {
  if (order.fulfillmentStatus === 'DELIVERED') return 'DELIVERED';
  if (order.dispatchedAt !== null || order.fulfillmentStatus === 'DISPATCHED') return 'DISPATCHED';
  if (order.fulfillmentStatus === 'AT_HUB' || order.fulfillmentStatus === 'READY_TO_DISPATCH')
    return 'READY_TO_DISPATCH';
  return 'AWAITING_STORES';
}

function toCustomerProgress(
  status: OrderItemStatus,
): Schema['CustomerOrderSummary']['progressStatus'] {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED':
    case 'AWAITING_STORES':
      return 'PENDING';
    case 'PREPARING':
      return 'PREPARING';
    case 'READY_FOR_PICKUP':
      return 'READY_FOR_PICKUP';
    case 'IN_TRANSIT_TO_HUB':
      return 'IN_TRANSIT_TO_HUB';
    case 'AT_HUB':
    case 'READY_TO_DISPATCH':
    case 'DISPATCHED':
      return 'AT_HUB';
    case 'DELIVERED':
    case 'CANCELLED':
      return 'DELIVERED';
  }
}

function toCustomerItemStatus(item: OpsOrderItem): Schema['CustomerItemStatus'] {
  if (item.status === 'CANCELLED') return 'CANCELLED';
  if (item.status === 'DELIVERED') return 'DELIVERED';
  if (item.status === 'DISPATCHED' || item.status === 'IN_TRANSIT_TO_HUB') return 'ON_THE_WAY';
  if (item.status === 'PREPARING' || item.status === 'READY_FOR_PICKUP' || item.status === 'AT_HUB')
    return 'PREPARING';
  return 'CONFIRMED';
}

function toOrderItemStatus(status: OpsOrderItem['status']): Schema['OrderItemStatus'] {
  switch (status) {
    case 'PREPARING':
    case 'READY_FOR_PICKUP':
    case 'IN_TRANSIT_TO_HUB':
    case 'AT_HUB':
    case 'CANCELLED':
      return status;
    default:
      return 'PENDING';
  }
}

function toReasonCode(value: string): Schema['CancellationReasonCode'] {
  return ['CUSTOMER_REQUEST', 'OUT_OF_STOCK', 'STORE_UNABLE', 'FRAUD_SUSPICION', 'OTHER'].includes(
    value,
  )
    ? (value as Schema['CancellationReasonCode'])
    : 'OTHER';
}

function toRejectionCode(value?: string): Schema['RejectionCode'] | null {
  return value &&
    [
      'ORDER_ALREADY_DISPATCHED',
      'ITEM_NOT_CANCELLABLE',
      'REQUEST_ALREADY_RESOLVED',
      'CONCURRENT_MODIFICATION',
      'OTHER',
    ].includes(value)
    ? (value as Schema['RejectionCode'])
    : value
      ? 'OTHER'
      : null;
}

function invalidatedBy(
  request: CancellationRequest,
  order: OpsOrder | undefined,
): Schema['CancellationInvalidatedBy'] {
  if (order?.dispatchedAt) return 'DISPATCHED';
  if (request.status !== 'PENDING') return 'REQUEST_ALREADY_RESOLVED';
  return 'ITEM_STATE_CHANGED';
}

function productImage(database: MockDatabase, productId: string): string {
  return (
    database.products.find((product) => product.id === productId)?.imageUrl ??
    '/assets/products/shirt.jpg'
  );
}

function unitPrice(item: OpsOrderItem): Schema['Money'] {
  return {
    amountMinor: Math.round(item.lineTotal.amountMinor / Math.max(1, item.quantity)),
    currency: 'ARS',
  };
}

function toMoney(money: Money): Schema['Money'] {
  return { amountMinor: money.amountMinor, currency: 'ARS' };
}

function demoAddress(recipientName: string): Schema['CustomerAddress'] {
  return {
    recipientName,
    line1: 'Av. Tizo 1042',
    line2: null,
    city: 'Buenos Aires',
    region: 'CABA',
    postalCode: 'C1000',
    countryCode: 'AR',
  };
}
