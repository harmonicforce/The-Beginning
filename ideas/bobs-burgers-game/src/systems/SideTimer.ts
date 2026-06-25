/**
 * SideTimer.ts — Layer 1A
 * Pass/fail timer for sides (fries, drinks, salad, beer).
 * Player starts the timer, then must "pull" before the deadline expires.
 * Fail = burn/spill/wilt; must restart with a time cost.
 */

import { STANDARD_MENU } from '../config/tunables';

export type SideTimerState = 'idle' | 'running' | 'passed' | 'failed';

export type SideType = 'fries' | 'side_salad' | 'soft_drink' | 'beer';

function deadlineForSide(type: SideType): number {
  switch (type) {
    case 'fries':     return STANDARD_MENU.fries.burnTimeSec;
    case 'side_salad': return STANDARD_MENU.side_salad.wiltTimeSec;
    case 'soft_drink': return STANDARD_MENU.soft_drink.overflowTimeSec;
    case 'beer':      return STANDARD_MENU.beer.overflowTimeSec;
  }
}

export class SideTimer {
  readonly type: SideType;
  readonly deadlineSec: number;
  state: SideTimerState = 'idle';
  elapsed: number = 0;
  failCount: number = 0;

  constructor(type: SideType) {
    this.type = type;
    this.deadlineSec = deadlineForSide(type);
  }

  get fraction(): number {
    return Math.min(1, this.elapsed / this.deadlineSec);
  }

  start(): void {
    this.state = 'running';
    this.elapsed = 0;
  }

  pull(): boolean {
    if (this.state !== 'running') return false;
    this.state = 'passed';
    return true;
  }

  update(deltaSec: number): void {
    if (this.state !== 'running') return;
    this.elapsed += deltaSec;
    if (this.elapsed >= this.deadlineSec) {
      this.state = 'failed';
      this.failCount++;
    }
  }

  restart(): void {
    this.state = 'idle';
    this.elapsed = 0;
  }
}
