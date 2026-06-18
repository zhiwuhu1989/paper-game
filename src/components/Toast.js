import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export class Toast {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.isShowing = false;
  }

  show(message, duration = 2500, color = '#ffffff') {
    this.queue.push({ message, duration, color });
    if (!this.isShowing) {
      this.showNext();
    }
  }

  showNext() {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    // 检查场景是否存在
    if (!this.scene || !this.scene.add) {
      this.queue = [];
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const { message, duration, color } = this.queue.shift();

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 - 60;

    const bg = this.scene.add.graphics();
    bg.setScrollFactor(0);
    bg.setDepth(3000);

    const text = this.scene.add.text(centerX, centerY, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: GAME_WIDTH * 0.7 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3001);

    const bounds = text.getBounds();
    const pad = 12;
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(
      bounds.x - pad,
      bounds.y - pad,
      bounds.width + pad * 2,
      bounds.height + pad * 2,
      8
    );

    // Fade in
    bg.setAlpha(0);
    text.setAlpha(0);

    this.scene.tweens.add({
      targets: [bg, text],
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Hold then fade out
        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets: [bg, text],
            alpha: 0,
            duration: 400,
            onComplete: () => {
              bg.destroy();
              text.destroy();
              this.showNext();
            }
          });
        });
      }
    });
  }
}