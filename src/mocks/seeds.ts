import type {
  AuditEvent,
  CancellationRequest,
  Operator,
  OpsOrder,
  Product,
} from '../app/core/api/api-contract';
import type { MockDatabase } from './db';

const ars = (amountMinor: number) => ({ amountMinor, currency: 'ARS' });

export const seedProducts: Product[] = [
  {
    id: 'prod-running',
    name: 'Zapatillas running Nébula',
    description: 'Amortiguación liviana para entrenamientos diarios y recorridos urbanos.',
    sku: 'TIZ-RUN-041',
    store: 'UrbanRun',
    category: 'Calzado',
    price: ars(7_200_000),
    stock: 18,
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Zapatilla deportiva roja sobre fondo claro',
  },
  {
    id: 'prod-jacket',
    name: 'Campera impermeable Boreal',
    description: 'Capa exterior resistente al agua con costuras selladas y capucha ajustable.',
    sku: 'TIZ-OUT-118',
    store: 'OutdoorMax',
    category: 'Abrigos',
    price: ars(4_400_000),
    stock: 7,
    imageUrl:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Campera de cuero oscura colgada',
  },
  {
    id: 'prod-shirt',
    name: 'Remera Essential',
    description: 'Algodón pesado, cuello reforzado y calce relajado para uso diario.',
    sku: 'TIZ-BAS-205',
    store: 'Norte Studio',
    category: 'Básicos',
    price: ars(1_890_000),
    stock: 24,
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Remera blanca de algodón',
  },
  {
    id: 'prod-headphones',
    name: 'Auriculares Orbit',
    description: 'Sonido envolvente, almohadillas suaves y autonomía para toda la jornada.',
    sku: 'TIZ-AUD-311',
    store: 'Volt Market',
    category: 'Tecnología',
    price: ars(3_120_000),
    stock: 11,
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Auriculares negros sobre fondo amarillo',
  },
];

export const seedOperators: Operator[] = [
  {
    id: 'op-maria',
    name: 'Mariana Sosa',
    initials: 'MS',
    team: 'Operaciones AM',
    online: true,
    resolvedCount: 18,
  },
  {
    id: 'op-tomas',
    name: 'Tomás Leiva',
    initials: 'TL',
    team: 'Operaciones AM',
    online: true,
    resolvedCount: 14,
  },
  {
    id: 'op-lucia',
    name: 'Lucía Méndez',
    initials: 'LM',
    team: 'Operaciones PM',
    online: false,
    resolvedCount: 22,
  },
  {
    id: 'op-diego',
    name: 'Diego Acosta',
    initials: 'DA',
    team: 'Supervisión',
    online: true,
    resolvedCount: 31,
  },
];

const order1042: OpsOrder = {
  id: '1042',
  createdAt: '2026-08-03T14:25:00.000Z',
  progress: 'PREPARING',
  customerName: 'Ana Martínez',
  customerEmail: 'ana.martinez@example.test',
  fulfillmentStatus: 'PREPARING',
  cancellationStatus: 'NONE',
  version: 3,
  paidTotal: ars(12_840_000),
  cancelledTotal: ars(0),
  activeTotal: ars(12_840_000),
  items: [
    {
      id: 'item-1042-1',
      productId: 'prod-running',
      name: 'Zapatillas running Nébula',
      quantity: 1,
      lineTotal: ars(7_200_000),
      cancelled: false,
      refundStatus: 'NONE',
      sku: 'TIZ-RUN-041',
      store: 'UrbanRun',
      status: 'AT_HUB',
      cancellable: true,
      operationalEffect: 'El hub retira la línea del consolidado y devuelve el producto a stock.',
    },
    {
      id: 'item-1042-2',
      productId: 'prod-jacket',
      name: 'Campera impermeable Boreal',
      quantity: 1,
      lineTotal: ars(4_400_000),
      cancelled: false,
      refundStatus: 'NONE',
      sku: 'TIZ-OUT-118',
      store: 'OutdoorMax',
      status: 'PREPARING',
      cancellable: true,
      operationalEffect: 'La tienda detiene la preparación y repone el producto.',
    },
    {
      id: 'item-1042-3',
      productId: 'prod-shirt',
      name: 'Remera Essential',
      quantity: 1,
      lineTotal: ars(1_240_000),
      cancelled: false,
      refundStatus: 'NONE',
      sku: 'TIZ-BAS-205',
      store: 'Norte Studio',
      status: 'CONFIRMED',
      cancellable: true,
      operationalEffect: 'La tienda libera la reserva antes de iniciar la preparación.',
    },
  ],
};

const order1040: OpsOrder = {
  ...order1042,
  id: '1040',
  customerName: 'Juan Cruz Díaz',
  customerEmail: 'juan.diaz@example.test',
  createdAt: '2026-08-02T18:10:00.000Z',
  progress: 'IN_TRANSIT',
  fulfillmentStatus: 'DISPATCHED',
  paidTotal: ars(3_120_000),
  activeTotal: ars(3_120_000),
  version: 5,
  items: [
    {
      id: 'item-1040-1',
      productId: 'prod-headphones',
      name: 'Auriculares Orbit',
      quantity: 1,
      lineTotal: ars(3_120_000),
      cancelled: false,
      refundStatus: 'NONE',
      sku: 'TIZ-AUD-311',
      store: 'Volt Market',
      status: 'DISPATCHED',
      cancellable: false,
      operationalEffect: 'El paquete ya salió; corresponde iniciar una devolución.',
    },
  ],
};

const seedRequests: CancellationRequest[] = [
  {
    id: 'C-206',
    orderId: '1037',
    itemIds: ['item-1037-1'],
    items: [
      {
        itemId: 'item-1037-1',
        name: 'Remera Essential',
        store: 'Norte Studio',
        amount: ars(1_890_000),
        itemStatusBefore: 'PREPARING',
        operationalEffect: 'La tienda detiene la preparación y libera el stock.',
      },
    ],
    status: 'REJECTED',
    reasonCode: 'PRICING_ERROR',
    reasonNote: 'La publicación ya fue corregida.',
    requestedAt: '2026-08-01T12:12:00.000Z',
    requesterName: 'Mariana Sosa',
    resolverName: 'Diego Acosta',
    resolvedAt: '2026-08-01T12:28:00.000Z',
    rejectionCode: 'MANUAL_REVIEW',
    rejectionNote: 'El cliente decidió conservar el producto.',
    affectedAmount: ars(1_890_000),
    version: 2,
    validNow: false,
  },
];

const seedAudit: AuditEvent[] = [
  {
    id: 'audit-206',
    entityId: 'C-206',
    orderId: '1037',
    action: 'CANCELLATION_REJECTED',
    actorName: 'Diego Acosta',
    occurredAt: '2026-08-01T12:28:00.000Z',
    correlationId: 'corr-seed-206',
    summary: 'Solicitud rechazada; la orden no cambió.',
  },
];

export function createSeedDatabase(): MockDatabase {
  return {
    schemaVersion: 1,
    products: structuredClone(seedProducts),
    cart: [{ productId: 'prod-running', quantity: 1 }],
    orders: [structuredClone(order1042), structuredClone(order1040)],
    requests: structuredClone(seedRequests),
    operators: structuredClone(seedOperators),
    audit: structuredClone(seedAudit),
    idempotency: [],
  };
}
