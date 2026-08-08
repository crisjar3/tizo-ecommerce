import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { NetworkStatusService } from '../../../core/network/network-status.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [AsyncPipe, NgIf, LucideAngularModule],
  template: `
    <div *ngIf="(network.online$ | async) === false" class="offline" role="alert">
      <lucide-icon name="wifi-off" [size]="17" />
      <span
        ><strong>Sin conexión.</strong> Conservamos tu pantalla, pero no enviaremos cambios.</span
      >
    </div>
  `,
  styles: [
    `
      .offline {
        display: flex;
        min-height: 42px;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: 9px 18px;
        border-bottom: 1px solid #f1d8a9;
        background: var(--tizo-warning-bg);
        color: #7b6848;
        font-size: 12px;
      }
      strong {
        color: var(--tizo-warning);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineBannerComponent {
  readonly network = inject(NetworkStatusService);
}
