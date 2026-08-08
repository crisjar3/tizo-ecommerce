import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { OfflineBannerComponent } from '../offline-banner/offline-banner.component';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    OfflineBannerComponent,
    LucideAngularModule,
  ],
  templateUrl: './customer-shell.component.html',
  styleUrls: ['./customer-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerShellComponent {}
