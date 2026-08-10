import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import type { ElementRef, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type {
  CancellationRequestItem,
  CancellationRequestStatus,
} from '../../../core/api/api-contract';
import { IdempotencyKeyFactory } from '../../../core/api/idempotency-key.factory';
import { NetworkStatusService } from '../../../core/network/network-status.service';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { CancellationsStore } from '../state/cancellations.store';

@Component({
  selector: 'app-cancellation-detail-page',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    MoneyPipe,
    PageStateComponent,
    StatusBadgeComponent,
  ],
  providers: [CancellationsStore],
  template: `
    <a class="back-link" routerLink="/cancellations"
      ><lucide-icon name="arrow-left" [size]="16" /> Volver a solicitudes</a
    >
    <ng-container *ngIf="store.selected$ | async as state">
      <article *ngIf="state.data !== null">
        <section class="created-notice" *ngIf="requested">
          <lucide-icon name="circle-check" [size]="18" /><span
            ><strong>Solicitud creada</strong>La orden sigue intacta hasta que se apruebe.</span
          >
        </section>
        <header class="detail-heading">
          <div>
            <span class="eyebrow">Solicitud {{ state.data.id }}</span>
            <h1 class="page-heading">Orden #{{ state.data.orderId }}</h1>
            <p class="page-lead">
              Creada por {{ state.data.requesterName }} el
              {{ state.data.requestedAt | date: 'd MMM y, HH:mm' }}
            </p>
          </div>
          <app-status-badge
            [label]="statusLabel(state.data.status)"
            [tone]="
              state.data.status === 'COMPLETED'
                ? 'success'
                : state.data.status === 'REJECTED'
                  ? 'danger'
                  : 'warning'
            "
          />
        </header>

        <section
          class="validity-banner"
          [class.validity-banner--invalid]="!state.data.validNow"
          *ngIf="state.data.status === 'PENDING'"
        >
          <lucide-icon
            [name]="state.data.validNow ? 'shield-check' : 'triangle-alert'"
            [size]="18"
          /><span
            ><strong>{{
              state.data.validNow ? 'La solicitud sigue vigente' : 'La orden cambió'
            }}</strong
            >{{
              state.data.validNow
                ? 'Las líneas continúan siendo cancelables según el estado actual.'
                : state.data.invalidReason
            }}</span
          >
        </section>

        <div class="detail-grid">
          <section class="detail-main">
            <div class="content-card">
              <div class="content-card__header">
                <span>Productos solicitados</span
                ><strong>{{ state.data.affectedAmount | money }}</strong>
              </div>
              <article
                class="request-line"
                *ngFor="let item of state.data.items; trackBy: trackItem"
              >
                <span class="line-icon"><lucide-icon name="package" [size]="18" /></span>
                <div>
                  <strong>{{ item.name }}</strong
                  ><small>{{ item.store }} · Estado al solicitar: {{ item.itemStatusBefore }}</small
                  ><span>{{ item.operationalEffect }}</span>
                </div>
                <strong>{{ item.amount | money }}</strong>
              </article>
            </div>
            <section class="reason content-card">
              <div class="content-card__header">Motivo y contexto</div>
              <div>
                <strong>{{ state.data.reasonCode }}</strong>
                <p>{{ state.data.reasonNote || 'Sin nota adicional.' }}</p>
              </div>
            </section>
          </section>

          <aside class="decision panel">
            <span class="eyebrow">Decisión operacional</span>
            <h2>
              {{ state.data.status === 'PENDING' ? 'Resolver solicitud' : 'Caso resuelto' }}
            </h2>
            <ng-container *ngIf="state.data.status === 'PENDING'; else resolution"
              ><p>La aprobación actualizará todas las líneas y montos en una única operación.</p>
              <button
                class="btn btn--primary"
                type="button"
                [disabled]="!state.data.validNow || (network.online$ | async) === false"
                (click)="openDialog('approve')"
              >
                <lucide-icon name="circle-check" [size]="15" /> Aprobar cancelación</button
              ><button
                class="btn btn--secondary"
                type="button"
                [disabled]="(network.online$ | async) === false"
                (click)="openDialog('reject')"
              >
                <lucide-icon name="circle-x" [size]="15" /> Rechazar solicitud
              </button></ng-container
            ><ng-template #resolution
              ><div class="resolution">
                <span>Resuelta por</span><strong>{{ state.data.resolverName }}</strong
                ><small>{{ state.data.resolvedAt | date: 'd MMM y, HH:mm' }}</small>
                <p *ngIf="state.data.rejectionNote">{{ state.data.rejectionNote }}</p>
              </div>
              <a class="btn btn--secondary" [routerLink]="['/orders', state.data.orderId]"
                >Ver orden actualizada</a
              ></ng-template
            >
          </aside>
        </div>

        <ng-container *ngIf="store.command$ | async as command"
          ><section class="command-message" role="alert" *ngIf="command.status === 'error'">
            <lucide-icon name="circle-alert" [size]="18" /><span
              ><strong>{{ command.error.title }}</strong
              >{{ command.error.message }}</span
            ><button
              *ngIf="command.error.recovery === 'reload-readonly'"
              class="btn btn--secondary"
              type="button"
              (click)="reload()"
            >
              Recargar
            </button>
          </section>
          <section
            class="command-message command-message--uncertain"
            role="alert"
            *ngIf="command.status === 'uncertain'"
          >
            <lucide-icon name="clock-3" [size]="18" /><span
              ><strong>Resultado sin confirmar</strong>La respuesta se perdió; no vuelvas a resolver
              sin verificar.</span
            ><button
              class="btn btn--secondary"
              type="button"
              (click)="store.reconcile(command.idempotencyKey)"
            >
              Verificar ahora
            </button>
          </section></ng-container
        >

        <div class="dialog-backdrop" *ngIf="dialogAction">
          <section
            #dialog
            class="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            tabindex="-1"
            (keydown.escape)="closeDialog()"
          >
            <span class="dialog-icon" [class.dialog-icon--reject]="dialogAction === 'reject'"
              ><lucide-icon
                [name]="dialogAction === 'approve' ? 'circle-check' : 'circle-x'"
                [size]="22"
            /></span>
            <h2 id="dialog-title">
              {{
                dialogAction === 'approve'
                  ? '¿Aprobar esta cancelación?'
                  : '¿Rechazar esta solicitud?'
              }}
            </h2>
            <p>
              {{
                dialogAction === 'approve'
                  ? 'Se actualizarán las líneas, montos y auditoría de forma atómica.'
                  : 'La orden quedará intacta y el motivo quedará auditado.'
              }}
            </p>
            <label class="field" *ngIf="dialogAction === 'reject'"
              ><span class="field__label">Motivo del rechazo</span
              ><textarea
                [formControl]="rejectionNote"
                placeholder="Explicá brevemente la decisión"
              ></textarea
              ><span class="field__error" *ngIf="rejectionNote.touched && rejectionNote.invalid"
                >Ingresá al menos 4 caracteres.</span
              ></label
            >
            <div class="dialog-actions">
              <button class="btn btn--secondary" type="button" (click)="closeDialog()">
                Volver</button
              ><button
                class="btn"
                [class.btn--primary]="dialogAction === 'approve'"
                [class.btn--danger]="dialogAction === 'reject'"
                type="button"
                [disabled]="
                  (dialogAction === 'reject' && rejectionNote.invalid) ||
                  (network.online$ | async) === false
                "
                (click)="
                  confirm(
                    state.data.id,
                    state.data.version,
                    state.data.currentOrderVersion ?? state.data.version
                  )
                "
              >
                Confirmar
              </button>
            </div>
          </section>
        </div>
      </article>
      <div class="empty-center" *ngIf="state.status === 'loading'">
        <app-page-state
          title="Cargando solicitud"
          message="Estamos comparando la solicitud con la orden vigente."
        />
      </div>
      <div class="empty-center panel" *ngIf="state.status === 'error' && state.data === null">
        <app-page-state
          [title]="state.error.title"
          [message]="state.error.message"
          actionLabel="Volver a solicitudes"
          (action)="goInbox()"
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
        margin: 2px 0 20px;
        color: var(--tizo-muted);
        font-size: 11px;
        font-weight: 700;
        text-decoration: none;
      }
      .eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .created-notice,
      .validity-banner,
      .command-message {
        display: flex;
        align-items: center;
        gap: 11px;
        margin-bottom: 16px;
        padding: 13px 15px;
        border: 1px solid #cfe9d9;
        border-radius: 12px;
        background: var(--tizo-success-bg);
        color: var(--tizo-success);
        font-size: 10.5px;
      }
      .created-notice span,
      .validity-banner span,
      .command-message span {
        display: grid;
        flex: 1;
        gap: 2px;
      }
      .detail-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }
      .validity-banner--invalid {
        border-color: #f1d8a9;
        background: var(--tizo-warning-bg);
        color: var(--tizo-warning);
      }
      .detail-grid {
        display: grid;
        align-items: start;
        gap: 18px;
        grid-template-columns: minmax(0, 1fr) 320px;
      }
      .detail-main {
        display: grid;
        gap: 15px;
      }
      .request-line {
        display: grid;
        min-height: 83px;
        align-items: center;
        gap: 12px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--tizo-border);
        grid-template-columns: 40px minmax(180px, 1fr) auto;
      }
      .request-line:last-child {
        border-bottom: 0;
      }
      .line-icon {
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        border-radius: 10px;
        background: var(--tizo-neutral-bg);
        color: var(--tizo-muted);
      }
      .request-line > div {
        display: grid;
        gap: 3px;
      }
      .request-line strong {
        font-size: 11.5px;
      }
      .request-line small {
        color: var(--tizo-muted);
        font-size: 9px;
      }
      .request-line div > span {
        margin-top: 4px;
        color: #7d6845;
        font-size: 9px;
      }
      .reason > div:last-child {
        padding: 17px;
      }
      .reason strong {
        font-size: 11.5px;
      }
      .reason p {
        margin: 7px 0 0;
        color: var(--tizo-muted);
        font-size: 10.5px;
        line-height: 1.6;
      }
      .decision {
        position: sticky;
        top: 88px;
        padding: 23px;
      }
      .decision h2 {
        margin: 8px 0;
        font-size: 20px;
      }
      .decision > p {
        margin: 0 0 19px;
        color: var(--tizo-muted);
        font-size: 10.5px;
        line-height: 1.6;
      }
      .decision > .btn {
        width: 100%;
        margin-top: 9px;
      }
      .resolution {
        display: grid;
        gap: 4px;
        margin: 20px 0;
        padding: 15px;
        border-radius: 11px;
        background: var(--tizo-subtle);
      }
      .resolution span,
      .resolution small {
        color: var(--tizo-muted);
        font-size: 9px;
      }
      .resolution strong {
        font-size: 11.5px;
      }
      .resolution p {
        margin: 8px 0 0;
        font-size: 10px;
      }
      .command-message {
        margin-top: 16px;
        border-color: #f1c9c4;
        background: var(--tizo-danger-bg);
        color: var(--tizo-danger);
      }
      .command-message--uncertain {
        border-color: #f1d8a9;
        background: var(--tizo-warning-bg);
        color: #765d35;
      }
      .dialog-backdrop {
        position: fixed;
        z-index: 100;
        inset: 0;
        display: grid;
        padding: 20px;
        place-items: center;
        background: rgba(20, 20, 22, 0.48);
        backdrop-filter: blur(4px);
      }
      .confirm-dialog {
        width: min(470px, 100%);
        padding: 28px;
        border-radius: 17px;
        background: #fff;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.22);
      }
      .dialog-icon {
        display: grid;
        width: 46px;
        height: 46px;
        place-items: center;
        border-radius: 13px;
        background: var(--tizo-success-bg);
        color: var(--tizo-success);
      }
      .dialog-icon--reject {
        background: var(--tizo-danger-bg);
        color: var(--tizo-danger);
      }
      .confirm-dialog h2 {
        margin: 18px 0 8px;
        font-size: 22px;
        letter-spacing: -0.035em;
      }
      .confirm-dialog > p {
        margin: 0 0 20px;
        color: var(--tizo-muted);
        font-size: 11px;
        line-height: 1.6;
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 9px;
        margin-top: 22px;
      }
      @media (max-width: 850px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
        .decision {
          position: static;
        }
      }
      @media (max-width: 620px) {
        .detail-heading {
          align-items: flex-start;
          flex-direction: column;
        }
        .request-line {
          align-items: start;
          grid-template-columns: 38px 1fr;
        }
        .request-line > strong {
          grid-column: 2;
        }
        .command-message {
          align-items: stretch;
          flex-direction: column;
        }
        .confirm-dialog {
          padding: 23px;
        }
        .dialog-actions .btn {
          flex: 1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancellationDetailPageComponent implements OnInit {
  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  readonly store = inject(CancellationsStore);
  readonly network = inject(NetworkStatusService);
  readonly requested = inject(ActivatedRoute).snapshot.queryParamMap.get('requested') === '1';
  readonly rejectionNote = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(4)],
  });
  dialogAction: 'approve' | 'reject' | null = null;
  private dialogIdempotencyKey: string | null = null;
  private previousFocus: HTMLElement | null = null;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly idempotencyKeys = inject(IdempotencyKeyFactory);
  ngOnInit(): void {
    this.reload();
  }
  reload(): void {
    this.store.loadRequest(this.route.snapshot.paramMap.get('requestId') ?? '');
  }
  openDialog(action: 'approve' | 'reject'): void {
    this.previousFocus = document.activeElement as HTMLElement | null;
    this.dialogAction = action;
    this.dialogIdempotencyKey = this.idempotencyKeys.create();
    if (action === 'approve') this.rejectionNote.setValue('');
    requestAnimationFrame(() => this.dialog?.nativeElement.focus());
  }
  closeDialog(): void {
    this.dialogAction = null;
    this.dialogIdempotencyKey = null;
    requestAnimationFrame(() => this.previousFocus?.focus());
  }
  confirm(requestId: string, expectedVersion: number, expectedOrderVersion: number): void {
    if (!this.dialogAction || (this.dialogAction === 'reject' && this.rejectionNote.invalid))
      return;
    this.store.resolve({
      requestId,
      action: this.dialogAction,
      command: {
        idempotencyKey: this.dialogIdempotencyKey ?? this.idempotencyKeys.create(),
        expectedVersion,
        expectedOrderVersion,
        rejectionCode: this.dialogAction === 'reject' ? 'OTHER' : undefined,
        rejectionNote: this.dialogAction === 'reject' ? this.rejectionNote.value : undefined,
      },
    });
    this.closeDialog();
  }
  goInbox(): void {
    void this.router.navigate(['/cancellations']);
  }
  trackItem(_: number, item: CancellationRequestItem): string {
    return item.itemId;
  }
  statusLabel(status: CancellationRequestStatus): string {
    return {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      COMPLETED: 'Completada',
      REJECTED: 'Rechazada',
    }[status];
  }
}
