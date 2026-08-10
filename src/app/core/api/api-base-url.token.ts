import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('Tizo API base URL', {
  factory: () => '/api',
});
