import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

const LEGACY_MOCK_RELOAD_KEY = 'tizo:legacy-mock-worker-cleaned';

async function removeLegacyMockWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return true;

  const registrations = await navigator.serviceWorker.getRegistrations();
  const legacyRegistrations = registrations.filter((registration) =>
    registration.active?.scriptURL.endsWith('/mockServiceWorker.js'),
  );

  await Promise.all(legacyRegistrations.map((registration) => registration.unregister()));

  const controlledByMock =
    navigator.serviceWorker.controller?.scriptURL.endsWith('/mockServiceWorker.js');
  if (controlledByMock && sessionStorage.getItem(LEGACY_MOCK_RELOAD_KEY) !== 'true') {
    sessionStorage.setItem(LEGACY_MOCK_RELOAD_KEY, 'true');
    window.location.reload();
    return false;
  }

  sessionStorage.removeItem(LEGACY_MOCK_RELOAD_KEY);
  return true;
}

void removeLegacyMockWorker()
  .then((ready) => (ready ? bootstrapApplication(AppComponent, appConfig) : undefined))
  .catch((error: unknown) => console.error('No fue posible iniciar Tizo.', error));
