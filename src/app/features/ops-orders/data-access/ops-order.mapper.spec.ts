import type { OpsOrderDetailDto, PaginatedOpsOrdersDto } from './ops-order.mapper';
import { mapOpsOrderDto, mapPaginatedOpsOrdersDto } from './ops-order.mapper';

const money = { amountMinor: 7200000, currency: 'ARS' } as const;

const summary = {
  id: 'order-1042',
  displayNumber: '1042',
  customer: { id: 'customer-1', name: 'Ana Martínez', email: 'ana@example.test' },
  createdAt: '2026-08-03T14:25:00.000Z',
  updatedAt: '2026-08-03T15:00:00.000Z',
  status: 'AWAITING_STORES',
  cancellationStatus: 'NONE',
  dispatchedAt: null,
  paidTotal: money,
  activeTotal: money,
  totalItems: 1,
  cancelledItems: 0,
  version: 3,
} as const;

const detail: OpsOrderDetailDto = {
  ...summary,
  items: [
    {
      id: 'item-1',
      productId: 'product-001',
      productName: 'Remera Essential',
      imageUrl: 'https://images.example.test/product-001.jpg',
      storeId: 'store-1',
      storeName: 'Norte Studio',
      quantity: 1,
      unitPrice: money,
      lineTotal: money,
      status: 'PREPARING',
      cancellable: true,
      cancelledAt: null,
    },
  ],
  deliveryAddress: {
    recipientName: 'Ana Martínez',
    line1: 'Calle 1',
    line2: null,
    city: 'Buenos Aires',
    region: 'CABA',
    postalCode: '1000',
    countryCode: 'AR',
  },
  stores: [{ id: 'store-1', name: 'Norte Studio' }],
  hub: null,
  activeCancellationRequestId: null,
  cancellationEligibility: {
    eligible: true,
    eligibleItemIds: ['item-1'],
    blockedBy: null,
  },
};

describe('operations order DTO mapper', () => {
  it('maps the official detail into an isolated domain object', () => {
    const result = mapOpsOrderDto(detail);

    expect(result.id).toBe('order-1042');
    expect(result.customerName).toBe('Ana Martínez');
    expect(result.items[0]?.name).toBe('Remera Essential');
    expect(result.items as unknown).not.toBe(detail.items as unknown);
    expect(result.items[0]?.lineTotal).not.toBe(detail.items[0]?.lineTotal);
  });

  it('maps official pagination without leaking DTO item references', () => {
    const dto: PaginatedOpsOrdersDto = {
      items: [summary],
      pagination: { page: 2, pageSize: 20, totalItems: 7, totalPages: 1 },
    };
    const result = mapPaginatedOpsOrdersDto(dto);

    expect(result.page).toBe(2);
    expect(result.total).toBe(7);
    expect(result.items[0]?.customerName).toBe('Ana Martínez');
    expect(result.items[0] as unknown).not.toBe(summary as unknown);
  });

  it('derives progress from every official order status and full cancellation', () => {
    expect(
      mapPaginatedOpsOrdersDto({
        items: [summary],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      }).items[0]?.progress,
    ).toBe('CONFIRMED');
    expect(
      mapPaginatedOpsOrdersDto({
        items: [{ ...summary, status: 'READY_TO_DISPATCH' }],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      }).items[0]?.progress,
    ).toBe('PREPARING');
    expect(
      mapPaginatedOpsOrdersDto({
        items: [{ ...summary, status: 'DISPATCHED' }],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      }).items[0]?.progress,
    ).toBe('IN_TRANSIT');
    expect(
      mapPaginatedOpsOrdersDto({
        items: [{ ...summary, status: 'DELIVERED' }],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      }).items[0]?.progress,
    ).toBe('DELIVERED');
    expect(
      mapPaginatedOpsOrdersDto({
        items: [{ ...summary, cancellationStatus: 'FULL' }],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      }).items[0]?.progress,
    ).toBe('CANCELLED');
  });
});
