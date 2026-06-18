import Phaser from 'phaser';
import { CELL_SIZE } from '../config/gameConfig.js';

export class NPC extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {object} config - NPC配置
   */
  constructor(scene, x, y, config) {
    super(scene, x, y);
    this.scene = scene;
    this.config = config;
    this.id = config.id;
    this.tile = config.tile;
    this.name = config.name;
    this.dialogues = config.dialogues;
    this.reward = config.reward;
    this.requiredRepair = config.requiredRepair; // 需要修复的装饰名称
    this.hasGivenReward = false;
    this.questCompleted = false; // 任务是否已完成

    // 应用偏移（默认 0）
    const offsetX = config.offsetX || 0;
    const offsetY = config.offsetY || 0;

    // 设置容器位置（包含偏移）
    this.setPosition(x + offsetX, y + offsetY);
    this.setDepth(900);

    // 使用正式资源创建 NPC
    const texture = config.texture || 'npc_1';
    const width = config.width || CELL_SIZE * 0.8;
    const height = config.height || CELL_SIZE * 0.8;
    this.npcSprite = scene.add.image(0, 0, texture).setOrigin(0.5, 1); // 原点设置在底部中心
    this.npcSprite.setDisplaySize(width, height);

    // // NPC label
    // this.label = scene.add.text(0, -CELL_SIZE * 0.8 - 8, this.name, {
    //   fontSize: '12px',
    //   fontFamily: 'Arial',
    //   color: '#ffffff',
    //   stroke: '#000000',
    //   strokeThickness: 3,
    //   align: 'center'
    // }).setOrigin(0.5, 1);

    // // Exclamation mark indicator (shows quest available)
    // this.indicator = scene.add.text(0, -CELL_SIZE * 0.8 - 22, '!', {
    //   fontSize: '16px',
    //   fontFamily: 'Arial',
    //   fontStyle: 'bold',
    //   color: '#ffff00',
    //   stroke: '#000000',
    //   strokeThickness: 3
    // }).setOrigin(0.5, 1);

    // 将所有元素添加到容器中
    this.add(this.npcSprite);
    // this.add(this.label);
    // this.add(this.indicator);

    // Bounce animation for indicator
    // scene.tweens.add({
    //   targets: this.indicator,
    //   y: this.indicator.y - 5,
    //   duration: 500,
    //   yoyo: true,
    //   repeat: -1
    // });
  }

  isAdjacentTo(playerTile) {
    const dx = Math.abs(playerTile.x - this.tile.x);
    const dy = Math.abs(playerTile.y - this.tile.y);
    return (dx + dy) === 1;
  }

  isAtSameTile(playerTile) {
    return playerTile.x === this.tile.x && playerTile.y === this.tile.y;
  }

  hideIndicator() {
    // this.indicator.setVisible(false);
  }

  getSprite() {
    return this; // 返回容器本身
  }

  destroy() {
    this.npcSprite.destroy();
    // this.label.destroy();
    // this.indicator.destroy();
    super.destroy();
  }
}