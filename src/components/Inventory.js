import { GAME_WIDTH } from '../config/gameConfig.js';

export class Inventory {
  constructor(scene) {
    this.scene = scene;
    this.items = [];

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

    // Items text
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
    // 检查 itemsText 是否存在（场景可能处于 sleep 状态）
    if (!this.itemsText || !this.itemsText.active) {
      return;
    }
    
    if (this.items.length === 0) {
      this.itemsText.setText('（空）');
      this.itemsText.setColor('#aaaaaa');
    } else {
      const names = this.items.map(item => {
        const icon = item.id === 'map_fragment' ? '🗺️' : '🔑';
        return `${icon} ${item.name}`;
      }).join(', ');
      this.itemsText.setText(names);
      this.itemsText.setColor('#ffdd44');
    }
  }
}