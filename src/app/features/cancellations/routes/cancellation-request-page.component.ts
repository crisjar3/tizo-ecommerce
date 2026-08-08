import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { CANCELLATION_REASONS } from '../../../core/api/api-contract';
import type { Money } from '../../../core/api/api-contract';
import { MoneyPipe } from '../../../shared/ui/money/money.pipe';
import { PageStateComponent } from '../../../shared/ui/page-state/page-state.component';
import { CustomerOrdersStore } from '../../customer-orders/state/customer-orders.store';
import { OpsOrdersStore } from '../../ops-orders/state/ops-orders.store';
import type { HasPendingCancellationForm } from '../guards/pending-cancellation.guard';
import { CancellationsStore } from '../state/cancellations.store';

interface CancellationLineView {
  readonly id: string;
  readonly name: string;
  readonly detail: string;
  readonly effect: string;
  readonly amount: Money;
  readonly disabled: boolean;
}

@Component({
  selector: 'app-cancellation-request-page',
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
  providers: [CancellationsStore, CustomerOrdersStore, OpsOrdersStore],
  template: `
    <a class="back-link" [routerLink]="customer ? ['/my/orders', orderId] : ['/orders', orderId]"
      ><lucide-icon name="arrow-left" [size]="16" /> Volver a la orden</a
    >
    <header class="page-header">
      <div>
        <span class="eyebrow">{{ customer ? 'Solicitud del cliente' : 'Operaciones' }}</span>
        <h1 class="page-heading">Solicitar cancelación</h1>
        <p class="page-lead">
          Seleccioná líneas completas. La orden no cambia hasta que Operaciones apruebe la
          solicitud.
        </p>
      </div>
      <span class="order-pill">Orden #{{ orderId }}</span>
    </header>

    <ng-container *ngIf="loading"
      ><div class="empty-center">
        <app-page-state
          title="Verificando la orden"
          message="Estamos consultando qué productos siguen siendo cancelables."
        /></div
    ></ng-container>
    <ng-container *ngIf="loadError"
      ><div class="empty-center panel">
        <app-page-state
          [title]="loadError.title"
          [message]="loadError.message"
          actionLabel="Volver"
          (action)="goBack()"
        /></div
    ></ng-container>

    <form
      class="cancel-layout"
      [formGroup]="form"
      (ngSubmit)="submit()"
      *ngIf="!loading && !loadError"
    >
      <section class="form-main">
        <div class="content-card">
          <div class="content-card__header">
            <span>1. Elegí los productos</span
            ><button type="button" class="select-all" (click)="selectAll()">
              Seleccionar disponibles
            </button>
          </div>
          <label
            class="cancel-line"
            *ngFor="let line of lines; trackBy: trackLine"
            [class.cancel-line--disabled]="line.disabled"
            ><input
              type="checkbox"
              [checked]="isSelected(line.id)"
              [disabled]="line.disabled || submitting"
              (change)="toggle(line.id)"
            /><span class="check-mark" aria-hidden="true"></span
            ><span class="line-icon"><lucide-icon name="package" [size]="18" /></span
            ><span class="line-copy"
              ><strong>{{ line.name }}</strong
              ><small>{{ line.detail }}</small
              ><span *ngIf="!customer">{{ line.effect }}</span></span
            ><strong>{{ line.amount | money }}</strong></label
          >
        </div>

        <section class="reason-card content-card">
          <div class="content-card__header"><span>2. Contanos el motivo</span></div>
          <div class="fields">
            <label class="field"
              ><span class="field__label">Motivo</span
              ><select formControlName="reasonCode">
                <option value="">Seleccioná un motivo</option>
                <option *ngFor="let reason of reasons" [value]="reason.code">
                  {{ reason.label }}
                </option></select
              ><span
                class="field__error"
                *ngIf="form.controls.reasonCode.touched && form.controls.reasonCode.invalid"
                >Elegí un motivo.</span
              ></label
            ><label class="field"
              ><span class="field__label">Nota</span
              ><textarea
                formControlName="reasonNote"
                maxlength="280"
                placeholder="Agregá contexto para quien revise la solicitud"
              ></textarea
              ><small>{{ form.controls.reasonNote.value.length }}/280</small></label
            >
          </div>
        </section>
      </section>

      <aside class="summary panel">
        <span class="summary__eyebrow">Resumen</span>
        <h2>{{ selectedIds.length }} {{ selectedIds.length === 1 ? 'producto' : 'productos' }}</h2>
        <div class="summary-total">
          <span>Monto afectado</span><strong>{{ selectedAmount | money }}</strong>
        </div>
        <div class="notice">
          <lucide-icon name="info" [size]="17" /><span
            ><strong>La orden todavía no cambia</strong>La cancelación será efectiva solo después de
            la aprobación.</span
          >
        </div>
        <button
          class="btn btn--primary"
          type="submit"
          [disabled]="form.invalid || !selectedIds.length || submitting"
        >
          {{ submitting ? 'Enviando…' : 'Enviar solicitud' }}</button
        ><a
          class="btn btn--secondary"
          [routerLink]="customer ? ['/my/orders', orderId] : ['/orders', orderId]"
          >Cancelar</a
        >
      </aside>
    </form>

    <ng-container *ngIf="store.command$ | async as command"
      ><section class="command-error" role="alert" *ngIf="command.status === 'error'">
        <lucide-icon name="circle-alert" [size]="18" /><span
          ><strong>{{ command.error.title }}</strong
          >{{ command.error.message
          }}<small *ngIf="command.error.correlationId"
            >Referencia: {{ command.error.correlationId }}</small
          ></span
        >
      </section>
      <section
        class="command-error command-error--uncertain"
        role="alert"
        *ngIf="command.status === 'uncertain'"
      >
        <lucide-icon name="clock-3" [size]="18" /><span
          ><strong>No sabemos si se creó la solicitud</strong>Verificá el resultado antes de volver
          a enviar.</span
        ><button
          class="btn btn--secondary"
          type="button"
          (click)="store.reconcile(command.idempotencyKey)"
        >
          Verificar resultado
        </button>
      </section></ng-container
    >
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
      .eyebrow,
      .summary__eyebrow {
        color: var(--tizo-accent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 22px;
      }
      .order-pill {
        padding: 7px 11px;
        border: 1px solid var(--tizo-border);
        border-radius: 999px;
        background: #fff;
        font-size: 10px;
        font-weight: 800;
      }
      .cancel-layout {
        display: grid;
        align-items: start;
        gap: 20px;
        grid-template-columns: minmax(0, 1fr) 330px;
      }
      .form-main {
        display: grid;
        gap: 16px;
      }
      .select-all {
        background: transparent;
        color: var(--tizo-accent);
        cursor: pointer;
        font-size: 10px;
        font-weight: 800;
      }
      .cancel-line {
        position: relative;
        display: grid;
        min-height: 84px;
        align-items: center;
        gap: 12px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--tizo-border);
        cursor: pointer;
        grid-template-columns: 20px 40px minmax(150px, 1fr) auto;
      }
      .cancel-line:last-child {
        border-bottom: 0;
      }
      .cancel-line > input {
        position: absolute;
        opacity: 0;
      }
      .check-mark {
        display: grid;
        width: 18px;
        height: 18px;
        place-items: center;
        border: 1.5px solid var(--tizo-border-strong);
        border-radius: 5px;
      }
      .cancel-line > input:checked + .check-mark {
        border-color: var(--tizo-accent);
        background: var(--tizo-accent);
        box-shadow: inset 0 0 0 4px #fff;
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
      .line-copy {
        display: grid;
        gap: 3px;
      }
      .line-copy strong,
      .cancel-line > strong {
        font-size: 11.5px;
      }
      .line-copy small {
        color: var(--tizo-muted);
        font-size: 9px;
      }
      .line-copy > span {
        margin-top: 4px;
        color: #7c6845;
        font-size: 9px;
      }
      .cancel-line--disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .fields {
        display: grid;
        gap: 16px;
        padding: 18px;
      }
      .field small {
        justify-self: end;
        color: var(--tizo-muted);
        font-size: 9px;
      }
      .summary {
        position: sticky;
        top: 88px;
        padding: 24px;
      }
      .summary h2 {
        margin: 8px 0 22px;
        font-size: 20px;
      }
      .summary-total {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 17px 0;
        border-block: 1px solid var(--tizo-border);
        font-size: 11px;
      }
      .summary-total strong {
        color: var(--tizo-accent);
        font-size: 20px;
      }
      .summary .notice {
        margin: 18px 0;
      }
      .summary .btn {
        width: 100%;
        margin-top: 9px;
      }
      .command-error {
        display: flex;
        align-items: center;
        gap: 11px;
        margin-top: 16px;
        padding: 14px;
        border-radius: 12px;
        background: var(--tizo-danger-bg);
        color: var(--tizo-danger);
        font-size: 10.5px;
      }
      .command-error > span {
        display: grid;
        flex: 1;
        gap: 2px;
      }
      .command-error--uncertain {
        border: 1px solid #f1d8a9;
        background: var(--tizo-warning-bg);
        color: #765d35;
      }
      @media (max-width: 860px) {
        .cancel-layout {
          grid-template-columns: 1fr;
        }
        .summary {
          position: static;
        }
      }
      @media (max-width: 620px) {
        .page-header {
          align-items: flex-start;
          flex-direction: column;
        }
        .cancel-line {
          align-items: start;
          grid-template-columns: 20px 1fr auto;
        }
        .line-icon {
          display: none;
        }
        .line-copy {
          grid-column: 2;
        }
        .cancel-line > strong {
          grid-column: 3;
          grid-row: 1 / span 2;
        }
        .command-error {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancellationRequestPageComponent implements OnInit, HasPendingCancellationForm {
  readonly store = inject(CancellationsStore);
  readonly reasons = CANCELLATION_REASONS;
  readonly customer = inject(ActivatedRoute).snapshot.data['customer'] === true;
  readonly orderId = inject(ActivatedRoute).snapshot.paramMap.get('orderId') ?? '';
  readonly form = new FormGroup({
    itemIds: new FormControl<readonly string[]>([], { nonNullable: true }),
    reasonCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    reasonNote: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(280)] }),
  });
  lines: readonly CancellationLineView[] = [];
  loading = true;
  loadError: { readonly title: string; readonly message: string } | null = null;
  submitting = false;
  private completed = false;
  private readonly customerOrders = inject(CustomerOrdersStore);
  private readonly opsOrders = inject(OpsOrdersStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  get selectedIds(): readonly string[] {
    return this.form.controls.itemIds.value;
  }
  get selectedAmount(): Money {
    return {
      amountMinor: this.lines
        .filter((line) => this.selectedIds.includes(line.id))
        .reduce((sum, line) => sum + line.amount.amountMinor, 0),
      currency: this.lines[0]?.amount.currency ?? 'ARS',
    };
  }

  ngOnInit(): void {
    if (this.customer) {
      this.customerOrders.selected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
        this.loading = state.status === 'loading';
        this.loadError = state.status === 'error' ? state.error : null;
        if (state.status === 'success')
          this.lines = state.data.items.map((item) => ({
            id: item.id,
            name: item.name,
            detail: `${item.quantity} unidad`,
            effect: '',
            amount: item.lineTotal,
            disabled: item.cancelled || !['CONFIRMED', 'PREPARING'].includes(state.data.progress),
          }));
      });
      this.customerOrders.loadOrder(this.orderId);
    } else {
      this.opsOrders.selected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
        this.loading = state.status === 'loading';
        this.loadError = state.status === 'error' ? state.error : null;
        if (state.status === 'success')
          this.lines = state.data.items.map((item) => ({
            id: item.id,
            name: item.name,
            detail: `${item.store} · ${item.sku}`,
            effect: item.operationalEffect,
            amount: item.lineTotal,
            disabled: !item.cancellable,
          }));
      });
      this.opsOrders.loadOrder(this.orderId);
    }
    this.store.command$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((command) => {
      this.submitting = command.status === 'submitting';
      if (command.status === 'success') {
        this.completed = true;
        this.form.markAsPristine();
        void this.router.navigate(
          this.customer ? ['/my/orders', this.orderId] : ['/cancellations', command.data.id],
          { queryParams: { requested: 1 } },
        );
      }
    });
  }

  toggle(itemId: string): void {
    const values = this.selectedIds;
    this.form.controls.itemIds.setValue(
      values.includes(itemId) ? values.filter((id) => id !== itemId) : [...values, itemId],
    );
    this.form.markAsDirty();
  }
  selectAll(): void {
    this.form.controls.itemIds.setValue(
      this.lines.filter((line) => !line.disabled).map((line) => line.id),
    );
    this.form.markAsDirty();
  }
  isSelected(itemId: string): boolean {
    return this.selectedIds.includes(itemId);
  }
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.selectedIds.length) return;
    const value = this.form.getRawValue();
    this.store.create({
      customer: this.customer,
      command: {
        orderId: this.orderId,
        itemIds: value.itemIds,
        reasonCode: value.reasonCode,
        reasonNote: value.reasonNote,
        idempotencyKey: crypto.randomUUID(),
      },
    });
  }
  goBack(): void {
    void this.router.navigate(
      this.customer ? ['/my/orders', this.orderId] : ['/orders', this.orderId],
    );
  }
  hasUnsavedChanges(): boolean {
    return !this.completed && this.form.dirty;
  }
  trackLine(_: number, line: CancellationLineView): string {
    return line.id;
  }
}
