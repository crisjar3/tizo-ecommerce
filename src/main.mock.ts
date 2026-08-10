import { bootstrapApplication } from '@angular/platform-browser';

import { MockAppComponent } from './app/app.mock.component';
import { appConfig } from './app/app.config';
import { worker } from './mocks/browser';

void worker
  .start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
  .then(() => bootstrapApplication(MockAppComponent, appConfig))
  .catch((error: unknown) => console.error('No fue posible iniciar Tizo en modo mock.', error));
