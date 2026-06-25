/**
 * Telemetry.ts — Layer 0
 * Emit game events + snapshot state to an in-memory ring buffer.
 * Debug key (`T`) dumps the buffer to JSON in the console.
 */

export interface TelemetryEvent {
  timestamp: number;
  event: string;
  payload: Record<string, unknown>;
}

const BUFFER_SIZE = 500;
const buffer: TelemetryEvent[] = [];
let bufferIndex = 0;

export const Telemetry = {
  emit(event: string, payload: Record<string, unknown> = {}): void {
    const entry: TelemetryEvent = {
      timestamp: performance.now(),
      event,
      payload,
    };
    buffer[bufferIndex % BUFFER_SIZE] = entry;
    bufferIndex++;
    console.log(`[TEL] ${event}`, payload);
  },

  snapshotState(vars: Record<string, unknown>, label = 'state_snapshot'): void {
    Telemetry.emit(label, vars);
  },

  dump(): TelemetryEvent[] {
    const count = Math.min(bufferIndex, BUFFER_SIZE);
    const out: TelemetryEvent[] = [];
    if (bufferIndex <= BUFFER_SIZE) {
      return buffer.slice(0, bufferIndex);
    }
    const start = bufferIndex % BUFFER_SIZE;
    for (let i = 0; i < count; i++) {
      out.push(buffer[(start + i) % BUFFER_SIZE]);
    }
    return out;
  },

  dumpToConsole(): void {
    console.log('[TEL DUMP]', JSON.stringify(Telemetry.dump(), null, 2));
  },

  reset(): void {
    buffer.length = 0;
    bufferIndex = 0;
  },
};
