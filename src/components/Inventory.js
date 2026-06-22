import { GAME_WIDTH } from '../config/gameConfig.js';

export class Inventory {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.itemIcons = [];

    this.createUI();
  }

  createUI() {
    const panelX = GAME_WIDTH - 160;
    const panelY = 10;
    const panelW = 150;
    const panelH = 40;

    // Background
    this.bg = this.scene.add.graphics();
    this.bg.setScrollFactor(0);
    this.bg.setDepth(1500);
    this.bg.fillStyle(0x000000, 0.6);
    this.bg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    this.bg.lineStyle(1, 0xffffff, 0.4);
    this.bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    // Title
    this.titleText = this.scene.add.text(panelX + 8, panelY + 6, '🎒 背包', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(1501);

    // Items text（备用，空状态时显示）
    this.itemsText = this.scene.add.text(panelX + 8, panelY + 22, '（空）', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#aaaaaa'
    }).setScrollFactor(0).setDepth(1501);
  }

  addItem(item) {
    this.items.push(item);
    this.updateDisplay();

    // Flash effect
    this.scene.tweens.add({
      targets: this.bg,
      alpha: { from: 0.3, to: 1 },
      duration: 200,
      yoyo: true,
      repeat: 2
    });
  }

  hasItem(itemId) {
    return this.items.some(item => item.id === itemId);
  }

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.updateDisplay();
  }

  updateDisplay() {
    // 检查场景是否存在
    if (!this.itemsText || !this.itemsText.active) {
      return;
    }

    // 清理旧图标
    this.itemIcons.forEach(obj => obj.destroy());
    this.itemIcons = [];

    if (this.items.length === 0) {
      this.itemsText.setText('（空）');
      this.itemsText.setColor('#aaaaaa');
      this.itemsText.setVisible(true);
      return;
    }

    this.itemsText.setVisible(false);

    const panelX = GAME_WIDTH - 160;
    const panelY = 10;
    let currentX = panelX + 8;
    const baseY = panelY + 22;

    this.items.forEach((item, index) => {
      if (index > 0) {
        const sep = this.scene.add.text(currentX, baseY, ', ', {
          fontSize: '11px',
          fontFamily: 'Arial',
          color: '#ffdd44'
        }).setScrollFactor(0).setDepth(1501);
        this.itemIcons.push(sep);
        currentX += sep.width;
      }

      if (item.id === 'house_key') {
        const keyIcon = this.scene.add.image(currentX + 6, baseY + 6, 'key');
        keyIcon.setDisplaySize(12, 12);
        keyIcon.setScrollFactor(0).setDepth(1501);
        keyIcon.setOrigin(0, 0.5);
        this.itemIcons.push(keyIcon);
        currentX += 14;

        const t = this.scene.add.text(currentX, baseY, item.name, {
          fontSize: '11px',
          fontFamily: 'Arial',
          color: '#ffdd44'
        }).setScrollFactor(0).setDepth(1501);
        this.itemIcons.push(t);
        currentX += t.width;
      } else {
        const icon = item.id === 'map_fragment' ? '🗺️' : '';
        const t = this.scene.add.text(currentX, baseY, `${icon} ${item.name}`, {
          fontSize: '11px',
          fontFamily: 'Arial',
          color: '#ffdd44'
        }).setScrollFactor(0).setDepth(1501);
        this.itemIcons.push(t);
        currentX += t.width;
      }
    });
  }
}
