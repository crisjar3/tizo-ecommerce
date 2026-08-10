import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type { CustomerOrder } from '../../../core/api/api-contract';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { CustomerOrdersStore } from '../state/customer-orders.store';
import { customerOrderStatusLabel, customerOrderStatusTone } from '../ui/customer-order-status';

@Component({
  selector: 'app-customer-orders-page',
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
    <header class="orders-heading">
      <div>
        <span class="eyebrow">Tu cuenta</span>
        <h1 class="page-heading">Mis pedidos</h1>
        <p class="page-lead">Consultá el avance de tus compras y gestioná sus productos.</p>
      </div>
      <a class="btn btn--secondary" routerLink="/shop"
        ><lucide-icon name="shopping-bag" [size]="15" /> Ir a la tienda</a
      >
    </header>

    <ng-container *ngIf="store.orders$ | async as state">
      <section class="orders-list" *ngIf="state.data !== null && state.data.length">
        <a
          class="order-card"
          *ngFor="let order of state.data; trackBy: trackOrder"
          [routerLink]="['/my/orders', order.id]"
        >
          <div class="order-card__top">
            <span
              >Pedido <strong>#{{ order.id }}</strong></span
            ><app-status-badge
              [label]="statusLabel(order.status)"
              [tone]="statusTone(order.status)"
            />
          </div>
          <div class="order-card__body">
            <span class="order-icon"><lucide-icon name="package" [size]="21" /></span>
            <div>
              <strong
                >{{ order.itemCount }}
                {{ order.itemCount === 1 ? 'producto' : 'productos' }}</strong
              ><small>Comprado el {{ order.createdAt | date: 'd MMM y, HH:mm' }}</small>
            </div>
            <strong class="order-total">{{ order.activeTotal | money }}</strong
            ><lucide-icon name="chevron-right" [size]="17" />
          </div>
        </a>
      </section>
      <div class="empty-center panel" *ngIf="state.data !== null && !state.data.length">
        <app-page-state
          title="Todavía no tenés pedidos"
          message="Cuando completes una compra, vas a poder seguirla desde acá."
          actionLabel="Explorar la tienda"
          (action)="goShop()"
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Buscando tus pedidos"
          message="Estamos recuperando tu historial de compras."
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'error' && state.data === null">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Reintentar"
          (action)="store.loadOrders()"
        />
      </div>
    </ng-container>
  `,
  styles: [
    `
      .orders-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 28px;
      }
      .eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .orders-list {
        display: grid;
        gap: 13px;
      }
      .order-card {
        overflow: hidden;
        border: 1px solid var(--tizo-border);
        border-radius: 15px;
        background: #fff;
        color: inherit;
        text-decoration: none;
        transition:
          border-color 160ms ease,
          transform 160ms ease;
      }
      .order-card:hover {
        border-color: var(--tizo-border-strong);
        transform: translateY(-1px);
      }
      .order-card__top {
        display: flex;
        min-height: 45px;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        border-bottom: 1px solid var(--tizo-border);
        color: var(--tizo-muted);
        font-size: 10.5px;
      }
      .order-card__top strong {
        color: var(--tizo-text);
      }
      .order-card__body {
        display: grid;
        min-height: 82px;
        align-items: center;
        gap: 13px;
        padding: 14px 17px;
        grid-template-columns: 42px 1fr auto auto;
      }
      .order-icon {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border-radius: 12px;
        background: var(--tizo-accent-soft);
        color: var(--tizo-accent);
      }
      .order-card__body > div {
        display: grid;
        gap: 4px;
      }
      .order-card__body > div > strong {
        font-size: 12.5px;
      }
      .order-card__body small {
        color: var(--tizo-muted);
        font-size: 10px;
      }
      .order-total {
        font-size: 13px;
      }
      @media (max-width: 640px) {
        .orders-heading {
          align-items: stretch;
          flex-direction: column;
        }
        .order-card__body {
          grid-template-columns: 42px 1fr auto;
        }
        .order-total {
          grid-column: 2;
        }
        .order-card__body > lucide-icon {
          grid-column: 3;
          grid-row: 1 / span 2;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerOrdersPageComponent implements OnInit {
  readonly store = inject(CustomerOrdersStore);
  readonly statusLabel = customerOrderStatusLabel;
  readonly statusTone = customerOrderStatusTone;
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.loadOrders();
  }
  goShop(): void {
    void this.router.navigate(['/shop']);
  }
  trackOrder(_: number, order: CustomerOrder): string {
    return order.id;
  }
}
