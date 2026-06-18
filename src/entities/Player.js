import Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, radius, color) {
    super(scene, x, y);
    this.scene = scene;
    this.currentTile = null;
    
    this.setPosition(x, y);
    this.setDepth(2000);
    
    scene.add.existing(this);
    
    // 创建玩家 Sprite（使用序列帧）
    this.sprite = scene.add.sprite(0, 0, 'player_frame_1').setOrigin(0.5, 0.9);
    this.sprite.setDisplaySize(82, 99);
    
    // 创建行走动画（使用独立图片纹理）
    scene.anims.create({
      key: 'player_walk',
      frames: [
        { key: 'player_frame_1' },
        { key: 'player_frame_2' },
        { key: 'player_frame_3' },
        { key: 'player_frame_4' },
        { key: 'player_frame_5' },
        { key: 'player_frame_6' },
        { key: 'player_frame_7' }
      ],
      frameRate: 30,
      repeat: -1
    });
    
    // 默认显示第一帧（站立不动）
    this.sprite.setTexture('player_frame_1');
    
    this.add(this.sprite);
    
    this.tweens = scene.tweens;
    this.isMoving = false;
  }

  moveTo(worldX, worldY, duration, onComplete) {
    this.isMoving = true;
    
    // 切换到行走动画
    this.sprite.play('player_walk');
    
    this.tweens.add({
      targets: this,
      x: worldX,
      y: worldY,
      duration: duration,
      onComplete: () => {
        this.isMoving = false;
        // 停止动画，显示第一帧（站立不动）
        this.sprite.stop();
        this.sprite.setTexture('player_frame_1');
        if (onComplete) onComplete();
      }
    });
  }

  getSprite() {
    return this;
  }

  getCurrentTile() {
    return this.currentTile;
  }

  setCurrentTile(tile) {
    this.currentTile = tile;
  }

  getWorldPosition() {
    return {
      x: this.x,
      y: this.y
    };
  }

  destroy() {
    this.sprite.destroy();
    super.destroy();
  }
}
