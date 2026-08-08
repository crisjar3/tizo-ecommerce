import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type { AuditEvent } from '../../../core/api/api-contract';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { CancellationsStore } from '../state/cancellations.store';

@Component({
  selector: 'app-cancellation-history-page',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgFor,
    NgIf,
    RouterLink,
    LucideAngularModule,
    PageStateComponent,
    StatusBadgeComponent,
  ],
  providers: [CancellationsStore],
  template: `
    <header class="page-header">
      <div>
        <span class="eyebrow">Auditoría</span>
        <h1 class="page-heading">Historial de cancelaciones</h1>
        <p class="page-lead">
          Registro atribuible de solicitudes, aprobaciones, rechazos y efectos operacionales.
        </p>
      </div>
      <a class="btn btn--secondary" routerLink="/cancellations"
        ><lucide-icon name="inbox" [size]="15" /> Volver a solicitudes</a
      >
    </header>
    <ng-container *ngIf="store.history$ | async as state">
      <section
        class="timeline content-card"
        *ngIf="state.status === 'success' && state.data.length"
      >
        <article class="event" *ngFor="let event of state.data; trackBy: trackEvent">
          <span class="event-icon" [class.event-icon--rejected]="event.action.includes('REJECTED')"
            ><lucide-icon
              [name]="event.action.includes('REJECTED') ? 'circle-x' : 'circle-check'"
              [size]="18"
          /></span>
          <div>
            <span class="event-meta"
              >{{ event.occurredAt | date: 'd MMM y, HH:mm' }} · {{ event.entityId }}</span
            >
            <h2>{{ event.summary }}</h2>
            <p>Orden #{{ event.orderId }} · {{ event.actorName }}</p>
            <small>Correlation ID: {{ event.correlationId }}</small>
          </div>
          <app-status-badge
            [label]="actionLabel(event.action)"
            [tone]="
              event.action.includes('REJECTED')
                ? 'danger'
                : event.action.includes('COMPLETED')
                  ? 'success'
                  : 'warning'
            "
          />
        </article>
      </section>
      <div class="empty-center panel" *ngIf="state.status === 'success' && !state.data.length">
        <app-page-state
          title="Todavía no hay actividad"
          message="Las decisiones sobre cancelaciones aparecerán acá con su atribución."
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Cargando historial"
          message="Estamos recuperando la trazabilidad operacional."
        />
      </div>
      <div class="empty-center" *ngIf="state.status === 'error'">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Reintentar"
          (action)="store.loadHistory()"
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
        margin-bottom: 22px;
      }
      .eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .event {
        position: relative;
        display: grid;
        min-height: 105px;
        align-items: start;
        gap: 14px;
        padding: 18px;
        border-bottom: 1px solid var(--tizo-border);
        grid-template-columns: 42px 1fr auto;
      }
      .event:last-child {
        border-bottom: 0;
      }
      .event-icon {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border-radius: 12px;
        background: var(--tizo-success-bg);
        color: var(--tizo-success);
      }
      .event-icon--rejected {
        background: var(--tizo-danger-bg);
        color: var(--tizo-danger);
      }
      .event > div {
        display: grid;
        gap: 3px;
      }
      .event-meta {
        color: var(--tizo-muted);
        font-size: 9px;
        font-weight: 700;
      }
      .event h2 {
        margin: 4px 0 0;
        font-size: 12.5px;
      }
      .event p,
      .event small {
        margin: 0;
        color: var(--tizo-muted);
        font-size: 9.5px;
      }
      .event small {
        margin-top: 5px;
        font-family: ui-monospace, monospace;
      }
      @media (max-width: 620px) {
        .page-header {
          align-items: stretch;
          flex-direction: column;
        }
        .event {
          grid-template-columns: 40px 1fr;
        }
        .event app-status-badge {
          grid-column: 2;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancellationHistoryPageComponent implements OnInit {
  readonly store = inject(CancellationsStore);
  ngOnInit(): void {
    this.store.loadHistory();
  }
  trackEvent(_: number, event: AuditEvent): string {
    return event.id;
  }
  actionLabel(action: string): string {
    return action.includes('REJECTED')
      ? 'Rechazada'
      : action.includes('COMPLETED')
        ? 'Completada'
        : 'Solicitada';
  }
}
