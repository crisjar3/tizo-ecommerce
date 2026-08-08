import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template:
    '<span class="badge" [attr.data-tone]="tone"><span class="badge__dot"></span>{{ label }}</span>',
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .badge {
        display: inline-flex;
        min-height: 24px;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        border-radius: 999px;
        background: var(--tizo-neutral-bg);
        color: var(--tizo-neutral);
        font-size: 10.5px;
        font-weight: 800;
        line-height: 1.2;
        white-space: nowrap;
      }
      .badge__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
      [data-tone='info'] {
        background: var(--tizo-info-bg);
        color: var(--tizo-info);
      }
      [data-tone='success'] {
        background: var(--tizo-success-bg);
        color: var(--tizo-success);
      }
      [data-tone='warning'] {
        background: var(--tizo-warning-bg);
        color: var(--tizo-warning);
      }
      [data-tone='danger'] {
        background: var(--tizo-danger-bg);
        color: var(--tizo-danger);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  @Input({ required: true }) label = '';
  @Input() tone: StatusTone = 'neutral';
}
