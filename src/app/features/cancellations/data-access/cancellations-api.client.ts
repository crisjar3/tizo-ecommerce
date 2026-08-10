import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import type {
  AuditEvent,
  CancellationRequest,
  CreateCancellationCommand,
  ResolveCancellationCommand,
} from '../../../core/api/api-contract';
import type { components } from '../../../core/api/generated/tizo-api.types';
import { withCommandPolicy, withReadPolicy } from '../../../core/api/http-policies';

type CancellationListDto = components['schemas']['CancellationRequestListResponse'];
type CancellationDetailDto = components['schemas']['CancellationRequestDetail'];
type CreateOpsResponseDto = components['schemas']['CreateOpsCancellationResponse'];
type CustomerReceiptDto = components['schemas']['CustomerCancellationReceipt'];
type CustomerReconciliationDto =
  components['schemas']['CustomerCancellationReconciliationResponse'];
type ResolveResponseDto = components['schemas']['ResolveCancellationResponse'];
type OpsReconciliationDto = components['schemas']['OpsCancellationReconciliationResponse'];
type HistoryDto = components['schemas']['CancellationHistoryResponse'];
export type IdempotencyScope = components['schemas']['IdempotencyScope'];

@Injectable({ providedIn: 'root' })
export class CancellationsApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  create(command: CreateCancellationCommand, customer: boolean): Observable<CancellationRequest> {
    const body = {
      itemIds: [...command.itemIds],
      reasonCode: command.reasonCode as components['schemas']['CancellationReasonCode'],
      reasonNote: command.reasonNote || undefined,
      idempotencyKey: command.idempotencyKey,
      expectedOrderVersion: command.expectedOrderVersion ?? 0,
    };

    if (customer) {
      return this.http
        .post<CustomerReceiptDto>(
          `${this.base}/me/orders/${command.orderId}/cancellation-requests`,
          body,
        )
        .pipe(
          withCommandPolicy(),
          map((receipt) => mapCustomerReceipt(receipt, command)),
        );
    }

    return this.http
      .post<CreateOpsResponseDto>(`${this.base}/ops/cancellation-requests`, {
        orderId: command.orderId,
        ...body,
      })
      .pipe(
        withCommandPolicy(),
        map((response) => mapCancellationDetail(response.request)),
      );
  }

  list(status = ''): Observable<readonly CancellationRequest[]> {
    const normalizedStatus = status === 'REQUESTED' ? 'PENDING' : status;
    const params = normalizedStatus ? new HttpParams().set('status', normalizedStatus) : undefined;
    return this.http
      .get<CancellationListDto>(`${this.base}/ops/cancellation-requests`, { params })
      .pipe(
        withReadPolicy(),
        map((response) => response.items.map(mapCancellationSummary)),
      );
  }

  get(requestId: string): Observable<CancellationRequest> {
    return this.http
      .get<CancellationDetailDto>(`${this.base}/ops/cancellation-requests/${requestId}`)
      .pipe(withReadPolicy(), map(mapCancellationDetail));
  }

  approve(requestId: string, command: ResolveCancellationCommand): Observable<CancellationRequest> {
    return this.http
      .post<ResolveResponseDto>(`${this.base}/ops/cancellation-requests/${requestId}/approve`, {
        idempotencyKey: command.idempotencyKey,
        expectedRequestVersion: command.expectedVersion,
        expectedOrderVersion: command.expectedOrderVersion ?? 0,
      })
      .pipe(
        withCommandPolicy(),
        map((response) => mapCancellationDetail(response.request)),
      );
  }

  reject(requestId: string, command: ResolveCancellationCommand): Observable<CancellationRequest> {
    return this.http
      .post<ResolveResponseDto>(`${this.base}/ops/cancellation-requests/${requestId}/reject`, {
        idempotencyKey: command.idempotencyKey,
        expectedRequestVersion: command.expectedVersion,
        rejectionCode: (command.rejectionCode ?? 'OTHER') as components['schemas']['RejectionCode'],
        rejectionNote: command.rejectionNote || undefined,
      })
      .pipe(
        withCommandPolicy(),
        map((response) => mapCancellationDetail(response.request)),
      );
  }

  reconcileOps(idempotencyKey: string, scope: IdempotencyScope): Observable<CancellationRequest> {
    const params = new HttpParams().set('scope', scope);
    return this.http
      .get<OpsReconciliationDto>(
        `${this.base}/ops/cancellation-requests/by-idempotency-key/${encodeURIComponent(idempotencyKey)}`,
        { params },
      )
      .pipe(
        withReadPolicy(),
        map((response) => mapCancellationDetail(response.request)),
      );
  }

  reconcileCustomer(idempotencyKey: string): Observable<CancellationRequest> {
    return this.http
      .get<CustomerReconciliationDto>(
        `${this.base}/me/cancellation-requests/by-idempotency-key/${encodeURIComponent(idempotencyKey)}`,
      )
      .pipe(
        withReadPolicy(),
        map((response) =>
          mapCustomerReceipt(response.request, {
            orderId: response.request.orderId,
            itemIds: response.request.itemIds,
            reasonCode: 'CUSTOMER_REQUEST',
            reasonNote: '',
            idempotencyKey,
          }),
        ),
      );
  }

  history(): Observable<readonly AuditEvent[]> {
    return this.http.get<HistoryDto>(`${this.base}/ops/cancellation-history`).pipe(
      withReadPolicy(),
      map((response) => response.items.map(mapHistoryItem)),
    );
  }
}

