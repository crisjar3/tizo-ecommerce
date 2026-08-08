import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ActiveOperator {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
}

const STORAGE_KEY = 'tizo:active-operator:v1';

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as ActiveOperator;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
