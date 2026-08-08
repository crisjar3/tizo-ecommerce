import type { Money, OpsOrder, OpsOrderItem } from '../../../core/api/api-contract';

/** Wire shape owned by the operations order data-access boundary. */
export interface OpsOrderDto {
  readonly id: string;
  readonly createdAt: string;
  readonly progress: OpsOrder['progress'];
  readonly paidTotal: Money;
  readonly cancelledTotal: Money;
  readonly activeTotal: Money;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly fulfillmentStatus: OpsOrder['fulfillmentStatus'];
  readonly cancellationStatus: OpsOrder['cancellationStatus'];
  readonly version: number;
  readonly items: readonly OpsOrderItem[];
}

export interface PaginatedOpsOrdersDto {
  readonly items: readonly OpsOrderDto[];
  readonly page: number;
  readonly total: number;
}

export function mapOpsOrderDto(dto: OpsOrderDto): OpsOrder {
  return {
    id: dto.id,
    createdAt: dto.createdAt,
    progress: dto.progress,
    paidTotal: cloneMoney(dto.paidTotal),
    cancelledTotal: cloneMoney(dto.cancelledTotal),
    activeTotal: cloneMoney(dto.activeTotal),
    customerName: dto.customerName,
    customerEmail: dto.customerEmail,
    fulfillmentStatus: dto.fulfillmentStatus,
    cancellationStatus: dto.cancellationStatus,
    version: dto.version,
    items: dto.items.map((item) => ({
      ...item,
      lineTotal: cloneMoney(item.lineTotal),
    })),
  };
}

export function mapPaginatedOpsOrdersDto(dto: PaginatedOpsOrdersDto): {
  readonly items: readonly OpsOrder[];
  readonly page: number;
  readonly total: number;
} {
  return {
    items: dto.items.map(mapOpsOrderDto),
    page: dto.page,
    total: dto.total,
  };
}

function cloneMoney(money: Money): Money {
  return { amountMinor: money.amountMinor, currency: money.currency };
}
