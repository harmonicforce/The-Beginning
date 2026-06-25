/**
 * EndScene.ts
 * Session end screen. Displays the Belcher Rating and session stats.
 */

import Phaser from 'phaser';
import { Telemetry } from '../systems/Telemetry';

interface EndSceneData {
  belcherRating: number;
  revenue: number;
  morale: number;
  teddyRelationship: number;
  avgQuality: number;
  ordersCompleted: number;
  fischoederDecision: 'accept' | 'resist' | null;
  botdChoice: 'creativity' | 'safety' | null;
}

export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  create(data: EndSceneData): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(0, 0, width, height, 0x0d0800).setOrigin(0, 0);

    // Header
    this.add.text(cx, 40, "RUSH WAVE COMPLETE", { fontFamily: 'monospace', fontSize: '28px', color: '#ffdd44', fontStyle: 'bold' }).setOrigin(0.5);

    // Belcher Rating — the headline number
    const ratingPct = (data.belcherRating * 100).toFixed(1);
    const ratingColor = data.belcherRating > 0.75 ? '#ffdd00'
      : data.belcherRating > 0.5 ? '#ffaa44'
      : data.belcherRating > 0.3 ? '#ff8844'
      : '#ff4444';
    this.add.text(cx, 95, 'BELCHER RATING', { fontFamily: 'monospace', fontSize: '16px', color: '#888888' }).setOrigin(0.5);
    this.add.text(cx, 125, `${ratingPct}`, { fontFamily: 'Georgia, serif', fontSize: '72px', color: ratingColor, fontStyle: 'bold', stroke: '#442200', strokeThickness: 3 }).setOrigin(0.5);

    // Rating description
    const desc = ratingDescription(data.belcherRating);
    this.add.text(cx, 185, `"${desc}"`, { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#aa8844', fontStyle: 'italic' }).setOrigin(0.5);

    // Stats breakdown
    const statsY = 220;
    const colX = [cx - 380, cx - 130, cx + 130, cx + 330];

    this.drawStat(colX[0], statsY, 'BURGER QUALITY', `${(data.avgQuality * 100).toFixed(0)}%`, data.avgQuality > 0.7 ? '#44ff88' : data.avgQuality > 0.4 ? '#ffaa44' : '#ff6644');
    this.drawStat(colX[1], statsY, 'FAMILY MORALE', `${(data.morale * 100).toFixed(0)}%`, data.morale > 0.6 ? '#44ff88' : data.morale > 0.35 ? '#ffaa44' : '#ff6644');
    this.drawStat(colX[2], statsY, 'TEDDY BOND', `${(data.teddyRelationship * 100).toFixed(0)}%`, data.teddyRelationship > 0.6 ? '#44aaff' : '#888888');
    this.drawStat(colX[3], statsY, 'REVENUE', `$${data.revenue.toFixed(2)}`, '#44ff88');

    // Session notes
    const notesY = 340;
    this.add.text(cx, notesY, 'SESSION NOTES', { fontFamily: 'monospace', fontSize: '14px', color: '#555566' }).setOrigin(0.5);

    const notes = this.buildNotes(data);
    notes.forEach((note, i) => {
      this.add.text(cx, notesY + 24 + i * 22, note.text, { fontFamily: 'monospace', fontSize: '13px', color: note.color }).setOrigin(0.5);
    });

    // Orders completed
    this.add.text(cx, 480, `Orders completed this rush: ${data.ordersCompleted}`, { fontFamily: 'monospace', fontSize: '14px', color: '#666677' }).setOrigin(0.5);

    // Bob's final line
    const bobLine = bobClosingLine(data.belcherRating, data.botdChoice);
    this.add.text(cx, 535, `"${bobLine}"`, { fontFamily: 'Georgia, serif', fontSize: '15px', color: '#997755', fontStyle: 'italic', align: 'center', wordWrap: { width: 800 } }).setOrigin(0.5);
    this.add.text(cx, 565, '— Bob Belcher', { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#665544', fontStyle: 'italic' }).setOrigin(0.5);

    // Telemetry note
    this.add.text(cx, 600, 'Full telemetry dumped to console. Press T to view again.', { fontFamily: 'monospace', fontSize: '11px', color: '#333344' }).setOrigin(0.5);

    // Play again
    const playBtn = this.add.rectangle(cx, 645, 280, 50, 0x224433).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(2, 0x44aa66);
    this.add.text(cx, 645, 'PLAY ANOTHER RUSH', { fontFamily: 'monospace', fontSize: '16px', color: '#44ff88', fontStyle: 'bold' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      Telemetry.reset();
      this.scene.start('SessionStartScene');
    });
    this.input.keyboard?.on('keydown-T', () => Telemetry.dumpToConsole());
  }

  private drawStat(x: number, y: number, label: string, value: string, color: string): void {
    const box = this.add.rectangle(x, y + 50, 220, 90, 0x111111).setOrigin(0.5);
    box.setStrokeStyle(1, 0x333333);
    this.add.text(x, y + 20, label, { fontFamily: 'monospace', fontSize: '11px', color: '#666677' }).setOrigin(0.5);
    this.add.text(x, y + 58, value, { fontFamily: 'monospace', fontSize: '28px', color, fontStyle: 'bold' }).setOrigin(0.5);
  }

  private buildNotes(data: EndSceneData): Array<{ text: string; color: string }> {
    const notes: Array<{ text: string; color: string }> = [];

    if (data.botdChoice) {
      notes.push({ text: `Burger of the Day: ${data.botdChoice.toUpperCase()} mode`, color: '#aaaacc' });
    }
    if (data.fischoederDecision === 'accept') {
      notes.push({ text: "Fischoeder's terms accepted — rent goes up next session.", color: '#ff8844' });
    } else if (data.fischoederDecision === 'resist') {
      notes.push({ text: 'Fischoeder was resisted — pressure builds next session, but autonomy preserved.', color: '#44aaff' });
    } else {
      notes.push({ text: "Fischoeder didn't appear this rush.", color: '#555566' });
    }
    if (data.teddyRelationship >= 0.6) {
      notes.push({ text: 'Teddy is happy. He\'ll be back.', color: '#44aaff' });
    } else if (data.teddyRelationship < 0.4) {
      notes.push({ text: "Teddy seemed let down today.", color: '#886644' });
    }

    return notes;
  }
}

function ratingDescription(rating: number): string {
  if (rating >= 0.85) return "Legendary. The Belcher name means something in this neighborhood.";
  if (rating >= 0.70) return "Strong session. Bob's love of food came through in every plate.";
  if (rating >= 0.55) return "Solid. The chaos was managed. The family held together.";
  if (rating >= 0.40) return "Rough around the edges. But still standing. That counts for something.";
  if (rating >= 0.25) return "Hard day. These happen. The restaurant's still open tomorrow.";
  return "Rock bottom. Time for a family meeting that's actually about the family.";
}

function bobClosingLine(rating: number, botdChoice: 'creativity' | 'safety' | null): string {
  if (rating >= 0.75 && botdChoice === 'creativity') {
    return "See, when you swing for something and it lands... that's the whole thing. That's why I cook.";
  }
  if (rating >= 0.75 && botdChoice === 'safety') {
    return "Consistent. Reliable. Nothing wrong with that. People got fed and went home happy.";
  }
  if (rating >= 0.5) {
    return "We got through it. The kids helped, the food was good enough, and nobody got hurt. I'll take it.";
  }
  if (rating >= 0.3) {
    return "I know it wasn't our best. But we showed up. Every day we show up is a day we didn't give up.";
  }
  return "Okay. Tomorrow is tomorrow. Tonight I'm going to think about a new burger and pretend today didn't happen.";
}
