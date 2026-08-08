import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

async function prepareMockApi(): Promise<void> {
  if (!environment.mockApi) return;
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

void prepareMockApi()
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((error: unknown) => console.error('No fue posible iniciar Tizo.', error));
