export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly sku: string;
  readonly store: string;
  readonly category: string;
  readonly price: Money;
  readonly stock: number;
  readonly imageUrl: string;
  readonly imageAlt: string;
}

export interface CartItem {
  readonly product: Product;
  readonly quantity: number;
  readonly lineTotal: Money;
}

export interface Cart {
  readonly items: readonly CartItem[];
  readonly itemCount: number;
  readonly total: Money;
}

export type CustomerOrderProgress =
  | 'CONFIRMED'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderItemStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'AT_HUB'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export type CancellationStatus = 'NONE' | 'REQUESTED' | 'PARTIAL' | 'FULL';
export type RefundStatus = 'NONE' | 'PENDING' | 'SUCCEEDED' | 'MANUAL_REVIEW';

export interface CustomerOrderItem {
  readonly id: string;
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly lineTotal: Money;
  readonly cancelled: boolean;
  readonly refundStatus: RefundStatus;
}

export interface CustomerOrder {
  readonly id: string;
  readonly createdAt: string;
  readonly progress: CustomerOrderProgress;
  readonly items: readonly CustomerOrderItem[];
  readonly paidTotal: Money;
  readonly cancelledTotal: Money;
  readonly activeTotal: Money;
}

export interface OpsOrderItem extends CustomerOrderItem {
  readonly sku: string;
  readonly store: string;
  readonly status: OrderItemStatus;
  readonly cancellable: boolean;
  readonly operationalEffect: string;
}

export interface OpsOrder extends Omit<CustomerOrder, 'items'> {
  readonly customerName: string;
  readonly customerEmail: string;
  readonly fulfillmentStatus: OrderItemStatus;
  readonly cancellationStatus: CancellationStatus;
  readonly version: number;
  readonly items: readonly OpsOrderItem[];
}

export interface PaginatedOrders {
  readonly items: readonly OpsOrder[];
  readonly page: number;
  readonly total: number;
}

export type CancellationRequestStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface CancellationRequestItem {
  readonly itemId: string;
  readonly name: string;
  readonly store: string;
  readonly amount: Money;
  readonly itemStatusBefore: OrderItemStatus;
  readonly operationalEffect: string;
}

export interface CancellationRequest {
  readonly id: string;
  readonly orderId: string;
  readonly itemIds: readonly string[];
  readonly items: readonly CancellationRequestItem[];
  readonly status: CancellationRequestStatus;
  readonly reasonCode: string;
  readonly reasonNote: string;
  readonly requestedAt: string;
  readonly requesterName: string;
  readonly resolverName?: string;
  readonly resolvedAt?: string;
  readonly rejectionCode?: string;
  readonly rejectionNote?: string;
  readonly effectiveOrderId?: string;
  readonly affectedAmount: Money;
  readonly version: number;
  readonly validNow: boolean;
  readonly invalidReason?: string;
}

export interface Operator {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly team: string;
  readonly online: boolean;
  readonly resolvedCount: number;
}

export interface AuditEvent {
  readonly id: string;
  readonly entityId: string;
  readonly orderId: string;
  readonly action: string;
  readonly actorName: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly summary: string;
}

export interface CreateCancellationCommand {
  readonly orderId: string;
  readonly itemIds: readonly string[];
  readonly reasonCode: string;
  readonly reasonNote: string;
  readonly idempotencyKey: string;
}

export interface CheckoutCommand {
  readonly idempotencyKey: string;
}

export interface ResolveCancellationCommand {
  readonly idempotencyKey: string;
  readonly expectedVersion: number;
  readonly rejectionCode?: string;
  readonly rejectionNote?: string;
}

export interface ApiErrorEnvelope {
  readonly code: string;
  readonly message: string;
  readonly correlationId: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
}

export const CANCELLATION_REASONS = [
  { code: 'CUSTOMER_REQUEST', label: 'Pedido del cliente' },
  { code: 'OUT_OF_STOCK', label: 'Sin stock en tienda' },
  { code: 'PRICING_ERROR', label: 'Error de precio' },
  { code: 'DAMAGED_ITEM', label: 'Producto dañado' },
] as const;
