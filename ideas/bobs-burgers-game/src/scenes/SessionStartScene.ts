/**
 * SessionStartScene.ts
 * Burger of the Day choice at session start.
 * Player chooses: Creativity (high ceiling, high variance) or Safety (capped, reliable).
 */

import Phaser from 'phaser';
import { BotDChoice } from '../systems/BurgerOfTheDay';

export class SessionStartScene extends Phaser.Scene {
  constructor() {
    super('SessionStartScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Background
    this.add.rectangle(0, 0, width, height, 0x1a0a00).setOrigin(0, 0);

    // Header
    this.add.text(cx, 60, "BOB'S BURGERS", {
      fontFamily: 'Georgia, serif',
      fontSize: '42px',
      color: '#ffcc33',
      stroke: '#8b4513',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 110, 'What\'s the Burger of the Day?', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd480',
    }).setOrigin(0.5);

    this.add.text(cx, 145, '(This choice sets your quality ceiling for the whole rush.)', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#aa8855',
    }).setOrigin(0.5);

    // Creativity card
    this.drawChoiceCard(
      cx - 220, 260,
      'CREATIVITY',
      '#22aa44',
      '#004422',
      [
        'Full quality ceiling (1.0×)',
        'High variance — ±0.15 jitter',
        'Highest possible scores',
        'Inconsistent execution',
        '"The Procrastination Station Burger"',
        '"I\'ll deal with the consequences later."',
      ],
      'creativity',
    );

    // Safety card
    this.drawChoiceCard(
      cx + 220, 260,
      'SAFETY',
      '#4488ff',
      '#002244',
      [
        'Capped quality ceiling (0.75×)',
        'Zero variance — reliable output',
        'Can\'t hit the highest scores',
        'Consistent, predictable',
        '"The Dependable Dan Burger"',
        '"Comfort food for a reason."',
      ],
      'safety',
    );

    // Bob internal monologue at bottom
    this.add.text(cx, height - 80, '"Every Burger of the Day is a small act of faith.\nSome days you bet on yourself. Some days you just need to feed people."', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#997744',
      align: 'center',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    this.add.text(cx, height - 30, '— Bob Belcher', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#775533',
      fontStyle: 'italic',
    }).setOrigin(0.5);
  }

  private drawChoiceCard(
    cx: number,
    cy: number,
    label: string,
    borderColor: string,
    bgColor: string,
    lines: string[],
    choice: BotDChoice,
  ): void {
    const cardW = 360;
    const cardH = 340;
    const borderColorNum = Phaser.Display.Color.HexStringToColor(borderColor).color;
    const bgColorNum = Phaser.Display.Color.HexStringToColor(bgColor).color;

    const bg = this.add.rectangle(cx, cy, cardW, cardH, bgColorNum, 0.9).setOrigin(0.5);
    const border = this.add.rectangle(cx, cy, cardW, cardH).setOrigin(0.5)
      .setStrokeStyle(3, borderColorNum);

    this.add.text(cx, cy - cardH / 2 + 30, label, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: borderColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    lines.forEach((line, i) => {
      const isQuote = line.startsWith('"');
      this.add.text(cx, cy - cardH / 2 + 70 + i * 36, line, {
        fontFamily: isQuote ? 'Georgia, serif' : 'monospace',
        fontSize: isQuote ? '13px' : '14px',
        color: isQuote ? '#998866' : '#cccccc',
        fontStyle: isQuote ? 'italic' : 'normal',
        align: 'center',
        wordWrap: { width: cardW - 30 },
      }).setOrigin(0.5);
    });

    // Button
    const btn = this.add.rectangle(cx, cy + cardH / 2 - 30, cardW - 40, 44, borderColorNum, 0.9).setOrigin(0.5);
    const btnText = this.add.text(cx, cy + cardH / 2 - 30, `Choose ${label}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.setInteractive({ useHandCursor: true });
    bg.setInteractive({ useHandCursor: true });
    border.setInteractive({ useHandCursor: true });

    const onClick = (): void => {
      this.scene.start('GameScene', { botdChoice: choice });
    };

    btn.on('pointerdown', onClick);
    bg.on('pointerdown', onClick);
    border.on('pointerdown', onClick);
    btnText.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);

    // Hover effect
    btn.on('pointerover', () => btn.setFillStyle(borderColorNum, 1.0));
    btn.on('pointerout', () => btn.setFillStyle(borderColorNum, 0.9));
  }
}
