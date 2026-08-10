import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type { Operator } from '../../../core/api/api-contract';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { OperatorsStore } from '../state/operators.store';

@Component({
  selector: 'app-operators-page',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    RouterLink,
    LucideAngularModule,
    PageStateComponent,
    StatusBadgeComponent,
  ],
  providers: [OperatorsStore],
  template: `
    <header class="page-header">
      <div>
        <span class="eyebrow">Equipo</span>
        <h1 class="page-heading">Operadores</h1>
        <p class="page-lead">
          Actividad y atribución del equipo que gestiona pedidos y cancelaciones.
        </p>
      </div>
      <a class="btn btn--secondary" routerLink="/operator"
        ><lucide-icon name="user-round-cog" [size]="15" /> Cambiar mi operador</a
      >
    </header>
    <ng-container *ngIf="store.operators$ | async as state">
      <section class="team-grid" *ngIf="state.data !== null && state.data.length">
        <article class="member panel" *ngFor="let operator of state.data; trackBy: trackOperator">
          <div class="member__top">
            <span class="avatar">{{ operator.initials }}</span
            ><app-status-badge
              [label]="operator.online ? 'En línea' : 'Fuera de línea'"
              [tone]="operator.online ? 'success' : 'neutral'"
            />
          </div>
          <h2>{{ operator.name }}</h2>
          <p>{{ operator.team }}</p>
          <div>
            <span>Resueltas hoy</span><strong>{{ operator.resolvedCount }}</strong>
          </div>
        </article>
      </section>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Cargando el equipo"
          message="Estamos recuperando la actividad de operadores."
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'error' && state.data === null">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Reintentar"
          (action)="store.load()"
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
        margin-bottom: 25px;
      }
      .eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .team-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      }
      .member {
        padding: 20px;
      }
      .member__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .member h2 {
        margin: 18px 0 4px;
        font-size: 15px;
      }
      .member p {
        margin: 0 0 20px;
        color: var(--tizo-muted);
        font-size: 10.5px;
      }
      .member > div:last-child {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding-top: 15px;
        border-top: 1px solid var(--tizo-border);
        color: var(--tizo-muted);
        font-size: 10px;
      }
      .member > div:last-child strong {
        color: var(--tizo-text);
        font-size: 22px;
      }
      @media (max-width: 620px) {
        .page-header {
          align-items: stretch;
          flex-direction: column;
        }
        .page-header .btn {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorsPageComponent implements OnInit {
  readonly store = inject(OperatorsStore);
  ngOnInit(): void {
    this.store.load();
  }
  trackOperator(_: number, operator: Operator): string {
    return operator.id;
  }
}
