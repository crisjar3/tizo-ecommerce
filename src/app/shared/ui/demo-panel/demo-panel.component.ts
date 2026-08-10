import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { DemoApiClient } from '../../../core/demo/demo-api.client';
import { MOCK_SCENARIO_KEY, MOCK_SCENARIOS } from '../../../core/demo/mock-scenario';
import type { MockScenario } from '../../../core/demo/mock-scenario';

@Component({
  selector: 'app-demo-panel',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, LucideAngularModule],
  template: `
    <button
      class="demo-trigger"
      type="button"
      aria-label="Abrir controles de la demo"
      [attr.aria-expanded]="open"
      (click)="open = !open"
    >
      <lucide-icon name="flask-conical" [size]="17" />
      <span>Demo</span>
    </button>
    <section class="demo-panel" *ngIf="open" aria-label="Escenario de la API simulada">
      <header>
        <span><strong>Laboratorio del mock</strong><small>Estados determinísticos</small></span>
        <button type="button" aria-label="Cerrar controles" (click)="open = false">
          <lucide-icon name="x" [size]="16" />
        </button>
      </header>
      <label class="field">
        <span class="field__label">Escenario</span>
        <select [(ngModel)]="scenario" (ngModelChange)="applyScenario($event)">
          <option *ngFor="let option of scenarios" [ngValue]="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <p>{{ scenarioDescription }}</p>
      <button
        class="btn btn--secondary reset"
        type="button"
        [disabled]="resetting"
        (click)="reset()"
      >
        <lucide-icon name="database-backup" [size]="15" />
        {{ resetting ? 'Restaurando…' : 'Restaurar datos seed' }}
      </button>
    </section>
  `,
  styles: [
    `
      :host {
        position: fixed;
        z-index: 80;
        right: 18px;
        bottom: 18px;
      }
      .demo-trigger {
        display: flex;
        min-height: 40px;
        align-items: center;
        gap: 7px;
        padding: 0 13px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 999px;
        background: #242427;
        color: #fff;
        box-shadow: 0 10px 35px rgba(20, 20, 22, 0.2);
        cursor: pointer;
        font-size: 10.5px;
        font-weight: 800;
      }
      .demo-panel {
        position: absolute;
        right: 0;
        bottom: 50px;
        width: 290px;
        padding: 16px;
        border: 1px solid var(--tizo-border);
        border-radius: 15px;
        background: #fff;
        box-shadow: 0 22px 70px rgba(20, 20, 22, 0.2);
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      header span {
        display: grid;
        gap: 2px;
      }
      header strong {
        font-size: 12px;
      }
      header small {
        color: var(--tizo-muted);
        font-size: 9px;
      }
      header button {
        display: grid;
        width: 30px;
        height: 30px;
        place-items: center;
        border-radius: 8px;
        background: var(--tizo-subtle);
        cursor: pointer;
      }
      .demo-panel p {
        min-height: 34px;
        margin: 11px 0;
        color: var(--tizo-muted);
        font-size: 9.5px;
        line-height: 1.5;
      }
      .reset {
        width: 100%;
      }
      @media (max-width: 620px) {
        :host {
          right: 12px;
          bottom: 78px;
        }
        .demo-trigger span {
          display: none;
        }
        .demo-trigger {
          width: 42px;
          padding: 0;
          justify-content: center;
        }
        .demo-panel {
          width: min(290px, calc(100vw - 24px));
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoPanelComponent {
  readonly scenarios = MOCK_SCENARIOS;
  open = false;
  resetting = false;
  scenario = (sessionStorage.getItem(MOCK_SCENARIO_KEY) ?? 'normal') as MockScenario;
  private readonly api = inject(DemoApiClient);

  get scenarioDescription(): string {
    return this.scenarios.find((option) => option.value === this.scenario)?.description ?? '';
  }

  applyScenario(scenario: MockScenario): void {
    sessionStorage.setItem(MOCK_SCENARIO_KEY, scenario);
    window.location.reload();
  }

  reset(): void {
    this.resetting = true;
    sessionStorage.setItem(MOCK_SCENARIO_KEY, 'normal');
    this.api.reset().subscribe({
      next: () => window.location.reload(),
      error: () => {
        this.resetting = false;
      },
    });
  }
}
