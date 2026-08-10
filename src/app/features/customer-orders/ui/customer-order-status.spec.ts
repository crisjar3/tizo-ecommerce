import {
  customerOrderStatusCopy,
  customerOrderStatusLabel,
  customerOrderStatusTitle,
  customerOrderStatusTone,
} from './customer-order-status';

describe('customer order status presentation', () => {
  it('assigns a distinct semantic tone to each order outcome', () => {
    expect(customerOrderStatusTone('AWAITING_STORES')).toBe('warning');
    expect(customerOrderStatusTone('READY_TO_DISPATCH')).toBe('info');
    expect(customerOrderStatusTone('DISPATCHED')).toBe('info');
    expect(customerOrderStatusTone('DELIVERED')).toBe('success');
    expect(customerOrderStatusTone('CANCELLED')).toBe('danger');
  });

  it('provides customer-facing copy for every official status', () => {
    expect(customerOrderStatusLabel('AWAITING_STORES')).toBe('Esperando tiendas');
    expect(customerOrderStatusLabel('READY_TO_DISPATCH')).toBe('Listo para despachar');
    expect(customerOrderStatusLabel('DISPATCHED')).toBe('Despachado');
    expect(customerOrderStatusLabel('DELIVERED')).toBe('Entregado');
    expect(customerOrderStatusLabel('CANCELLED')).toBe('Cancelado');
    expect(customerOrderStatusTitle('DELIVERED')).toContain('entregado');
    expect(customerOrderStatusCopy('CANCELLED')).toContain('canceladas');
  });
});
