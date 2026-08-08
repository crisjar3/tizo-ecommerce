import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '404',
    loadComponent: () =>
      import('./shared/ui/not-found/not-found-page.component').then(
        (component) => component.NotFoundPageComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: '404' },
  { path: '**', redirectTo: '404' },
];
