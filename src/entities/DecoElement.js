import Phaser from 'phaser';

export class DecoElement extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {object} data - 装饰数据
   * @param {object} paperContainer - 纸张容器引用（用于修复后更新道路）
   */
  constructor(scene, data, paperContainer = null) {
    super(scene, data.x, data.y);
    this.scene = scene;
    this.decoData = data; // 使用 decoData 避免与 Phaser 内置的 data 属性冲突
    this.name = data.name || ''; // 保存装饰元素名称（默认为空字符串，避免覆盖 Phaser 内置属性）
    this.paperContainer = paperContainer;
    
    // 应用偏移（默认 0）
    const offsetX = data.offsetX || 0;
    const offsetY = data.offsetY || 0;
    
    // 设置容器位置（包含偏移）
    this.setPosition(data.x + offsetX, data.y + offsetY);
    
    // 创建装饰精灵（局部坐标 0,0）
    this.sprite = scene.add.image(0, 0, data.texture).setOrigin(0.5, 0.5);
    this.sprite.setRotation(data.rotation || 0); // 旋转角度（弧度）
    this.sprite.setDisplaySize(data.width, data.height);
    
    // 将精灵添加到容器
    this.add(this.sprite);
    
    // 修复相关属性
    this.isRepaired = false;
    // 修复条件：需要折叠的方向和最小折叠量（以格子数为单位）
    this.repairCondition = data.repairCondition || null;
    // 修复后填充道路的格子坐标数组
    this.fillRoad = data.fillRoad || null;
  }

  getSprite() {
    return this; // 返回容器本身
  }

  /**
   * 检查是否满足修复条件
   * @param {object} foldState - 当前折叠状态对象，包含各方向的折叠量
   * @returns {boolean} - 是否满足修复条件
   */
  checkRepair(foldState = null) {
    // 如果已经修复，直接返回
    if (this.isRepaired) {
      return true;
    }

    // 如果不是 REPAIR 类型，不需要修复检查
    if (this.decoData.type !== 'repair') {
      return false;
    }

    // 如果没有配置修复条件，默认修复（保持向后兼容）
    if (!this.repairCondition) {
      this.doRepair();
      return true;
    }

    // 如果提供了折叠状态，检查是否满足修复条件
    if (foldState) {
      const conditions = this.repairCondition;
      let allConditionsMet = true;

      // 检查每个方向的折叠条件
      for (const [direction, requiredFold] of Object.entries(conditions)) {
        const currentFold = foldState[direction] || 0;
        // 检查当前折叠量是否达到要求（requiredFold 是格子数）
        if (currentFold < requiredFold) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        this.doRepair();
        return true;
      }
    }

    // 未满足条件，保持损坏状态
    return false;
  }

  /**
   * 执行修复操作：更换为好的纹理
   */
  doRepair() {
    this.isRepaired = true;
    
    // 如果配置了 good 纹理，则更换
    if (this.decoData.good) {
      this.sprite.setTexture(this.decoData.good);
      this.sprite.setDisplaySize(this.decoData.width, this.decoData.height);
      this.sprite.setAlpha(1); // 恢复完全不透明
    }
    
    // 如果配置了 fillRoad，则更新道路地图
    if (this.fillRoad && this.paperContainer) {
      this.paperContainer.fillRoadWithCells(this.fillRoad);
    }
  }

  /**
   * 获取修复状态
   * @returns {boolean}
   */
  getRepairedState() {
    return this.isRepaired;
  }

  /**
   * 重置修复状态
   */
  resetRepair() {
    this.isRepaired = false;
  }

  destroy() {
    this.sprite.destroy();
    super.destroy();
  }
}
