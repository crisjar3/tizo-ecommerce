import { Injectable } from '@angular/core';
import { fromEvent, map, merge, of, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  readonly online$ = merge(
    of(navigator.onLine),
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false)),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
}
