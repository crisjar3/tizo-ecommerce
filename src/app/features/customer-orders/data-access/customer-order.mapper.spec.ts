import type { components } from '../../../core/api/generated/tizo-api.types';
import { mapCustomerOrderDetail, mapCustomerOrderSummary } from './customer-orders-api.client';

type Summary = components['schemas']['CustomerOrderSummary'];
type Detail = components['schemas']['CustomerOrderDetail'];

const money = { amountMinor: 1000, currency: 'ARS' } as const;
const base: Summary = {
  id: 'order-1',
  displayNumber: '1001',
  createdAt: '2026-08-10T10:00:00.000Z',
  status: 'AWAITING_STORES',
  cancellationStatus: 'NONE',
  progressStatus: 'PENDING',
  paidTotal: money,
  activeTotal: money,
  totalItems: 1,
  cancelledItems: 0,
};

describe('customer order mapper', () => {
  it('preserves the summary item count without materializing detail lines', () => {
    const result = mapCustomerOrderSummary({ ...base, totalItems: 11 });

    expect(result.itemCount).toBe(11);
    expect(result.items).toEqual([]);
  });

  it('maps the order status and ignores progressStatus', () => {
    const cases: readonly [Summary['status'], string][] = [
      ['AWAITING_STORES', 'AWAITING_STORES'],
      ['READY_TO_DISPATCH', 'READY_TO_DISPATCH'],
      ['DISPATCHED', 'DISPATCHED'],
      ['DELIVERED', 'DELIVERED'],
    ];

    cases.forEach(([status, expected]) =>
      expect(mapCustomerOrderSummary({ ...base, status, progressStatus: 'PENDING' }).status).toBe(
        expected,
      ),
    );
    expect(mapCustomerOrderSummary({ ...base, cancellationStatus: 'FULL' }).status).toBe(
      'CANCELLED',
    );
  });

  it('maps item cancellation and refund information from a detail', () => {
    const detail: Detail = {
      ...base,
      activeTotal: { amountMinor: 0, currency: 'ARS' },
      items: [
        {
          id: 'item-1',
          productId: 'product-001',
          productName: 'Remera',
          imageUrl: 'https://images.example.test/product-001.jpg',
          quantity: 1,
          unitPrice: money,
          lineTotal: money,
          customerStatus: 'CANCELLED',
          cancellable: false,
        },
      ],
      deliveryAddress: {
        recipientName: 'Ana',
        line1: 'Calle 1',
        line2: null,
        city: 'Buenos Aires',
        region: 'CABA',
        postalCode: '1000',
        countryCode: 'AR',
      },
      cancellation: {
        requestId: 'cancel-1',
        status: 'COMPLETED',
        affectedAmount: money,
        requestedAt: base.createdAt,
        resolvedAt: base.createdAt,
        refund: { status: 'COMPLETED', amount: money, updatedAt: base.createdAt },
      },
      version: 2,
    };

    const result = mapCustomerOrderDetail(detail);
    expect(result.cancelledTotal.amountMinor).toBe(1000);
    expect(result.items[0]?.cancelled).toBeTrue();
    expect(result.items[0]?.refundStatus).toBe('COMPLETED');
  });
});
