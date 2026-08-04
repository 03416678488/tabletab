import { type MessageEvent } from '@nestjs/common';
import { type Observable, interval, merge } from 'rxjs';
import { map } from 'rxjs/operators';

import { RealtimeService } from './realtime.service';

/** Keep the SSE connection alive through proxies when no events flow. */
const HEARTBEAT_MS = 25_000;

/**
 * Forward one channel's events as an SSE stream, plus a keep-alive heartbeat.
 * This Nest version serializes the whole emitted object into the `data:` line,
 * so we emit the flat payload directly — the client parses it once.
 */
export function sseFromChannel(
  realtime: RealtimeService,
  channel: string,
): Observable<MessageEvent> {
  const updates = realtime.channel(channel).pipe(
    map(
      (e) =>
        ({ event: e.type, at: e.at, ...(e.data as Record<string, unknown>) }) as unknown as MessageEvent,
    ),
  );
  const heartbeat = interval(HEARTBEAT_MS).pipe(
    map(() => ({ event: 'ping' }) as unknown as MessageEvent),
  );
  return merge(updates, heartbeat);
}
