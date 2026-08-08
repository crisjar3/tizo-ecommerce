import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type { CartItem } from '../../../core/api/api-contract';
import { NetworkStatusService } from '../../../core/network/network-status.service';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { CartStore } from '../state/cart.store';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, LucideAngularModule, MoneyPipe, PageStateComponent],
  template: `
    <header class="cart-heading">
      <div>
        <span class="eyebrow">Tu selección</span>
        <h1 class="page-heading">Carrito</h1>
        <p class="page-lead">Revisá los productos antes de confirmar la compra.</p>
      </div>
      <a class="btn btn--secondary" routerLink="/shop"
        ><lucide-icon name="arrow-left" [size]="15" /> Seguir comprando</a
      >
    </header>

    <ng-container *ngIf="store.cart$ | async as state">
      <div class="cart-layout" *ngIf="state.status === 'success' && state.data.items.length">
        <section class="cart-items" aria-label="Productos en el carrito">
          <article class="cart-item" *ngFor="let item of state.data.items; trackBy: trackItem">
            <img [src]="item.product.imageUrl" [alt]="item.product.imageAlt" />
            <div class="cart-item__copy">
              <small>{{ item.product.store }}</small>
              <strong>{{ item.product.name }}</strong>
              <span>{{ item.product.price | money }} por unidad</span>
            </div>
            <div class="quantity" aria-label="Cantidad">
              <button
                type="button"
                [disabled]="
                  item.quantity <= 1 || isSubmitting || (network.online$ | async) === false
                "
                (click)="change(item, -1)"
                [attr.aria-label]="'Quitar una unidad de ' + item.product.name"
              >
                −
              </button>
              <span>{{ item.quantity }}</span>
              <button
                type="button"
                [disabled]="
                  item.quantity >= item.product.stock ||
                  isSubmitting ||
                  (network.online$ | async) === false
                "
                (click)="change(item, 1)"
                [attr.aria-label]="'Agregar una unidad de ' + item.product.name"
              >
                +
              </button>
            </div>
            <strong class="line-total">{{ item.lineTotal | money }}</strong>
            <button
              class="remove"
              type="button"
              (click)="store.removeItem(item.product.id)"
              [disabled]="isSubmitting || (network.online$ | async) === false"
              [attr.aria-label]="'Eliminar ' + item.product.name"
            >
              <lucide-icon name="trash-2" [size]="16" />
            </button>
          </article>
        </section>

        <aside class="summary panel">
          <span class="summary__eyebrow">Resumen de compra</span>
          <h2>
            {{ state.data.itemCount }} {{ state.data.itemCount === 1 ? 'producto' : 'productos' }}
          </h2>
          <div class="summary-row">
            <span>Productos</span><strong>{{ state.data.total | money }}</strong>
          </div>
          <div class="summary-row"><span>Envío</span><strong>Sin cargo</strong></div>
          <div class="summary-total">
            <span>Total</span><strong>{{ state.data.total | money }}</strong>
          </div>
          <button
            class="btn btn--primary checkout"
            type="button"
            [disabled]="isSubmitting || (network.online$ | async) === false"
            (click)="store.checkout()"
          >
            <lucide-icon name="lock-keyhole" [size]="15" />
            {{ isSubmitting ? 'Confirmando…' : 'Confirmar compra' }}
          </button>
          <p>
            <lucide-icon name="shield-check" [size]="14" /> Esta es una compra simulada. No se
            realizará ningún cobro real.
          </p>
        </aside>
      </div>

      <div
        class="empty-center panel"
        *ngIf="state.status === 'success' && !state.data.items.length"
      >
        <app-page-state
          title="Tu carrito está vacío"
          message="Explorá la tienda y agregá productos para comenzar."
          actionLabel="Ir a la tienda"
          (action)="goShop()"
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state title="Cargando el carrito" message="Estamos recuperando tu selección." />
      </div>
      <div class="empty-center" *ngIf="state.status === 'error'">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Reintentar"
          (action)="store.load()"
        />
      </div>
    </ng-container>

    <ng-container *ngIf="store.command$ | async as command">
      <section
        class="command-message command-message--error"
        role="alert"
        *ngIf="command.status === 'error'"
      >
        <lucide-icon name="circle-alert" [size]="18" /><span
          ><strong>{{ command.error.title }}</strong
          >{{ command.error.message }}</span
        >
      </section>
      <section
        class="command-message command-message--uncertain"
        role="alert"
        *ngIf="command.status === 'uncertain'"
      >
        <lucide-icon name="clock-3" [size]="18" /><span
          ><strong>No sabemos si la compra se completó</strong>Revisá Mis pedidos antes de volver a
          confirmar.</span
        >
        <a class="btn btn--secondary" routerLink="/my/orders">Ver mis pedidos</a>
      </section>
    </ng-container>
  `,
  styles: [
    `
      .cart-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 28px;
      }
      .eyebrow,
      .summary__eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .cart-layout {
        display: grid;
        align-items: start;
        gap: 26px;
        grid-template-columns: minmax(0, 1fr) 350px;
      }
      .cart-items {
        overflow: hidden;
        border: 1px solid var(--tizo-border);
        border-radius: 17px;
        background: #fff;
      }
      .cart-item {
        display: grid;
        min-height: 132px;
        align-items: center;
        gap: 18px;
        padding: 17px;
        border-bottom: 1px solid var(--tizo-border);
        grid-template-columns: 94px minmax(150px, 1fr) auto auto 38px;
      }
      .cart-item:last-child {
        border-bottom: 0;
      }
      .cart-item img {
        width: 94px;
        height: 98px;
        border-radius: 11px;
        object-fit: cover;
      }
      .cart-item__copy {
        display: grid;
        gap: 5px;
      }
      .cart-item__copy small {
        color: var(--tizo-muted);
        font-size: 9.5px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .cart-item__copy strong {
        font-size: 13px;
      }
      .cart-item__copy span {
        color: var(--tizo-muted);
        font-size: 10.5px;
      }
      .quantity {
        display: flex;
        overflow: hidden;
        align-items: center;
        border: 1px solid var(--tizo-border);
        border-radius: 10px;
      }
      .quantity button {
        width: 32px;
        height: 34px;
        background: #fff;
        cursor: pointer;
      }
      .quantity span {
        min-width: 28px;
        font-size: 11px;
        font-weight: 800;
        text-align: center;
      }
      .line-total {
        min-width: 90px;
        font-size: 12.5px;
        text-align: right;
      }
      .remove {
        display: grid;
        width: 34px;
        height: 34px;
        place-items: center;
        border-radius: 9px;
        background: transparent;
        color: var(--tizo-muted);
        cursor: pointer;
      }
      .summary {
        position: sticky;
        top: 92px;
        padding: 26px;
      }
      .summary h2 {
        margin: 8px 0 28px;
        font-size: 21px;
        letter-spacing: -0.03em;
      }
      .summary-row,
      .summary-total {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: 11.5px;
      }
      .summary-row {
        margin: 13px 0;
        color: var(--tizo-muted);
      }
      .summary-total {
        margin-top: 22px;
        padding-top: 20px;
        border-top: 1px solid var(--tizo-border);
        align-items: flex-end;
      }
      .summary-total span {
        font-weight: 800;
      }
      .summary-total strong {
        color: var(--tizo-accent);
        font-size: 22px;
        letter-spacing: -0.03em;
      }
      .checkout {
        width: 100%;
        min-height: 48px;
        margin-top: 24px;
      }
      .summary p {
        display: flex;
        align-items: flex-start;
        gap: 7px;
        margin: 15px 0 0;
        color: var(--tizo-muted);
        font-size: 9.5px;
        line-height: 1.5;
      }
      .command-message {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 18px;
        padding: 14px 16px;
        border-radius: 12px;
        font-size: 11px;
      }
      .command-message span {
        display: grid;
        flex: 1;
        gap: 2px;
      }
      .command-message--error {
        background: var(--tizo-danger-bg);
        color: var(--tizo-danger);
      }
      .command-message--uncertain {
        border: 1px solid #f1d8a9;
        background: var(--tizo-warning-bg);
        color: #795f35;
      }
      @media (max-width: 900px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }
        .summary {
          position: static;
        }
      }
      @media (max-width: 680px) {
        .cart-heading {
          align-items: stretch;
          flex-direction: column;
        }
        .cart-item {
          align-items: start;
          grid-template-columns: 76px 1fr auto;
        }
        .cart-item img {
          width: 76px;
          height: 82px;
          grid-row: 1 / span 2;
        }
        .quantity {
          grid-column: 2;
        }
        .line-total {
          grid-column: 3;
          grid-row: 2;
        }
        .remove {
          grid-column: 3;
          grid-row: 1;
        }
        .command-message {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent implements OnInit {
  readonly store = inject(CartStore);
  readonly network = inject(NetworkStatusService);
  isSubmitting = false;
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.load();
    this.store.command$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((command) => {
      this.isSubmitting = command.status === 'submitting';
      if (command.status === 'success' && 'progress' in command.data) {
        void this.router.navigate(['/my/orders', command.data.id], { queryParams: { created: 1 } });
      }
    });
  }

  change(item: CartItem, delta: number): void {
    this.store.setQuantity({ productId: item.product.id, quantity: item.quantity + delta });
  }

  goShop(): void {
    void this.router.navigate(['/shop']);
  }

  trackItem(_: number, item: CartItem): string {
    return item.product.id;
  }
}
