import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type { OpsOrderItem } from '../../../core/api/api-contract';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { hasCancellableItems } from '../domain/ops-order.rules';
import { OpsOrdersStore } from '../state/ops-orders.store';
import { opsOrderStatusLabel, opsOrderStatusTone } from '../ui/ops-order-status';

@Component({
  selector: 'app-ops-order-detail-page',
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
  providers: [OpsOrdersStore],
  template: `
    <a class="back-link" routerLink="/orders"
      ><lucide-icon name="arrow-left" [size]="16" /> Volver a órdenes</a
    >
    <ng-container *ngIf="store.selected$ | async as state">
      <article *ngIf="state.data !== null">
        <header class="detail-heading">
          <div>
            <span class="eyebrow">Orden #{{ state.data.id }}</span>
            <h1 class="page-heading">{{ state.data.customerName }}</h1>
            <p class="page-lead">
              {{ state.data.customerEmail }} · {{ state.data.createdAt | date: 'd MMM y, HH:mm' }}
            </p>
          </div>
          <div class="layout-actions">
            <app-status-badge
              [label]="statusLabel(state.data.fulfillmentStatus)"
              [tone]="statusTone(state.data.fulfillmentStatus)"
            /><a
              class="btn btn--primary"
              *ngIf="hasCancellable(state.data.items)"
              [routerLink]="['/orders', state.data.id, 'cancel']"
              ><lucide-icon name="circle-x" [size]="15" /> Crear solicitud</a
            >
          </div>
        </header>

        <section class="grouped-stats stats">
          <div>
            <span class="stat__label">Total pagado</span
            ><strong class="stat__value">{{ state.data.paidTotal | money }}</strong>
          </div>
          <div>
            <span class="stat__label">Cancelado</span
            ><strong class="stat__value">{{ state.data.cancelledTotal | money }}</strong>
          </div>
          <div>
            <span class="stat__label">Total vigente</span
            ><strong class="stat__value stat__value--accent">{{
              state.data.activeTotal | money
            }}</strong>
          </div>
          <div>
            <span class="stat__label">Versión</span
            ><strong class="stat__value">v{{ state.data.version }}</strong>
          </div>
        </section>

        <section class="content-card">
          <div class="content-card__header">
            <span>Líneas de la orden</span><span>{{ state.data.items.length }} productos</span>
          </div>
          <article class="order-line" *ngFor="let item of state.data.items; trackBy: trackItem">
            <span class="line-mark"><lucide-icon name="package" [size]="18" /></span>
            <div class="line-copy">
              <strong>{{ item.name }}</strong
              ><small>{{ item.store }} · {{ item.sku }} · {{ item.quantity }} unidad</small
              ><span>{{ item.operationalEffect }}</span>
            </div>
            <app-status-badge
              [label]="statusLabel(item.status)"
              [tone]="statusTone(item.status)"
            /><strong class="line-money">{{ item.lineTotal | money }}</strong>
          </article>
        </section>

        <section class="notice" *ngIf="!hasCancellable(state.data.items)">
          <lucide-icon name="triangle-alert" [size]="18" /><span
            ><strong>No hay líneas cancelables</strong>La orden ya fue despachada, entregada o
            cancelada. Para un paquete despachado corresponde iniciar una devolución.</span
          >
        </section>
      </article>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Cargando la orden"
          message="Estamos verificando el estado de cada línea."
        />
      </div>
      <div class="empty-center panel" *ngIf="state.status === 'error' && state.data === null">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Volver a órdenes"
          (action)="goOrders()"
        />
      </div>
    </ng-container>
  `,
  styles: [
    `
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 2px 0 20px;
        color: var(--tizo-muted);
        font-size: 11px;
        font-weight: 700;
        text-decoration: none;
      }
      .eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .detail-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 22px;
      }
      .stats {
        margin-bottom: 17px;
        background: #fff;
      }
      .order-line {
        display: grid;
        min-height: 86px;
        align-items: center;
        gap: 13px;
        padding: 14px 17px;
        border-bottom: 1px solid var(--tizo-border);
        grid-template-columns: 42px minmax(180px, 1fr) auto 105px;
      }
      .order-line:last-child {
        border-bottom: 0;
      }
      .line-mark {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border-radius: 11px;
        background: var(--tizo-neutral-bg);
        color: var(--tizo-muted);
      }
      .line-copy {
        display: grid;
        gap: 3px;
      }
      .line-copy strong {
        font-size: 12px;
      }
      .line-copy small {
        color: var(--tizo-muted);
        font-size: 9.5px;
      }
      .line-copy span {
        margin-top: 5px;
        color: var(--tizo-text-soft);
        font-size: 9.5px;
      }
      .line-money {
        text-align: right;
        font-size: 11.5px;
      }
      .notice {
        margin-top: 17px;
      }
      @media (max-width: 680px) {
        .detail-heading {
          align-items: stretch;
          flex-direction: column;
        }
        .layout-actions {
          justify-content: stretch;
        }
        .order-line {
          align-items: start;
          grid-template-columns: 40px 1fr auto;
        }
        .line-money {
          grid-column: 2;
        }
        .order-line app-status-badge {
          grid-column: 3;
          grid-row: 1 / span 2;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsOrderDetailPageComponent implements OnInit {
  readonly store = inject(OpsOrdersStore);
  readonly statusLabel = opsOrderStatusLabel;
  readonly statusTone = opsOrderStatusTone;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  ngOnInit(): void {
    this.store.loadOrder(this.route.snapshot.paramMap.get('orderId') ?? '');
  }
  goOrders(): void {
    void this.router.navigate(['/orders']);
  }
  hasCancellable(items: readonly OpsOrderItem[]): boolean {
    return hasCancellableItems(items);
  }
  trackItem(_: number, item: OpsOrderItem): string {
    return item.id;
  }
}
