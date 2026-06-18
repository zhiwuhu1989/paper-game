import Phaser from 'phaser';
import { CELL_SIZE } from '../config/gameConfig.js';

export class House extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config) {
    super(scene, x, y);
    this.scene = scene;
    this.config = config;
    this.id = config.id;
    this.tile = config.tile;        // 房屋位置
    this.doorTile = config.doorTile; // 门位置
    this.requiredKey = config.requiredKey;
    this.name = config.name;
    this.isUnlocked = false;

    // 应用偏移（默认 0）
    const offsetX = config.offsetX || 0;
    const offsetY = config.offsetY || 0;
    
    // 设置容器位置（包含偏移）
    this.setPosition(x + offsetX, y + offsetY);
    this.setDepth(899);

    // 使用 house_1 资源创建房屋（使用容器内的局部坐标）
    this.houseSprite = scene.add.image(0, 0, 'house_1').setOrigin(0.5, 1); // 原点设置在底部中心（用于和门对齐）
    this.houseSprite.setDisplaySize(249, 208); // 根据格子大小调整显示尺寸
    this.houseSprite.setAlpha(0);

    // 锁图标（使用容器内的局部坐标，相对于容器中心）
    // this.lockIcon = scene.add.text(0, -3 * CELL_SIZE, '🔒', {
    //   fontSize: '14px'
    // }).setOrigin(0.5);

    // // 房屋标签（使用容器内的局部坐标）
    // this.label = scene.add.text(0, -3 * CELL_SIZE - 12, this.name, {
    //   fontSize: '11px',
    //   fontFamily: 'Arial',
    //   color: '#ffffff',
    //   stroke: '#000000',
    //   strokeThickness: 3,
    //   align: 'center'
    // }).setOrigin(0.5, 1);

    // 将所有元素添加到容器中
    this.add(this.houseSprite);
    // this.add(this.lockIcon);
    // this.add(this.label);
  }

  isAtDoor(playerTile) {
    return playerTile.x === this.doorTile.x && playerTile.y === this.doorTile.y;
  }

  isAdjacentToDoor(playerTile) {
    const dx = Math.abs(playerTile.x - this.doorTile.x);
    const dy = Math.abs(playerTile.y - this.doorTile.y);
    return (dx + dy) === 1;
  }

  unlock() {
    this.isUnlocked = true;
    // this.lockIcon.setText('🔓');
    
    // Visual feedback - change door color
    // this.scene.tweens.add({
    //   targets: this.lockIcon,
    //   scale: 1.5,
    //   duration: 300,
    //   yoyo: true
    // });
  }

  getSprite() {
    return this; // 返回容器本身
  }

  destroy() {
    this.houseSprite.destroy();
    // this.lockIcon.destroy();
    // this.label.destroy();
    super.destroy();
  }
}