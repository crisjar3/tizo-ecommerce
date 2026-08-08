import type { CanDeactivateFn } from '@angular/router';

export interface HasPendingCancellationForm {
  hasUnsavedChanges(): boolean;
}

export const pendingCancellationGuard: CanDeactivateFn<HasPendingCancellationForm> = (component) =>
  !component.hasUnsavedChanges() ||
  window.confirm('Tenés cambios sin enviar. ¿Querés salir y descartarlos?');
