import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-page-state',
  standalone: true,
  imports: [NgIf, LucideAngularModule],
  template: `
    <section class="state" role="status">
      <span class="state__icon" aria-hidden="true"><lucide-icon name="circle-alert" /></span>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <button *ngIf="actionLabel" class="btn btn--secondary" type="button" (click)="action.emit()">
        {{ actionLabel }}
      </button>
    </section>
  `,
  styles: [
    `
      .state {
        max-width: 430px;
        padding: 42px 24px;
        text-align: center;
      }
      .state__icon {
        display: grid;
        width: 48px;
        height: 48px;
        margin: 0 auto 17px;
        place-items: center;
        border-radius: 14px;
        background: var(--tizo-neutral-bg);
        color: var(--tizo-text-soft);
      }
      h2 {
        margin: 0;
        font-size: 21px;
        letter-spacing: -0.03em;
      }
      p {
        margin: 9px auto 20px;
        color: var(--tizo-muted);
        font-size: 13px;
        line-height: 1.6;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageStateComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) message = '';
  @Input() actionLabel = '';
  @Output() readonly action = new EventEmitter<void>();
}
