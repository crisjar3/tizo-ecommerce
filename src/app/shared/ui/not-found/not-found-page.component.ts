import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <main class="not-found">
      <div class="not-found__mark" aria-hidden="true"><lucide-icon name="package-search" /></div>
      <p class="not-found__code">404</p>
      <h1>No encontramos esa pantalla</h1>
      <p>El enlace puede haber cambiado o el recurso ya no está disponible.</p>
      <a class="btn btn--primary" routerLink="/shop">
        <lucide-icon name="arrow-left" [size]="16" /> Volver a la tienda
      </a>
    </main>
  `,
  styles: [
    `
      .not-found {
        display: grid;
        min-height: 100vh;
        place-content: center;
        justify-items: center;
        padding: 24px;
        text-align: center;
      }
      .not-found__mark {
        display: grid;
        width: 64px;
        height: 64px;
        place-items: center;
        border: 1px solid var(--tizo-border);
        border-radius: 17px;
        background: #fff;
        color: var(--tizo-accent);
        box-shadow: var(--tizo-shadow);
      }
      .not-found__code {
        margin: 20px 0 4px;
        color: var(--tizo-accent);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }
      h1 {
        margin: 0;
        font-size: clamp(27px, 5vw, 42px);
        letter-spacing: -0.045em;
      }
      p:not(.not-found__code) {
        max-width: 44ch;
        margin: 12px 0 24px;
        color: var(--tizo-muted);
        line-height: 1.6;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
