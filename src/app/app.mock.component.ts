import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DemoPanelComponent } from './shared/ui/demo-panel/demo-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DemoPanelComponent],
  template: `
    <router-outlet />
    <app-demo-panel />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockAppComponent {}
