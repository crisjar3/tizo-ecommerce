import {
  opsOrderCancellationTone,
  opsOrderStatusLabel,
  opsOrderStatusTone,
} from './ops-order-status';

describe('operations order status presentation', () => {
  it('keeps terminal outcomes semantically distinct', () => {
    expect(opsOrderStatusTone('DELIVERED')).toBe('success');
    expect(opsOrderStatusTone('CANCELLED')).toBe('danger');
  });

  it('uses warning for pending work and info for movement or readiness', () => {
    expect(opsOrderStatusTone('AWAITING_STORES')).toBe('warning');
    expect(opsOrderStatusTone('PREPARING')).toBe('warning');
    expect(opsOrderStatusTone('READY_TO_DISPATCH')).toBe('info');
    expect(opsOrderStatusTone('DISPATCHED')).toBe('info');
    expect(opsOrderStatusLabel('AT_HUB')).toBe('En hub');
  });

  it('distinguishes partial and full cancellation impact', () => {
    expect(opsOrderCancellationTone('NONE')).toBe('neutral');
    expect(opsOrderCancellationTone('REQUESTED')).toBe('warning');
    expect(opsOrderCancellationTone('PARTIAL')).toBe('warning');
    expect(opsOrderCancellationTone('FULL')).toBe('danger');
  });
});
