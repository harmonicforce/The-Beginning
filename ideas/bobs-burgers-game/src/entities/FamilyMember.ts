/**
 * FamilyMember.ts — Layer 2
 * Data + state machine for each Belcher family member in service.
 * States: unassigned → correct → wrong → drifting
 */

import { FAMILY_SERVICE } from '../config/tunables';

export type FamilyCharacter = 'linda' | 'tina' | 'gene' | 'louise';
export type ServiceRole = 'orders' | 'busing';
export type FamilyServiceState = 'unassigned' | 'correct' | 'wrong' | 'drifting';

export type LindaDriftBehavior =
  | 'chatting'          // service slows, slight satisfaction boost
  | 'singing'           // entertaining, orders forgotten
  | 'kitchen_intrusion' // interferes with timing bar
  | 'phone_call';       // completely off-task

export type DriftBehavior =
  | 'performing'        // Gene
  | 'frozen'            // Tina
  | LindaDriftBehavior
  | 'chaos_wildcard';   // Louise — escalates to disruption system

export interface FamilyMember {
  character: FamilyCharacter;
  serviceState: FamilyServiceState;
  preferredRole: ServiceRole;
  currentRole: ServiceRole | null;
  driftTimer: number;        // seconds until drift activates if wrong assignment
  driftBehavior: DriftBehavior | null;
  competenceModifier: number;
  tellVisibility: number;    // 0.0–1.0 how obvious the hint is
  tellIndicators: string[];
}

const LINDA_DRIFT_POOL: LindaDriftBehavior[] = [
  'chatting',
  'singing',
  'kitchen_intrusion',
  'phone_call',
];

export function createFamilyMember(
  character: FamilyCharacter,
  preferredRole: ServiceRole,
): FamilyMember {
  return {
    character,
    serviceState: 'unassigned',
    preferredRole,
    currentRole: null,
    driftTimer: rollDriftDelay(),
    driftBehavior: null,
    competenceModifier: FAMILY_SERVICE.correctCompetence,
    tellVisibility: 0.6 + Math.random() * 0.4,
    tellIndicators: tellsFor(character, preferredRole),
  };
}

export function assign(member: FamilyMember, role: ServiceRole): void {
  member.currentRole = role;
  member.driftBehavior = null;
  if (role === member.preferredRole) {
    member.serviceState = 'correct';
    member.competenceModifier = FAMILY_SERVICE.correctCompetence;
  } else {
    member.serviceState = 'wrong';
    member.driftTimer = rollDriftDelay();
    member.competenceModifier = FAMILY_SERVICE.correctCompetence;
  }
}

export function unassign(member: FamilyMember): void {
  member.currentRole = null;
  member.serviceState = 'unassigned';
  member.driftBehavior = null;
  member.competenceModifier = FAMILY_SERVICE.correctCompetence;
}

export function updateDrift(member: FamilyMember, deltaSec: number): boolean {
  if (member.serviceState !== 'wrong') return false;
  member.driftTimer -= deltaSec;
  if (member.driftTimer <= 0) {
    member.serviceState = 'drifting';
    member.driftBehavior = selectDriftBehavior(member.character);
    member.competenceModifier = 0;
    return true; // just started drifting
  }
  return false;
}

function selectDriftBehavior(character: FamilyCharacter): DriftBehavior {
  switch (character) {
    case 'gene':   return 'performing';
    case 'tina':   return 'frozen';
    case 'linda':  return LINDA_DRIFT_POOL[Math.floor(Math.random() * LINDA_DRIFT_POOL.length)];
    case 'louise': return 'chaos_wildcard';
  }
}

function rollDriftDelay(): number {
  return FAMILY_SERVICE.driftDelayMinSec +
    Math.random() * (FAMILY_SERVICE.driftDelayMaxSec - FAMILY_SERVICE.driftDelayMinSec);
}

function tellsFor(character: FamilyCharacter, role: ServiceRole): string[] {
  if (character === 'linda' && role === 'orders')  return ['bouncing between tables', 'making eye contact with guests'];
  if (character === 'linda' && role === 'busing')  return ['clearing plates without being asked', 'humming near the booths'];
  if (character === 'tina' && role === 'orders')   return ['rehearsing her order-taking speech', 'notepad in hand'];
  if (character === 'tina' && role === 'busing')   return ['reorganizing the napkin stack', 'eyeing the dirty tables'];
  if (character === 'gene' && role === 'orders')   return ['doing a little server dance', 'greeting customers loudly'];
  if (character === 'gene' && role === 'busing')   return ['humming a busing rhythm', 'stacking plates dramatically'];
  if (character === 'louise' && role === 'orders') return ['suspiciously quiet near customers', 'hat askew'];
  if (character === 'louise' && role === 'busing') return ['busing too fast, something is up', 'watching the kitchen'];
  return [];
}
