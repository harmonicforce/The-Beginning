/**
 * Teddy.ts — Layer 6
 * Teddy Buckland — loyal regular and emergency backup.
 * State machine: absent ↔ seated(regular) | absent ↔ backup(service)
 * The two roles are mutually exclusive.
 */

import { TEDDY } from '../config/tunables';
import { Telemetry } from '../systems/Telemetry';

export type TeddyState = 'absent' | 'seated' | 'backup';

export type QuestState = 'none' | 'available' | 'active' | 'completed' | 'missed';

export interface TeddyQuest {
  id: string;
  description: string;
  state: QuestState;
  timeLimit: number;    // seconds to complete
  elapsed: number;
}

export class Teddy {
  state: TeddyState = 'absent';
  relationshipScore: number = 0.5;
  seatId: string | null = null;
  quest: TeddyQuest | null = null;

  // Jalapeño incident state (backup failure mode)
  jalapenoBlind: boolean = false;
  jalapenoRecoveryTimer: number = 0;

  get isPresent(): boolean {
    return this.state !== 'absent';
  }

  get passiveBuffActive(): boolean {
    // Buff only applies when seated as regular, not as backup worker
    return this.state === 'seated';
  }

  get revenueMultiplier(): number {
    return this.passiveBuffActive ? (1 + TEDDY.passiveRevenueBuff) : 1.0;
  }

  seat(seatId: string): void {
    if (this.state !== 'absent') return;
    this.state = 'seated';
    this.seatId = seatId;
    Telemetry.emit('teddy_seated', { seat_id: seatId, relationship_score: this.relationshipScore });
    this.offerQuest();
  }

  activateBackup(availableFamilyCount: number): void {
    if (this.state !== 'absent') return;
    this.state = 'backup';
    this.jalapenoBlind = false;
    Telemetry.emit('teddy_backup_activated', { family_available_count: availableFamilyCount });
  }

  leave(): void {
    if (this.state === 'absent') return;
    this.seatId = null;
    this.state = 'absent';
  }

  get competenceModifier(): number {
    if (this.state !== 'backup') return 1.0;
    return this.jalapenoBlind ? 0 : TEDDY.backupCompetence;
  }

  private offerQuest(): void {
    if (this.quest !== null) return;
    this.quest = {
      id: `teddy_quest_${Date.now()}`,
      description: 'Teddy wants his usual — burger with extra napkins and a side of fries.',
      state: 'available',
      timeLimit: 90, // 90 seconds to complete his quest
      elapsed: 0,
    };
  }

  startQuest(): void {
    if (this.quest?.state !== 'available') return;
    this.quest.state = 'active';
  }

  completeQuest(): void {
    if (!this.quest || this.quest.state !== 'active') return;
    this.quest.state = 'completed';
    const before = this.relationshipScore;
    this.relationshipScore = Math.min(1.0, this.relationshipScore + TEDDY.questCompleteReward);
    Telemetry.emit('teddy_quest_completed', {
      relationship_before: before,
      relationship_after: this.relationshipScore,
    });
  }

  missQuest(): void {
    if (!this.quest || (this.quest.state !== 'active' && this.quest.state !== 'available')) return;
    this.quest.state = 'missed';
    const before = this.relationshipScore;
    this.relationshipScore = Math.max(0, this.relationshipScore - TEDDY.questMissedPenalty);
    Telemetry.emit('teddy_quest_missed', {
      relationship_before: before,
      relationship_after: this.relationshipScore,
    });
  }

  triggerJalapenoIncident(): void {
    if (this.state !== 'backup') return;
    this.jalapenoBlind = true;
    this.jalapenoRecoveryTimer = 8; // 8 seconds blind
    Telemetry.emit('teddy_backup_failure', { failure_type: 'jalapeno_blind' });
  }

  update(deltaSec: number): void {
    if (this.jalapenoBlind) {
      this.jalapenoRecoveryTimer -= deltaSec;
      if (this.jalapenoRecoveryTimer <= 0) {
        this.jalapenoBlind = false;
      }
    }
    if (this.quest?.state === 'active') {
      this.quest.elapsed += deltaSec;
      if (this.quest.elapsed >= this.quest.timeLimit) {
        this.missQuest();
      }
    }
  }

  addEncouragement(addToPool: (source: string, weight: number) => void): void {
    // Teddy pep talk while he's seated
    if (this.state === 'seated') {
      addToPool('teddy_pep_talk', 0.20);
      Telemetry.emit('teddy_pep_talk', { relationship_score: this.relationshipScore });
    }
  }
}
