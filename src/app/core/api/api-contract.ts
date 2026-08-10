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
  readonly available: boolean;
  readonly longDescription?: string;
  readonly imageUrls?: readonly string[];
  readonly attributes?: readonly { readonly name: string; readonly value: string }[];
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

export type CustomerOrderStatus =
  | 'AWAITING_STORES'
  | 'READY_TO_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderItemStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'IN_TRANSIT_TO_HUB'
  | 'AT_HUB'
  | 'AWAITING_STORES'
  | 'READY_TO_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export type CancellationStatus = 'NONE' | 'REQUESTED' | 'PARTIAL' | 'FULL';
export type RefundStatus =
  | 'NONE'
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SUCCEEDED'
  | 'MANUAL_REVIEW';

export interface CustomerOrderItem {
  readonly id: string;
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly lineTotal: Money;
  readonly cancelled: boolean;
  readonly refundStatus: RefundStatus;
  readonly imageUrl?: string;
  readonly cancellable?: boolean;
}

export interface CustomerOrder {
  readonly id: string;
  readonly createdAt: string;
  readonly status: CustomerOrderStatus;
  readonly itemCount: number;
  readonly items: readonly CustomerOrderItem[];
  readonly paidTotal: Money;
  readonly cancelledTotal: Money;
  readonly activeTotal: Money;
  readonly version?: number;
}

export interface OpsOrderItem extends CustomerOrderItem {
  readonly sku: string;
  readonly store: string;
  readonly status: OrderItemStatus;
  readonly cancellable: boolean;
  readonly operationalEffect: string;
}

export interface OpsOrder extends Omit<CustomerOrder, 'items' | 'status'> {
  readonly customerName: string;
  readonly customerEmail: string;
  readonly fulfillmentStatus: OrderItemStatus;
  readonly cancellationStatus: CancellationStatus;
  readonly version: number;
  readonly dispatchedAt: string | null;
  readonly items: readonly OpsOrderItem[];
}

export interface PaginatedOrders {
  readonly items: readonly OpsOrder[];
  readonly page: number;
  readonly total: number;
}

export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

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
  readonly currentOrderVersion?: number;
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
  readonly email?: string;
  readonly role?: 'OPERATOR' | 'SUPERVISOR';
  readonly active?: boolean;
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
  readonly expectedOrderVersion?: number;
}

export interface CheckoutCommand {
  readonly idempotencyKey: string;
}

export interface ResolveCancellationCommand {
  readonly idempotencyKey: string;
  readonly expectedVersion: number;
  readonly expectedOrderVersion?: number;
  readonly rejectionCode?: string;
  readonly rejectionNote?: string;
}

export interface ApiErrorEnvelope {
  readonly code: string;
  readonly message: string;
  readonly correlationId: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
  readonly recoveryAction?: string;
}

export const CANCELLATION_REASONS = [
  { code: 'CUSTOMER_REQUEST', label: 'Pedido del cliente' },
  { code: 'OUT_OF_STOCK', label: 'Sin stock en tienda' },
  { code: 'STORE_UNABLE', label: 'La tienda no puede completar la línea' },
  { code: 'FRAUD_SUSPICION', label: 'Revisión preventiva por fraude' },
  { code: 'OTHER', label: 'Otro motivo' },
] as const;
