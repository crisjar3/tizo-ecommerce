import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import type { OpsOrder, OrderItemStatus } from '../../../core/api/api-contract';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import type { StatusTone } from '../../../shared/ui/status-badge/status-badge.component';
import { OpsOrdersStore } from '../state/ops-orders.store';

@Component({
  selector: 'app-ops-orders-page',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    MoneyPipe,
    PageStateComponent,
    StatusBadgeComponent,
  ],
  providers: [OpsOrdersStore],
  template: `
    <header class="page-header">
      <div>
        <span class="eyebrow">Operaciones</span>
        <h1 class="page-heading">Órdenes</h1>
        <p class="page-lead">
          Investigá el estado real de cada línea antes de crear una solicitud.
        </p>
      </div>
      <a class="btn btn--secondary" routerLink="/cancellations"
        ><lucide-icon name="inbox" [size]="15" /> Ver solicitudes</a
      >
    </header>

    <form class="filters panel" [formGroup]="filters" aria-label="Filtros de órdenes">
      <label
        ><span class="sr-only">Buscar orden o cliente</span
        ><lucide-icon name="search" [size]="16" /><input
          formControlName="search"
          type="search"
          placeholder="Buscar orden o cliente"
      /></label>
      <select formControlName="status" aria-label="Estado de preparación">
        <option value="">Todos los estados</option>
        <option value="CONFIRMED">Confirmadas</option>
        <option value="PREPARING">En preparación</option>
        <option value="DISPATCHED">Despachadas</option>
        <option value="DELIVERED">Entregadas</option>
      </select>
      <select formControlName="cancellation" aria-label="Estado de cancelación">
        <option value="">Toda cancelación</option>
        <option value="NONE">Sin cancelación</option>
        <option value="PARTIAL">Parcial</option>
        <option value="FULL">Completa</option>
      </select>
      <button class="btn btn--secondary" type="button" (click)="clearFilters()">
        <lucide-icon name="rotate-ccw" [size]="14" /> Limpiar
      </button>
    </form>

    <ng-container *ngIf="store.orders$ | async as state">
      <section
        class="orders-table content-card"
        *ngIf="state.status === 'success' && state.data.items.length"
      >
        <div class="table-header">
          <span>Orden</span><span>Cliente</span><span>Preparación</span><span>Cancelación</span
          ><span>Total vigente</span><span></span>
        </div>
        <a
          class="table-row"
          *ngFor="let order of state.data.items; trackBy: trackOrder"
          [routerLink]="['/orders', order.id]"
          ><span class="order-id"
            ><strong>#{{ order.id }}</strong
            ><small>{{ order.createdAt | date: 'd MMM, HH:mm' }}</small></span
          ><span class="customer"
            ><span class="avatar">{{ initials(order.customerName) }}</span
            ><span
              ><strong>{{ order.customerName }}</strong
              ><small>{{ order.customerEmail }}</small></span
            ></span
          ><app-status-badge
            [label]="statusLabel(order.fulfillmentStatus)"
            [tone]="statusTone(order.fulfillmentStatus)" /><app-status-badge
            [label]="cancellationLabel(order.cancellationStatus)"
            [tone]="order.cancellationStatus === 'NONE' ? 'neutral' : 'warning'" /><strong
            class="money"
            >{{ order.activeTotal | money }}</strong
          ><lucide-icon name="chevron-right" [size]="16"
        /></a>
      </section>
      <div
        class="empty-center panel"
        *ngIf="state.status === 'success' && !state.data.items.length"
      >
        <app-page-state
          title="No hay órdenes con estos filtros"
          message="Ajustá la búsqueda o limpiá los filtros para ver más resultados."
          actionLabel="Limpiar filtros"
          (action)="clearFilters()"
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Cargando órdenes"
          message="Estamos consultando la operación más reciente."
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'error'">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Reintentar"
          (action)="reload()"
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
        margin-bottom: 22px;
      }
      .eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .filters {
        display: grid;
        align-items: center;
        gap: 9px;
        margin-bottom: 17px;
        padding: 11px;
        grid-template-columns: minmax(190px, 1fr) 180px 180px auto;
      }
      .filters label {
        display: flex;
        min-height: 40px;
        align-items: center;
        gap: 8px;
        padding: 0 11px;
        border: 1px solid var(--tizo-border);
        border-radius: 10px;
        color: var(--tizo-muted);
      }
      .filters input,
      .filters select,
      .filters label input {
        width: 100%;
        min-height: 40px;
        border: 1px solid var(--tizo-border);
        border-radius: 10px;
        background: #fff;
        outline: 0;
        font-size: 11px;
      }
      .filters label input {
        min-height: 0;
        border: 0;
      }
      .filters select {
        padding: 0 10px;
      }
      .table-header,
      .table-row {
        display: grid;
        align-items: center;
        gap: 14px;
        padding: 0 16px;
        grid-template-columns:
          95px minmax(180px, 1.3fr) minmax(110px, 0.8fr) minmax(110px, 0.8fr)
          110px 18px;
      }
      .table-header {
        min-height: 42px;
        border-bottom: 1px solid var(--tizo-border);
        color: var(--tizo-muted);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .table-row {
        min-height: 74px;
        border-bottom: 1px solid var(--tizo-border);
        color: inherit;
        text-decoration: none;
      }
      .table-row:last-child {
        border-bottom: 0;
      }
      .table-row:hover {
        background: var(--tizo-subtle);
      }
      .order-id,
      .customer > span:last-child {
        display: grid;
        gap: 3px;
      }
      .order-id strong,
      .customer strong,
      .money {
        font-size: 11.5px;
      }
      .order-id small,
      .customer small {
        overflow: hidden;
        color: var(--tizo-muted);
        font-size: 9px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .customer {
        display: grid;
        min-width: 0;
        align-items: center;
        gap: 9px;
        grid-template-columns: 35px minmax(0, 1fr);
      }
      .customer .avatar {
        width: 34px;
        height: 34px;
      }
      .money {
        text-align: right;
      }
      @media (max-width: 950px) {
        .filters {
          grid-template-columns: 1fr 1fr;
        }
        .filters label {
          grid-column: 1/-1;
        }
        .table-header {
          display: none;
        }
        .table-row {
          align-items: start;
          padding: 15px;
          grid-template-columns: 1fr auto;
        }
        .customer {
          grid-column: 1;
        }
        .order-id {
          grid-column: 2;
          grid-row: 1;
          text-align: right;
        }
        .table-row app-status-badge {
          grid-column: auto;
        }
        .money {
          grid-column: 2;
        }
        .table-row > lucide-icon {
          display: none;
        }
      }
      @media (max-width: 620px) {
        .page-header {
          align-items: stretch;
          flex-direction: column;
        }
        .filters {
          grid-template-columns: 1fr;
        }
        .filters label {
          grid-column: auto;
        }
        .orders-table {
          border: 0;
          background: transparent;
        }
        .table-row {
          margin-bottom: 10px;
          border: 1px solid var(--tizo-border);
          border-radius: 13px;
          background: #fff;
        }
        .table-row:last-child {
          border-bottom: 1px solid var(--tizo-border);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsOrdersPageComponent implements OnInit {
  readonly store = inject(OpsOrdersStore);
  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl('', { nonNullable: true }),
    cancellation: new FormControl('', { nonNullable: true }),
  });
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const values = {
        search: params.get('search') ?? '',
        status: params.get('status') ?? '',
        cancellation: params.get('cancellation') ?? '',
      };
      this.filters.setValue(values, { emitEvent: false });
      this.store.loadOrders(values);
    });
    this.filters.valueChanges
      .pipe(debounceTime(180), takeUntilDestroyed(this.destroyRef))
      .subscribe((values) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            search: values.search || null,
            status: values.status || null,
            cancellation: values.cancellation || null,
          },
          replaceUrl: true,
        });
      });
  }
  clearFilters(): void {
    this.filters.setValue({ search: '', status: '', cancellation: '' });
  }
  reload(): void {
    this.store.loadOrders(this.filters.getRawValue());
  }
  trackOrder(_: number, order: OpsOrder): string {
    return order.id;
  }
  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  cancellationLabel(status: OpsOrder['cancellationStatus']): string {
    return {
      NONE: 'Sin cancelación',
      REQUESTED: 'Solicitada',
      PARTIAL: 'Parcial',
      FULL: 'Completa',
    }[status];
  }
  statusLabel(status: OrderItemStatus): string {
    return {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      PREPARING: 'En preparación',
      AT_HUB: 'En hub',
      DISPATCHED: 'Despachada',
      DELIVERED: 'Entregada',
      CANCELLED: 'Cancelada',
    }[status];
  }
  statusTone(status: OrderItemStatus): StatusTone {
    return status === 'DELIVERED'
      ? 'success'
      : status === 'CANCELLED'
        ? 'danger'
        : status === 'DISPATCHED'
          ? 'info'
          : 'warning';
  }
}
