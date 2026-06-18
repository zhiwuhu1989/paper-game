import Phaser from 'phaser';

export class Tree extends Phaser.GameObjects.Container {
  constructor(scene, x, y, texture) {
    super(scene, x, y);
    this.scene = scene;
    
    // 设置容器位置
    this.setPosition(x, y);
    
    // 创建树精灵（局部坐标 0,0）
    this.sprite = scene.add.image(0, 0, texture).setOrigin(0.5, 1);
    this.sprite.setDepth(y);
    
    // 将精灵添加到容器
    this.add(this.sprite);
  }

  getSprite() {
    return this; // 返回容器本身
  }

  destroy() {
    this.sprite.destroy();
    super.destroy();
  }
}
