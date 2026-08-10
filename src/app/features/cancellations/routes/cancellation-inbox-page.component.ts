import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type {
  CancellationRequest,
  CancellationRequestStatus,
} from '../../../core/api/api-contract';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import type { StatusTone } from '../../../shared/ui/status-badge/status-badge.component';
import { CancellationsStore } from '../state/cancellations.store';

@Component({
  selector: 'app-cancellation-inbox-page',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgFor,
    NgIf,
    RouterLink,
    LucideAngularModule,
    MoneyPipe,
    PageStateComponent,
    StatusBadgeComponent,
  ],
  providers: [CancellationsStore],
  template: `
    <header class="page-header">
      <div>
        <span class="eyebrow">Cancelaciones</span>
        <h1 class="page-heading">Solicitudes</h1>
        <p class="page-lead">
          Revisá cada caso contra el estado vigente antes de tomar una decisión.
        </p>
      </div>
      <a class="btn btn--secondary" routerLink="/cancellations/history"
        ><lucide-icon name="history" [size]="15" /> Ver historial</a
      >
    </header>
    <nav class="tabs" aria-label="Estado de solicitudes">
      <button type="button" [class.active]="status === 'PENDING'" (click)="setStatus('PENDING')">
        Pendientes</button
      ><button
        type="button"
        [class.active]="status === 'COMPLETED'"
        (click)="setStatus('COMPLETED')"
      >
        Aprobadas</button
      ><button type="button" [class.active]="status === 'REJECTED'" (click)="setStatus('REJECTED')">
        Rechazadas</button
      ><button type="button" [class.active]="status === ''" (click)="setStatus('')">Todas</button>
    </nav>

    <ng-container *ngIf="store.requests$ | async as state">
      <section class="request-list content-card" *ngIf="state.data !== null && state.data.length">
        <a
          class="request-row"
          *ngFor="let request of state.data; trackBy: trackRequest"
          [routerLink]="['/cancellations', request.id]"
          ><span class="request-avatar">{{ request.requesterName.slice(0, 1) }}</span
          ><span class="request-copy"
            ><strong>{{ request.id }} · Orden #{{ request.orderId }}</strong
            ><small
              >{{ request.requesterName }} · {{ request.requestedAt | date: 'd MMM, HH:mm' }}</small
            ><span
              >{{ request.items.length }}
              {{ request.items.length === 1 ? 'producto' : 'productos' }} ·
              {{ request.reasonCode }}</span
            ></span
          ><span
            class="validity"
            *ngIf="request.status === 'PENDING'"
            [class.validity--invalid]="!request.validNow"
            ><lucide-icon
              [name]="request.validNow ? 'circle-check' : 'triangle-alert'"
              [size]="13"
            />{{ request.validNow ? 'Vigente' : 'Cambió' }}</span
          ><app-status-badge
            [label]="statusLabel(request.status)"
            [tone]="statusTone(request.status)" /><strong>{{
            request.affectedAmount | money
          }}</strong
          ><lucide-icon name="chevron-right" [size]="16"
        /></a>
      </section>
      <div class="empty-center panel" *ngIf="state.data !== null && !state.data.length">
        <app-page-state
          title="No hay solicitudes en esta vista"
          message="Las solicitudes que coincidan con el estado elegido aparecerán acá."
          actionLabel="Ver todas"
          (action)="setStatus('')"
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Cargando solicitudes"
          message="Estamos verificando el estado vigente de cada orden."
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'error' && state.data === null">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Reintentar"
          (action)="store.loadRequests(status)"
        />
      </div>
    </ng-container>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }
      .eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .tabs {
        display: flex;
        gap: 4px;
        margin: 0 0 14px;
        padding: 4px;
        border: 1px solid var(--tizo-border);
        border-radius: 11px;
        background: #fff;
        width: max-content;
      }
      .tabs button {
        min-height: 32px;
        padding: 0 13px;
        border-radius: 8px;
        background: transparent;
        color: var(--tizo-muted);
        cursor: pointer;
        font-size: 10px;
        font-weight: 800;
      }
      .tabs button.active {
        background: var(--tizo-primary);
        color: #fff;
      }
      .request-row {
        display: grid;
        min-height: 84px;
        align-items: center;
        gap: 12px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--tizo-border);
        color: inherit;
        grid-template-columns: 38px minmax(180px, 1fr) auto auto 105px 17px;
        text-decoration: none;
      }
      .request-row:last-child {
        border-bottom: 0;
      }
      .request-row:hover {
        background: var(--tizo-subtle);
      }
      .request-avatar {
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border-radius: 50%;
        background: var(--tizo-accent-soft);
        color: var(--tizo-accent);
        font-size: 12px;
        font-weight: 800;
      }
      .request-copy {
        display: grid;
        gap: 3px;
      }
      .request-copy strong {
        font-size: 11.5px;
      }
      .request-copy small,
      .request-copy > span {
        color: var(--tizo-muted);
        font-size: 9px;
      }
      .validity {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--tizo-success);
        font-size: 9.5px;
        font-weight: 800;
      }
      .validity--invalid {
        color: var(--tizo-warning);
      }
      .request-row > strong {
        text-align: right;
        font-size: 11.5px;
      }
      @media (max-width: 850px) {
        .request-row {
          align-items: start;
          grid-template-columns: 38px 1fr auto;
        }
        .request-copy {
          grid-column: 2;
        }
        .validity {
          grid-column: 2;
        }
        .request-row app-status-badge {
          grid-column: 3;
          grid-row: 1;
        }
        .request-row > strong {
          grid-column: 3;
        }
        .request-row > lucide-icon {
          display: none;
        }
      }
      @media (max-width: 620px) {
        .page-header {
          align-items: stretch;
          flex-direction: column;
        }
        .tabs {
          width: 100%;
          overflow: auto;
        }
        .tabs button {
          flex: 1;
        }
        .request-list {
          border: 0;
          background: transparent;
        }
        .request-row {
          margin-bottom: 10px;
          border: 1px solid var(--tizo-border);
          border-radius: 13px;
          background: #fff;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancellationInboxPageComponent implements OnInit {
  readonly store = inject(CancellationsStore);
  status = 'PENDING';
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.status = params.get('status') ?? 'PENDING';
      this.store.loadRequests(this.status);
    });
  }
  setStatus(status: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null },
    });
  }
  trackRequest(_: number, request: CancellationRequest): string {
    return request.id;
  }
  statusLabel(status: CancellationRequestStatus): string {
    return {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      COMPLETED: 'Completada',
      REJECTED: 'Rechazada',
    }[status];
  }
  statusTone(status: CancellationRequestStatus): StatusTone {
    return status === 'COMPLETED'
      ? 'success'
      : status === 'REJECTED'
        ? 'danger'
        : status === 'APPROVED'
          ? 'info'
          : 'warning';
  }
}
