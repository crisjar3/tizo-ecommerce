import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import type { Product } from '../../../core/api/api-contract';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { CatalogStore } from '../state/catalog.store';

@Component({
  selector: 'app-marketplace-page',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    MoneyPipe,
    PageStateComponent,
  ],
  providers: [CatalogStore],
  templateUrl: './marketplace-page.component.html',
  styleUrls: ['./marketplace-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplacePageComponent implements OnInit {
  readonly store = inject(CatalogStore);
  readonly search = new FormControl('', { nonNullable: true });
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.search.setValue(this.route.snapshot.queryParamMap.get('q') ?? '', { emitEvent: false });
    this.search.valueChanges
      .pipe(debounceTime(220), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: query || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    this.store.loadProducts();
  }

  filtered(products: readonly Product[]): readonly Product[] {
    const query = this.search.value.trim().toLocaleLowerCase('es');
    return query
      ? products.filter((product) =>
          `${product.name} ${product.store} ${product.category}`
            .toLocaleLowerCase('es')
            .includes(query),
        )
      : products;
  }

  trackProduct(_: number, product: Product): string {
    return product.id;
  }
}
