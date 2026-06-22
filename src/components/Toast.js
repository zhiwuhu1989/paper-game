import { GAME_WIDTH, GAME_HEIGHT, PAPER_WIDTH } from '../config/gameConfig.js';

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

    const camera = this.scene.cameras.main;
    const centerX = camera.width / 2;
    const centerY = camera.height / 2 - 60;

    const maxTextWidth = PAPER_WIDTH * 0.8;

    const text = this.scene.add.text(centerX, centerY, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: maxTextWidth }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3001);

    const bounds = text.getBounds();
    const pad = 12;
    const bgWidth = Math.max(bounds.width + pad * 2, 120);
    const bgHeight = bounds.height + pad * 2;

    // 使用 dialog_bubble 九宫格底图，避免拉伸变形
    const bg = this.scene.add.nineslice(
      centerX, centerY,
      'dialog_bubble',
      null,
      bgWidth, bgHeight,
      20, 20, 12, 12
    );
    bg.setScrollFactor(0);
    bg.setDepth(3000);

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