function mapCancellationSummary(dto: CancellationListDto['items'][number]): CancellationRequest {
  return {
    id: dto.id,
    orderId: dto.orderId,
    itemIds: [],
    items: [],
    status: dto.status,
    reasonCode: dto.reasonCode,
    reasonNote: '',
    requestedAt: dto.requestedAt,
    requesterName: dto.requestedBy.name,
    resolverName: undefined,
    resolvedAt: dto.resolvedAt ?? undefined,
    affectedAmount: { ...dto.requestedAmount },
    version: 0,
    validNow: dto.status === 'PENDING',
  };
}

export function mapCancellationDetail(dto: CancellationDetailDto): CancellationRequest {
  return {
    id: dto.id,
    orderId: dto.orderId,
    itemIds: dto.items.map((item) => item.itemId),
    items: dto.items.map((item) => ({
      itemId: item.itemId,
      name: item.productName,
      store: item.storeName,
      amount: { ...item.requestedAmount },
      itemStatusBefore: item.currentStatus,
      operationalEffect: item.stillCancellable
        ? 'Se actualizará inventario, notificación y reembolso por separado.'
        : 'La línea ya no admite cancelación.',
    })),
    status: dto.status,
    reasonCode: dto.reasonCode,
    reasonNote: dto.reasonNote ?? '',
    requestedAt: dto.requestedAt,
    requesterName: dto.requestedBy.name,
    resolverName: dto.resolvedBy?.name,
    resolvedAt: dto.resolvedAt ?? undefined,
    rejectionCode: dto.rejectionCode ?? undefined,
    rejectionNote: dto.rejectionNote ?? undefined,
    effectiveOrderId: dto.effectiveOrderId ?? undefined,
    affectedAmount: { ...dto.currentAffectedAmount },
    version: dto.version,
    currentOrderVersion: dto.currentOrderVersion,
    validNow: dto.stillValid,
    invalidReason: dto.invalidatedBy ?? undefined,
  };
}

function mapCustomerReceipt(
  dto: CustomerReceiptDto,
  command: CreateCancellationCommand,
): CancellationRequest {
  return {
    id: dto.requestId,
    orderId: dto.orderId,
    itemIds: [...dto.itemIds],
    items: [],
    status: 'PENDING',
    reasonCode: command.reasonCode,
    reasonNote: command.reasonNote,
    requestedAt: dto.requestedAt,
    requesterName: 'Cliente',
    affectedAmount: { ...dto.affectedAmount },
    version: 0,
    validNow: true,
  };
}

function mapHistoryItem(dto: HistoryDto['items'][number]): AuditEvent {
  return {
    id: dto.requestId,
    entityId: dto.requestId,
    orderId: dto.orderId,
    action: dto.status === 'REJECTED' ? 'REQUEST_REJECTED' : 'CANCELLATION_COMPLETED',
    actorName: dto.resolvedBy?.name ?? 'Sistema',
    occurredAt: dto.resolvedAt,
    correlationId: 'Disponible en el detalle',
    summary:
      dto.status === 'REJECTED'
        ? `Solicitud ${dto.orderDisplayNumber} rechazada`
        : `Cancelación ${dto.orderDisplayNumber} completada`,
  };
}
