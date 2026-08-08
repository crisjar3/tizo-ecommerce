import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type { Operator } from '../../../core/api/api-contract';
import { OperatorSessionService } from '../../../core/session/operator-session.service';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { OperatorsStore } from '../state/operators.store';

@Component({
  selector: 'app-operator-selector-page',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, LucideAngularModule, PageStateComponent],
  providers: [OperatorsStore],
  template: `
    <section class="selector-wrap">
      <div class="selector panel">
        <div class="selector__mark" aria-hidden="true">T</div>
        <span class="eyebrow">Backoffice Tizo</span>
        <h1>¿Quién está operando?</h1>
        <p>Elegí tu perfil para atribuir solicitudes, decisiones y eventos de auditoría.</p>
        <ng-container *ngIf="store.operators$ | async as state">
          <div class="operator-grid" *ngIf="state.status === 'success'">
            <button
              type="button"
              *ngFor="let operator of state.data; trackBy: trackOperator"
              (click)="select(operator)"
            >
              <span class="avatar">{{ operator.initials }}</span>
              <span
                ><strong>{{ operator.name }}</strong
                ><small>{{ operator.team }}</small></span
              >
              <lucide-icon name="arrow-right" [size]="16" />
            </button>
          </div>
          <app-page-state
            *ngIf="state.status === 'loading'"
            title="Cargando el equipo"
            message="Estamos preparando los perfiles disponibles."
          />
          <app-page-state
            *ngIf="state.status === 'error'"
            [title]="state.error.title"
            [message]="state.error.message"
            actionLabel="Reintentar"
            (action)="store.load()"
          />
        </ng-container>
        <small class="privacy"
          ><lucide-icon name="shield-check" [size]="13" /> La selección se guarda solo en este
          navegador.</small
        >
      </div>
    </section>
  `,
  styles: [
    `
      .selector-wrap {
        display: grid;
        min-height: calc(100vh - 112px);
        place-items: center;
        padding: 28px 0;
      }
      .selector {
        width: min(620px, 100%);
        padding: clamp(28px, 5vw, 52px);
        text-align: center;
      }
      .selector__mark {
        display: grid;
        width: 48px;
        height: 48px;
        margin: 0 auto 20px;
        place-items: center;
        border: 1px solid var(--tizo-border-strong);
        border-radius: 13px;
        font-weight: 800;
      }
      .eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 9px 0;
        font-size: clamp(28px, 4vw, 38px);
        letter-spacing: -0.05em;
      }
      p {
        max-width: 50ch;
        margin: 0 auto 28px;
        color: var(--tizo-muted);
        font-size: 12px;
        line-height: 1.65;
      }
      .operator-grid {
        display: grid;
        overflow: hidden;
        border: 1px solid var(--tizo-border);
        border-radius: 14px;
      }
      .operator-grid button {
        display: grid;
        min-height: 69px;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid var(--tizo-border);
        background: #fff;
        cursor: pointer;
        grid-template-columns: 40px 1fr auto;
        text-align: left;
      }
      .operator-grid button:last-child {
        border-bottom: 0;
      }
      .operator-grid button:hover {
        background: var(--tizo-subtle);
      }
      .operator-grid button > span:nth-child(2) {
        display: grid;
        gap: 3px;
      }
      .operator-grid strong {
        font-size: 12px;
      }
      .operator-grid small {
        color: var(--tizo-muted);
        font-size: 9.5px;
      }
      .privacy {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 20px;
        color: var(--tizo-muted);
        font-size: 9.5px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorSelectorPageComponent implements OnInit {
  readonly store = inject(OperatorsStore);
  private readonly session = inject(OperatorSessionService);
  private readonly router = inject(Router);
  ngOnInit(): void {
    this.store.load();
  }
  select(operator: Operator): void {
    this.session.select({ id: operator.id, name: operator.name, initials: operator.initials });
    void this.router.navigate(['/orders']);
  }
  trackOperator(_: number, operator: Operator): string {
    return operator.id;
  }
}
