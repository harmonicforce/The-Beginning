/**
 * FamilyService.ts — Layer 2
 * Manages all four Belcher family members in service.
 * Handles assignment, tell visibility, drift state machines.
 */

import { FAMILY_SERVICE } from '../config/tunables';
import {
  FamilyMember,
  FamilyCharacter,
  ServiceRole,
  createFamilyMember,
  assign,
  unassign,
  updateDrift,
} from '../entities/FamilyMember';
import { LouiseDisruption } from './LouiseDisruption';
import { Telemetry } from './Telemetry';

export class FamilyService {
  members: Map<FamilyCharacter, FamilyMember> = new Map();
  louiseDisruption: LouiseDisruption;
  driftCount: number = 0;
  disruptionCount: number = 0;

  private onLindaKitchenIntrusion: (() => void) | null = null;
  private driftCallbacks: ((character: FamilyCharacter, behavior: string) => void)[] = [];

  constructor() {
    // Session-random preferred roles (adds replayability)
    this.members.set('linda',  createFamilyMember('linda',  Math.random() < 0.5 ? 'orders' : 'busing'));
    this.members.set('tina',   createFamilyMember('tina',   Math.random() < 0.5 ? 'orders' : 'busing'));
    this.members.set('gene',   createFamilyMember('gene',   Math.random() < 0.5 ? 'orders' : 'busing'));
    this.members.set('louise', createFamilyMember('louise', Math.random() < 0.5 ? 'orders' : 'busing'));
    this.louiseDisruption = new LouiseDisruption();
  }

  onDrift(cb: (character: FamilyCharacter, behavior: string) => void): void {
    this.driftCallbacks.push(cb);
  }

  setLindaKitchenCallback(cb: () => void): void {
    this.onLindaKitchenIntrusion = cb;
  }

  assignRole(character: FamilyCharacter, role: ServiceRole): void {
    const member = this.members.get(character);
    if (!member) return;
    assign(member, role);
    Telemetry.emit('family_assignment', {
      character,
      role,
      correct_match: member.serviceState === 'correct',
    });
  }

  unassignRole(character: FamilyCharacter): void {
    const member = this.members.get(character);
    if (!member) return;
    unassign(member);
  }

  get(character: FamilyCharacter): FamilyMember | undefined {
    return this.members.get(character);
  }

  getAll(): FamilyMember[] {
    return Array.from(this.members.values());
  }

  availableMemberCount(): number {
    let count = 0;
    for (const m of this.members.values()) {
      if (m.serviceState !== 'drifting') count++;
    }
    return count;
  }

  update(deltaSec: number): void {
    for (const [character, member] of this.members) {
      const justDrifted = updateDrift(member, deltaSec);
      if (justDrifted && member.driftBehavior) {
        this.driftCount++;
        Telemetry.emit('family_drift', {
          character,
          drift_behavior: member.driftBehavior,
          time_before_drift_sec: FAMILY_SERVICE.driftDelayMinSec,
        });
        for (const cb of this.driftCallbacks) {
          cb(character, member.driftBehavior);
        }
        // Linda kitchen intrusion needs special handling
        if (character === 'linda' && member.driftBehavior === 'kitchen_intrusion') {
          this.onLindaKitchenIntrusion?.();
        }
      }
    }

    // Roll Louise disruption periodically (every 15 seconds of wrong/drifting)
    const louise = this.members.get('louise');
    if (louise && (louise.serviceState === 'wrong' || louise.serviceState === 'drifting')) {
      // Handled externally via rollLouiseDisruption()
    }
  }

  rollLouiseDisruption(): string | null {
    const effect = this.louiseDisruption.rollDisruption();
    if (effect) {
      this.disruptionCount++;
      return this.louiseDisruption.describeEffect(effect);
    }
    return null;
  }

  setLouiseMood(scheming: boolean): void {
    this.louiseDisruption.setMood(scheming ? 'scheming' : 'manageable');
  }
}
