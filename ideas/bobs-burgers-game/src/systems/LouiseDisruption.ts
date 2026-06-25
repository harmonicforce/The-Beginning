/**
 * LouiseDisruption.ts — Layer 2C
 * Louise's baseline disruption chance per task she performs.
 * Separate from the Gambit system (Layer 7).
 * Disruption chance: 10% manageable / 30% scheming.
 */

import { LOUISE } from '../config/tunables';
import { Telemetry } from './Telemetry';

export type DisruptionEffect =
  | 'false_rumor'       // "human remains" claim → customer satisfaction tanks, possible walkout
  | 'insult'            // customer satisfaction hit
  | 'mess'              // cascading delay for another family member
  | 'distraction';      // card tower / asinine behavior → task abandoned

export type LouiseMood = 'manageable' | 'scheming';

const EFFECT_POOL: DisruptionEffect[] = ['false_rumor', 'insult', 'mess', 'distraction'];

export class LouiseDisruption {
  mood: LouiseMood = 'manageable';
  private taskCount: number = 0;

  setMood(mood: LouiseMood): void {
    this.mood = mood;
  }

  rollDisruption(): DisruptionEffect | null {
    const chance = this.mood === 'scheming'
      ? LOUISE.baselineDisruptionScheming
      : LOUISE.baselineDisruptionManageable;
    if (Math.random() >= chance) return null;

    const effect = EFFECT_POOL[Math.floor(Math.random() * EFFECT_POOL.length)];
    this.taskCount++;
    Telemetry.emit('louise_disruption', {
      task: `task_${this.taskCount}`,
      disruption_type: effect,
      mood_state: this.mood,
      cascading: effect === 'mess',
    });
    return effect;
  }

  describeEffect(effect: DisruptionEffect): string {
    switch (effect) {
      case 'false_rumor':  return 'Louise told them there might be human remains in the food.';
      case 'insult':       return 'Louise said something... memorable to the customer.';
      case 'mess':         return 'Louise created a mess. Someone needs to clean it up.';
      case 'distraction':  return "Louise is building a card tower out of menus. She's abandoned her task.";
    }
  }
}
