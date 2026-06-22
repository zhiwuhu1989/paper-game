import { GAME_WIDTH, GAME_HEIGHT, PAPER_WIDTH } from '../config/gameConfig.js';

export class Toast {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.isShowing = false;
  }

  show(message, duration = 2500, color = '#ffffff', iconKey = null) {
    this.queue.push({ message, duration, color, iconKey });
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
    const { message, duration, color, iconKey } = this.queue.shift();

    const camera = this.scene.cameras.main;
    const centerX = camera.width / 2;
    const centerY = camera.height / 2 - 60;

    const maxTextWidth = PAPER_WIDTH * 0.8;

    const text = this.scene.add.text(0, 0, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: color,
      align: 'center',
      wordWrap: { width: maxTextWidth }
    }).setOrigin(0.5);

    let icon = null;
    let contentWidth = text.width;
    let contentHeight = text.height;

    if (iconKey) {
      icon = this.scene.add.image(0, 0, iconKey);
      icon.setDisplaySize(24, 24);
      contentWidth = text.width + icon.displayWidth + 8;
      contentHeight = Math.max(text.height, icon.displayHeight);
    }

    // 水平居中排列内容
    const startX = centerX - contentWidth / 2;
    if (icon) {
      icon.setPosition(startX + icon.displayWidth / 2, centerY);
      icon.setScrollFactor(0).setDepth(3001);
      text.setPosition(startX + icon.displayWidth + 8 + text.width / 2, centerY);
    } else {
      text.setPosition(centerX, centerY);
    }
    text.setScrollFactor(0).setDepth(3001);

    const pad = 12;
    const bgWidth = Math.max(contentWidth + pad * 2, 120);
    const bgHeight = contentHeight + pad * 2;

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
    if (icon) icon.setAlpha(0);

    const targets = [bg, text];
    if (icon) targets.push(icon);

    this.scene.tweens.add({
      targets,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Hold then fade out
        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              bg.destroy();
              text.destroy();
              if (icon) icon.destroy();
              this.showNext();
            }
          });
        });
      }
    });
  }
}
