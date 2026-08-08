import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'shop' },
  {
    path: '',
    loadComponent: () =>
      import('./shared/ui/shells/customer-shell.component').then(
        (component) => component.CustomerShellComponent,
      ),
    children: [
      {
        path: 'shop',
        loadComponent: () =>
          import('./features/catalog/routes/marketplace-page.component').then(
            (component) => component.MarketplacePageComponent,
          ),
      },
      {
        path: 'shop/products/:productId',
        loadComponent: () =>
          import('./features/catalog/routes/product-detail-page.component').then(
            (component) => component.ProductDetailPageComponent,
          ),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./features/cart/routes/cart-page.component').then(
            (component) => component.CartPageComponent,
          ),
      },
      {
        path: 'my/orders',
        loadComponent: () =>
          import('./features/customer-orders/routes/customer-orders-page.component').then(
            (component) => component.CustomerOrdersPageComponent,
          ),
      },
      {
        path: 'my/orders/:orderId',
        loadComponent: () =>
          import('./features/customer-orders/routes/customer-order-detail-page.component').then(
            (component) => component.CustomerOrderDetailPageComponent,
          ),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/ui/shells/ops-shell.component').then(
        (component) => component.OpsShellComponent,
      ),
    children: [
      {
        path: 'operator',
        loadComponent: () =>
          import('./features/operators/routes/operator-selector-page.component').then(
            (component) => component.OperatorSelectorPageComponent,
          ),
      },
      {
        path: 'operators',
        loadComponent: () =>
          import('./features/operators/routes/operators-page.component').then(
            (component) => component.OperatorsPageComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/ops-orders/routes/ops-orders-page.component').then(
            (component) => component.OpsOrdersPageComponent,
          ),
      },
      {
        path: 'orders/:orderId',
        loadComponent: () =>
          import('./features/ops-orders/routes/ops-order-detail-page.component').then(
            (component) => component.OpsOrderDetailPageComponent,
          ),
      },
    ],
  },
  {
    path: '404',
    loadComponent: () =>
      import('./shared/ui/not-found/not-found-page.component').then(
        (component) => component.NotFoundPageComponent,
      ),
  },
  { path: '**', redirectTo: '404' },
];
