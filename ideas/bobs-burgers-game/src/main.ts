/**
 * main.ts — Phaser bootstrap.
 * Registers all scenes; stays thin.
 */

import Phaser from 'phaser';
import { SessionStartScene } from './scenes/SessionStartScene';
import { GameScene } from './scenes/GameScene';
import { EndScene } from './scenes/EndScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0d0800',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [SessionStartScene, GameScene, EndScene],
};

new Phaser.Game(config);
