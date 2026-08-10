import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type { CustomerOrderItem, CustomerOrderProgress } from '../../../core/api/api-contract';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { CustomerOrdersStore } from '../state/customer-orders.store';

@Component({
  selector: 'app-customer-order-detail-page',
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
  providers: [CustomerOrdersStore],
  template: `
    <a class="back-link" routerLink="/my/orders"
      ><lucide-icon name="arrow-left" [size]="16" /> Mis pedidos</a
    >
    <ng-container *ngIf="store.selected$ | async as state">
      <article *ngIf="state.data !== null">
        <section class="success-notice" *ngIf="created">
          <lucide-icon name="circle-check" [size]="20" /><span
            ><strong>¡Compra confirmada!</strong>Tu pedido #{{ state.data.id }} ya está en
            marcha.</span
          >
        </section>
        <header class="detail-heading">
          <div>
            <span class="eyebrow">Pedido #{{ state.data.id }}</span>
            <h1 class="page-heading">Detalle de tu compra</h1>
            <p class="page-lead">
              Realizado el {{ state.data.createdAt | date: 'd MMMM y, HH:mm' }}
            </p>
          </div>
          <app-status-badge
            [label]="statusLabel(state.data.progress)"
            [tone]="state.data.progress === 'CANCELLED' ? 'danger' : 'info'"
          />
        </header>

        <div class="progress-card panel">
          <span class="progress-icon"
            ><lucide-icon
              [name]="state.data.progress === 'CANCELLED' ? 'circle-x' : 'package-check'"
              [size]="22"
          /></span>
          <div>
            <strong>{{ progressTitle(state.data.progress) }}</strong>
            <p>{{ progressCopy(state.data.progress) }}</p>
          </div>
        </div>

        <section class="content-card">
          <div class="content-card__header">
            <span>Productos</span><span>{{ state.data.items.length }} en total</span>
          </div>
          <div class="product-line" *ngFor="let item of state.data.items; trackBy: trackItem">
            <span class="line-icon"><lucide-icon name="package" [size]="18" /></span>
            <div>
              <strong [class.cancelled]="item.cancelled">{{ item.name }}</strong
              ><small
                >{{ item.quantity }} unidad ·
                {{
                  item.refundStatus === 'COMPLETED' || item.refundStatus === 'SUCCEEDED'
                    ? 'Reembolso simulado completado'
                    : 'Compra activa'
                }}</small
              >
            </div>
            <app-status-badge *ngIf="item.cancelled" label="Cancelado" tone="danger" /><strong>{{
              item.lineTotal | money
            }}</strong>
          </div>
        </section>

        <div class="detail-bottom">
          <section class="grouped-stats">
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
          </section>
          <a
            *ngIf="canRequestCancellation(state.data.progress)"
            class="btn btn--secondary"
            [routerLink]="['/my/orders', state.data.id, 'cancel']"
            ><lucide-icon name="circle-x" [size]="15" /> Solicitar cancelación</a
          >
        </div>
      </article>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Cargando tu pedido"
          message="Estamos recuperando la información más reciente."
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'error' && state.data === null">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Volver a mis pedidos"
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
        margin: 4px 0 22px;
        color: var(--tizo-muted);
        font-size: 12px;
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
      .success-notice {
        display: flex;
        align-items: center;
        gap: 11px;
        margin-bottom: 18px;
        padding: 14px 17px;
        border: 1px solid #cfe9d9;
        border-radius: 13px;
        background: var(--tizo-success-bg);
        color: var(--tizo-success);
        font-size: 11.5px;
      }
      .success-notice span {
        display: grid;
        gap: 2px;
      }
      .detail-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 24px;
      }
      .progress-card {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 18px;
        padding: 18px;
      }
      .progress-icon,
      .line-icon {
        display: grid;
        width: 42px;
        height: 42px;
        flex: 0 0 auto;
        place-items: center;
        border-radius: 12px;
        background: var(--tizo-accent-soft);
        color: var(--tizo-accent);
      }
      .progress-card div {
        display: grid;
        gap: 3px;
      }
      .progress-card strong {
        font-size: 13px;
      }
      .progress-card p {
        margin: 0;
        color: var(--tizo-muted);
        font-size: 10.5px;
      }
      .product-line {
        display: grid;
        min-height: 75px;
        align-items: center;
        gap: 13px;
        padding: 13px 17px;
        border-bottom: 1px solid var(--tizo-border);
        grid-template-columns: 42px 1fr auto auto;
      }
      .product-line:last-child {
        border-bottom: 0;
      }
      .product-line > div {
        display: grid;
        gap: 4px;
      }
      .product-line strong {
        font-size: 12px;
      }
      .product-line small {
        color: var(--tizo-muted);
        font-size: 9.5px;
      }
      .cancelled {
        color: var(--tizo-muted);
        text-decoration: line-through;
      }
      .detail-bottom {
        display: grid;
        align-items: center;
        gap: 18px;
        margin-top: 18px;
        grid-template-columns: 1fr auto;
      }
      @media (max-width: 700px) {
        .detail-heading {
          align-items: start;
          flex-direction: column;
        }
        .product-line {
          grid-template-columns: 42px 1fr auto;
        }
        .product-line > app-status-badge {
          grid-column: 2;
        }
        .product-line > strong {
          grid-column: 3;
          grid-row: 1 / span 2;
        }
        .detail-bottom {
          grid-template-columns: 1fr;
        }
        .detail-bottom .btn {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerOrderDetailPageComponent implements OnInit {
  readonly store = inject(CustomerOrdersStore);
  readonly created = inject(ActivatedRoute).snapshot.queryParamMap.get('created') === '1';
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  ngOnInit(): void {
    this.store.loadOrder(this.route.snapshot.paramMap.get('orderId') ?? '');
  }
  goOrders(): void {
    void this.router.navigate(['/my/orders']);
  }
  trackItem(_: number, item: CustomerOrderItem): string {
    return item.id;
  }
  canRequestCancellation(status: CustomerOrderProgress): boolean {
    return status === 'CONFIRMED' || status === 'PREPARING';
  }
  statusLabel(status: CustomerOrderProgress): string {
    return {
      CONFIRMED: 'Confirmado',
      PREPARING: 'En preparación',
      IN_TRANSIT: 'En camino',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    }[status];
  }
  progressTitle(status: CustomerOrderProgress): string {
    return status === 'CANCELLED'
      ? 'Este pedido fue cancelado'
      : status === 'IN_TRANSIT'
        ? 'Tu pedido está en camino'
        : status === 'DELIVERED'
          ? 'Tu pedido fue entregado'
          : 'Estamos preparando tu pedido';
  }
  progressCopy(status: CustomerOrderProgress): string {
    return status === 'CANCELLED'
      ? 'Las líneas canceladas y sus reembolsos aparecen debajo.'
      : 'El avance se calcula con el producto activo más atrasado, para no prometer de más.';
  }
}
