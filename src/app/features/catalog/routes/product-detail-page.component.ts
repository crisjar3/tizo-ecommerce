import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { CartStore } from '../../cart/state/cart.store';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { CatalogStore } from '../state/catalog.store';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink, LucideAngularModule, MoneyPipe, PageStateComponent],
  providers: [CatalogStore],
  template: `
    <a class="back-link" routerLink="/shop"
      ><lucide-icon name="arrow-left" [size]="16" /> Volver a la tienda</a
    >

    <ng-container *ngIf="store.selectedProduct$ | async as state">
      <article class="product-detail" *ngIf="state.status === 'success'">
        <div class="product-visual">
          <img [src]="state.data.imageUrl" [alt]="state.data.imageAlt" />
          <span>{{ state.data.category }}</span>
        </div>
        <div class="product-info">
          <span class="product-store">{{ state.data.store }} · {{ state.data.sku }}</span>
          <h1>{{ state.data.name }}</h1>
          <p>{{ state.data.description }}</p>
          <strong class="price">{{ state.data.price | money }}</strong>
          <div class="stock"><span></span>{{ state.data.stock }} unidades disponibles</div>
          <button class="btn btn--primary add-button" type="button" (click)="add(state.data.id)">
            <lucide-icon name="shopping-cart" [size]="17" /> Agregar al carrito
          </button>
          <div class="benefits">
            <span
              ><lucide-icon name="truck" [size]="18" /><strong>Envío coordinado</strong
              ><small>Seguimiento desde Mis pedidos</small></span
            >
            <span
              ><lucide-icon name="shield-check" [size]="18" /><strong>Compra protegida</strong
              ><small>Cancelación antes del despacho</small></span
            >
          </div>
        </div>
      </article>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Cargando producto"
          message="Un momento, estamos preparando el detalle."
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'error'">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Volver a la tienda"
          (action)="goBack()"
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
        margin: 4px 0 24px;
        color: var(--tizo-muted);
        font-size: 12px;
        font-weight: 700;
        text-decoration: none;
      }
      .product-detail {
        display: grid;
        overflow: hidden;
        border: 1px solid var(--tizo-border);
        border-radius: 22px;
        background: #fff;
        box-shadow: var(--tizo-shadow);
        grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
      }
      .product-visual {
        position: relative;
        min-height: 620px;
        overflow: hidden;
        background: #eeede9;
      }
      .product-visual img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .product-visual > span {
        position: absolute;
        top: 20px;
        left: 20px;
        padding: 7px 11px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.88);
        font-size: 10px;
        font-weight: 800;
      }
      .product-info {
        display: flex;
        padding: clamp(34px, 6vw, 76px);
        flex-direction: column;
        justify-content: center;
      }
      .product-store {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        margin: 13px 0 17px;
        font-size: clamp(34px, 4.2vw, 56px);
        letter-spacing: -0.055em;
        line-height: 1.02;
      }
      p {
        max-width: 52ch;
        margin: 0;
        color: var(--tizo-muted);
        font-size: 14px;
        line-height: 1.75;
      }
      .price {
        display: block;
        margin-top: 26px;
        font-size: 27px;
        letter-spacing: -0.03em;
      }
      .stock {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 14px 0 28px;
        color: var(--tizo-muted);
        font-size: 11px;
      }
      .stock span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--tizo-success);
      }
      .add-button {
        min-height: 50px;
        font-size: 13px;
      }
      .benefits {
        display: grid;
        gap: 13px;
        margin-top: 30px;
        padding-top: 24px;
        border-top: 1px solid var(--tizo-border);
        grid-template-columns: 1fr 1fr;
      }
      .benefits > span {
        display: grid;
        align-items: start;
        column-gap: 9px;
        grid-template-columns: auto 1fr;
      }
      .benefits lucide-icon {
        color: var(--tizo-accent);
        grid-row: 1 / span 2;
      }
      .benefits strong {
        font-size: 11px;
      }
      .benefits small {
        margin-top: 3px;
        color: var(--tizo-muted);
        font-size: 9.5px;
      }
      @media (max-width: 800px) {
        .product-detail {
          grid-template-columns: 1fr;
        }
        .product-visual {
          min-height: 420px;
        }
        .product-info {
          padding: 34px 24px;
        }
      }
      @media (max-width: 480px) {
        .product-visual {
          min-height: 330px;
        }
        .benefits {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent implements OnInit {
  readonly store = inject(CatalogStore);
  private readonly cartStore = inject(CartStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.loadProduct(this.route.snapshot.paramMap.get('productId') ?? '');
  }

  add(productId: string): void {
    this.cartStore.setQuantity({ productId, quantity: 1 });
    void this.router.navigate(['/cart']);
  }

  goBack(): void {
    void this.router.navigate(['/shop']);
  }
}
