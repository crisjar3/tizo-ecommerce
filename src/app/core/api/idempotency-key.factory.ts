import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IdempotencyKeyFactory {
  create(): string {
    return crypto.randomUUID();
  }
}
