import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

/** A domain event routed to a single logical channel. */
export interface RealtimeEvent {
  /** Logical channel, e.g. `order:<uuid>` or `t:<tenant>:branch:<id>:orders`. */
  channel: string;
  /** Event name, e.g. `order.updated`. */
  type: string;
  /** Minimal, non-sensitive payload (clients reconcile details over REST). */
  data: unknown;
  /** Server emit time (ISO). */
  at: string;
}

/**
 * Central realtime bus. Services publish domain events here *after commit*; SSE
 * endpoints subscribe to a single channel and forward events to clients.
 *
 * Single-instance today (in-memory RxJS Subject). To scale horizontally, this is
 * the one seam to change: in `publish()` also push the event to Redis pub/sub,
 * and have a Redis subscriber on every instance call `this.stream$.next(event)`.
 * The channel model and every consumer stay identical.
 */
@Injectable()
export class RealtimeService {
  private readonly stream$ = new Subject<RealtimeEvent>();

  publish(channel: string, type: string, data: unknown): void {
    this.stream$.next({ channel, type, data, at: new Date().toISOString() });
  }

  /** Live events for one channel. */
  channel(name: string): Observable<RealtimeEvent> {
    return this.stream$.asObservable().pipe(filter((e) => e.channel === name));
  }
}
