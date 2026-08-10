import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ActiveOperator {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
}

const STORAGE_KEY = 'tizo:active-operator:v2';
const LEGACY_STORAGE_KEYS = ['tizo:active-operator:v1'] as const;

@Injectable({ providedIn: 'root' })
export class OperatorSessionService {
  private readonly subject = new BehaviorSubject<ActiveOperator | null>(this.readStored());

  readonly activeOperator$ = this.subject.asObservable();

  get activeOperator(): ActiveOperator | null {
    return this.subject.value;
  }

  select(operator: ActiveOperator): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operator));
    this.subject.next(operator);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.subject.next(null);
  }

  private readStored(): ActiveOperator | null {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const candidate: unknown = JSON.parse(stored);
      if (isActiveOperator(candidate)) return candidate;
      localStorage.removeItem(STORAGE_KEY);
      return null;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}

function isActiveOperator(value: unknown): value is ActiveOperator {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    candidate['id'].length > 0 &&
    typeof candidate['name'] === 'string' &&
    candidate['name'].length > 0 &&
    typeof candidate['initials'] === 'string' &&
    candidate['initials'].length > 0
  );
}
