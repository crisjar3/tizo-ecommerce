import type { CancellationStatus, OrderItemStatus } from '../../../core/api/api-contract';
import type { StatusTone } from '../../../shared/ui/status-badge/status-badge.component';

const LABELS: Readonly<Record<OrderItemStatus, string>> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  PREPARING: 'En preparación',
  READY_FOR_PICKUP: 'Lista para retirar',
  IN_TRANSIT_TO_HUB: 'Hacia el hub',
  AT_HUB: 'En hub',
  AWAITING_STORES: 'Esperando tiendas',
  READY_TO_DISPATCH: 'Lista para despachar',
  DISPATCHED: 'Despachada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

const TONES: Readonly<Record<OrderItemStatus, StatusTone>> = {
  PENDING: 'warning',
  CONFIRMED: 'neutral',
  PREPARING: 'warning',
  READY_FOR_PICKUP: 'info',
  IN_TRANSIT_TO_HUB: 'info',
  AT_HUB: 'info',
  AWAITING_STORES: 'warning',
  READY_TO_DISPATCH: 'info',
  DISPATCHED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

const CANCELLATION_TONES: Readonly<Record<CancellationStatus, StatusTone>> = {
  NONE: 'neutral',
  REQUESTED: 'warning',
  PARTIAL: 'warning',
  FULL: 'danger',
};

export function opsOrderStatusLabel(status: OrderItemStatus): string {
  return LABELS[status];
}

export function opsOrderStatusTone(status: OrderItemStatus): StatusTone {
  return TONES[status];
}

export function opsOrderCancellationTone(status: CancellationStatus): StatusTone {
  return CANCELLATION_TONES[status];
}
