import type { CustomerOrderStatus } from '../../../core/api/api-contract';
import type { StatusTone } from '../../../shared/ui/status-badge/status-badge.component';

const LABELS: Readonly<Record<CustomerOrderStatus, string>> = {
  AWAITING_STORES: 'Esperando tiendas',
  READY_TO_DISPATCH: 'Listo para despachar',
  DISPATCHED: 'Despachado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const TONES: Readonly<Record<CustomerOrderStatus, StatusTone>> = {
  AWAITING_STORES: 'warning',
  READY_TO_DISPATCH: 'info',
  DISPATCHED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

export function customerOrderStatusLabel(status: CustomerOrderStatus): string {
  return LABELS[status];
}

export function customerOrderStatusTone(status: CustomerOrderStatus): StatusTone {
  return TONES[status];
}

export function customerOrderStatusTitle(status: CustomerOrderStatus): string {
  return {
    AWAITING_STORES: 'Las tiendas están preparando tu pedido',
    READY_TO_DISPATCH: 'Tu pedido está listo para salir',
    DISPATCHED: 'Tu pedido está en camino',
    DELIVERED: 'Tu pedido fue entregado',
    CANCELLED: 'Este pedido fue cancelado',
  }[status];
}

export function customerOrderStatusCopy(status: CustomerOrderStatus): string {
  return {
    AWAITING_STORES: 'Estamos coordinando los productos de tu compra con cada tienda.',
    READY_TO_DISPATCH: 'Todos los productos están consolidados y esperan el despacho.',
    DISPATCHED: 'El pedido salió del centro de distribución hacia tu dirección.',
    DELIVERED: 'La entrega fue completada.',
    CANCELLED: 'Las líneas canceladas y sus reembolsos aparecen debajo.',
  }[status];
}
