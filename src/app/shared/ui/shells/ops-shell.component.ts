import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { OperatorSessionService } from '../../../core/session/operator-session.service';
import { OfflineBannerComponent } from '../offline-banner/offline-banner.component';

@Component({
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    OfflineBannerComponent,
    LucideAngularModule,
  ],
  templateUrl: './ops-shell.component.html',
  styleUrls: ['./ops-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsShellComponent {
  readonly operatorSession = inject(OperatorSessionService);
}
