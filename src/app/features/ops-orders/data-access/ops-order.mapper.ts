import type {
  Money,
  OpsOrder,
  OpsOrderItem,
  PaginatedOrders,
} from '../../../core/api/api-contract';
import type { components } from '../../../core/api/generated/tizo-api.types';
import { resolveProductImage } from '../../../core/api/product-image';

export type OpsOrderSummaryDto = components['schemas']['OpsOrderSummary'];
export type OpsOrderDetailDto = components['schemas']['OpsOrderDetail'];
export type PaginatedOpsOrdersDto = components['schemas']['OpsOrderListResponse'];

export function mapOpsOrderSummary(dto: OpsOrderSummaryDto): OpsOrder {
  return {
    id: dto.id,
    createdAt: dto.createdAt,
    itemCount: dto.totalItems,
    paidTotal: cloneMoney(dto.paidTotal),
    cancelledTotal: subtractMoney(dto.paidTotal, dto.activeTotal),
    activeTotal: cloneMoney(dto.activeTotal),
    customerName: dto.customer.name,
    customerEmail: dto.customer.email,
    fulfillmentStatus: dto.status,
    cancellationStatus: dto.cancellationStatus,
    version: dto.version,
    dispatchedAt: dto.dispatchedAt,
    items: [],
  };
}

export function mapOpsOrderDto(dto: OpsOrderDetailDto): OpsOrder {
  return {
    ...mapOpsOrderSummary(dto),
    items: dto.items.map(mapOpsOrderItem),
  };
}

export function mapPaginatedOpsOrdersDto(dto: PaginatedOpsOrdersDto): PaginatedOrders {
  return {
    items: dto.items.map(mapOpsOrderSummary),
    page: dto.pagination.page,
    total: dto.pagination.totalItems,
  };
}

function mapOpsOrderItem(dto: OpsOrderDetailDto['items'][number]): OpsOrderItem {
  return {
    id: dto.id,
    productId: dto.productId,
    name: dto.productName,
    quantity: dto.quantity,
    lineTotal: cloneMoney(dto.lineTotal),
    cancelled: dto.status === 'CANCELLED',
    refundStatus: 'NOT_REQUIRED',
    imageUrl: resolveProductImage(dto.productId, dto.imageUrl),
    cancellable: dto.cancellable,
    sku: dto.productId,
    store: dto.storeName,
    status: dto.status,
    operationalEffect: dto.cancellable
      ? 'Se liberará el inventario reservado al aprobar.'
      : 'La línea ya no admite cancelación.',
  };
}

function cloneMoney(money: Money): Money {
  return { amountMinor: money.amountMinor, currency: money.currency };
}

function subtractMoney(paid: Money, active: Money): Money {
  return {
    amountMinor: Math.max(0, paid.amountMinor - active.amountMinor),
    currency: paid.currency,
  };
}
