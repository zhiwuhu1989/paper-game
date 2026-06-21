import Phaser from 'phaser';
import {
  PAPER_WIDTH,
  PAPER_HEIGHT,
  DECOR_TYPES,
  CELL_SIZE,
  NPC_CONFIG
} from '../config/gameConfig.js';
import { DecoElement } from '../entities/DecoElement.js';
import { RoadMap } from './RoadMap.js';
import { House } from '../entities/House.js';
import { NPC } from '../entities/NPC.js';

export class FrontPaper extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number[][]} roadMap - 道路地图
   * @param {number} cell - 单元格大小
   * @param {PaperContainer} paperContainer - 纸张容器引用
   * @param {Array} decorations - 装饰配置数组（从 gameConfig 传入）
   * @param {Array} houses - 房屋配置数组（可选）
   * @param {Array} npcs - NPC配置数组（可选）
   */
  constructor(scene, x, y, roadMap, cell, paperContainer, decorations = [], houses = [], npcs = []) {
    super(scene, x, y);
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.roadMap = roadMap;
    this.cell = cell;
    this.paperContainer = paperContainer;
    this.decorations = decorations;
    this.houses = houses;
    this.npcs = npcs;
    
    // 隐藏道路的引用
    this.hiddenRoadElements = [];
    
    this.initPaper();
    this.initRoad();
    this.initElements();
    this.initHouses();
    this.initNPCs();
  }

  /**
   * 初始化房屋
   */
  initHouses() {
    this.houseInstances = [];
    
    this.houses.forEach(houseConfig => {
      // 计算房屋位置（像素坐标）
      const worldPos = this.getTileWorldPosition(houseConfig.tile.x, houseConfig.tile.y);
      // 创建 House 实例，添加到元素容器中
      const house = new House(this.scene, worldPos.x, worldPos.y, houseConfig);
      this.houseInstances.push(house);
      this.elementContainer.add(house.getSprite());
    });
  }

  /**
   * 初始化 NPC
   */
  initNPCs() {
    this.npcInstances = [];
    
    this.npcs.forEach(npcConfig => {
      // 计算 NPC 位置（像素坐标）
      const worldPos = this.getTileWorldPosition(npcConfig.tile.x, npcConfig.tile.y);
      // 创建 NPC 实例，添加到元素容器中
      const npc = new NPC(this.scene, worldPos.x, worldPos.y, npcConfig);
      this.npcInstances.push(npc);
      this.elementContainer.add(npc.getSprite());
    });
  }

  /**
   * 获取格子对应的世界坐标
   * @param {number} tileX - 格子X坐标
   * @param {number} tileY - 格子Y坐标
   * @returns {{x: number, y: number}} - 世界坐标
   */
  getTileWorldPosition(tileX, tileY) {
    return {
      x: this.x + tileX * this.cell + this.cell / 2,
      y: this.y + tileY * this.cell + this.cell / 2
    };
  }

  initPaper() {
    this.bottomContainer = this.scene.add.container(0, 0);
    this.bottomContainer.setSize(PAPER_WIDTH, PAPER_HEIGHT);

    // 尝试创建序列动画，如果序列帧纹理不可用则回退到静态图片
    this.createFrontPaperBackground();

    this.elementContainer = this.scene.add.container(0, 0);
    this.elementContainer.setSize(PAPER_WIDTH, PAPER_HEIGHT);

    this.bottomContainer.setDepth(1);
    this.elementContainer.setDepth(3);

    this.add(this.bottomContainer);
    this.add(this.elementContainer);
  }

  /**
   * 创建正面纸张背景（支持序列动画和静态图片两种模式）
   */
  createFrontPaperBackground() {
    const paperData = this.paperContainer.paperData;
    
    // 检查序列帧纹理是否可用（检查第一帧）
    const hasAnimationFrames = this.scene.textures.exists('bg_default_0005');
    
    if (hasAnimationFrames) {
      // 使用序列动画
      this.createFrontPaperAnimation();
    } else {
      // 使用静态图片
      const frontImg = this.scene.add.image(0, 0, paperData.frontPaper).setOrigin(0, 0);
      frontImg.setDisplaySize(PAPER_WIDTH, PAPER_HEIGHT);
      this.bottomContainer.add(frontImg);
      frontImg.setDepth(1);
    }
  }

  /**
   * 创建正面纸张序列动画
   */
  createFrontPaperAnimation() {
    // 加载序列帧纹理（default_0005 到 default_0240，共48帧）
    const frameCount = 48;
    const frames = [];
    
    for (let i = 0; i < frameCount; i++) {
      const frameNum = String(5 + i * 5).padStart(4, '0'); // 从 0005 开始
      const textureKey = `bg_default_${frameNum}`;
      
      if (this.scene.textures.exists(textureKey)) {
        frames.push({ key: textureKey });
      }
    }
    
    // 确保有足够的帧
    if (frames.length === 0) {
      // 回退到静态图片
      const frontImg = this.scene.add.image(0, 0, this.paperContainer.paperData.frontPaper).setOrigin(0, 0);
      frontImg.setDisplaySize(PAPER_WIDTH, PAPER_HEIGHT);
      this.bottomContainer.add(frontImg);
      frontImg.setDepth(1);
      return;
    }
    
    // 创建精灵并播放动画（使用第一帧作为初始纹理）
    this.frontPaperSprite = this.scene.add.sprite(0, 0, frames[0].key).setOrigin(0, 0);
    this.frontPaperSprite.setDisplaySize(PAPER_WIDTH, PAPER_HEIGHT);
    this.bottomContainer.add(this.frontPaperSprite);
    this.frontPaperSprite.setDepth(1);
    
    // 定义并播放动画
    if (!this.scene.anims.exists('front_paper_anim')) {
      this.scene.anims.create({
        key: 'front_paper_anim',
        frames: frames,
        frameRate: 6, // 每秒12帧（调慢2倍）
        repeat: -1,    // 无限循环
        yoyo: false    // 不往返播放
      });
    }
    
    this.frontPaperSprite.anims.play('front_paper_anim');
  }

  /**
   * 使用 RoadMap 类初始化道路
   */
  initRoad() {
    // 创建 RoadMap 实例，将道路渲染委托给 RoadMap 类处理
    this.roadMapInstance = new RoadMap(this.scene, 0, 0, this.roadMap, this.cell, this.paperContainer);
    this.roadMapInstance.setDepth(2);
    // 将 RoadMap 添加到底部容器中
    this.bottomContainer.add(this.roadMapInstance);
  }

  /**
   * 从配置初始化装饰元素
   */
  initElements() {
    this.elements = [];
    
    // 遍历配置中的装饰数据，创建对应的 DecoElement
    this.decorations.forEach(decorData => {
      // 跳过隐藏道路（单独处理）
      if (decorData.type === DECOR_TYPES.HIDDEN_ROAD) {
        this.initHiddenRoad(decorData);
        return;
      }
      
      // 根据类型设置默认属性
      const defaultProps = this.getDefaultDecorProps(decorData.type);
      
      // 创建 DecoElement，传递 paperContainer 引用用于修复后更新道路
      const decoElement = new DecoElement(this.scene, {
        type: decorData.type,
        name: decorData.name || null,
        // 将格子坐标转换为像素坐标
        x: decorData.x * this.cell + this.cell / 2,
        y: decorData.y * this.cell + this.cell / 2,
        texture: decorData.texture || defaultProps.texture,
        good: decorData.good || null,
        // 其他属性
        rotation: decorData.rotation || 0,
        width: decorData.width || defaultProps.width,
        height: decorData.height || defaultProps.height,
        alpha: decorData.alpha !== undefined ? decorData.alpha : defaultProps.alpha,
        // 修复条件（仅 REPAIR 类型有）
        repairCondition: decorData.repairCondition || null,
        // 修复后填充道路的格子坐标数组（仅 REPAIR 类型有）
        fillRoad: decorData.fillRoad || null,
        // 其他自定义属性
        state: decorData.state || 'normal',
        // 像素级偏移
        offsetX: decorData.offsetX || 0,
        offsetY: decorData.offsetY || 0
      }, this.paperContainer);
      
      this.elements.push(decoElement);
      this.elementContainer.add(decoElement.getSprite());
    });
  }

  /**
   * 初始化隐藏道路元素
   * @param {object} decorData - 隐藏道路配置
   */
  initHiddenRoad(decorData) {
    const hiddenRoad = {
      name: decorData.name,
      roadCells: decorData.roadCells || [],
      visible: decorData.visible || false,
      graphics: null
    };
    
    // 创建隐藏道路的图形（使用道路纹理填充格子）
    hiddenRoad.graphics = this.scene.add.graphics();
    hiddenRoad.graphics.setDepth(2);
    
    if (hiddenRoad.visible) {
      // 如果初始可见，显示道路
      this.drawHiddenRoad(hiddenRoad);
    } else {
      hiddenRoad.graphics.clear();
    }
    
    // 添加到底部容器中
    this.bottomContainer.add(hiddenRoad.graphics);
    
    this.hiddenRoadElements.push(hiddenRoad);
  }

  /**
   * 绘制隐藏道路
   * @param {object} hiddenRoad - 隐藏道路元素
   */
  drawHiddenRoad(hiddenRoad) {
    hiddenRoad.graphics.clear();
    hiddenRoad.graphics.lineStyle(1, 0x8B4513, 0.5); // 道路颜色
    
    hiddenRoad.roadCells.forEach(cell => {
      const x = cell.x * this.cell;
      const y = cell.y * this.cell;
      hiddenRoad.graphics.fillStyle(0x8B4513, 0.6); // 棕色半透明
      hiddenRoad.graphics.fillRect(x, y, this.cell, this.cell);
      hiddenRoad.graphics.strokeRect(x, y, this.cell, this.cell);
    });
  }

  /**
   * 显示隐藏道路
   * @param {string} name - 隐藏道路名称
   */
  showHiddenRoad(name) {
    const hiddenRoad = this.hiddenRoadElements.find(hr => hr.name === name);
    if (hiddenRoad && !hiddenRoad.visible) {
      hiddenRoad.visible = true;
      
      // 绘制道路
      // this.drawHiddenRoad(hiddenRoad);
      
      // 更新道路地图
      if (this.paperContainer) {
        this.paperContainer.fillRoadWithCells(hiddenRoad.roadCells);
      }
      
      // 显示动画
      this.scene.tweens.add({
        targets: hiddenRoad.graphics,
        alpha: { from: 0, to: 1 },
        duration: 500
      });
      
      console.log(`隐藏道路已显示: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 隐藏指定名称的装饰元素
   * @param {string} name - 装饰元素名称
   */
  hideDecoElement(name) {
    const element = this.elements.find(el => el.name === name);
    if (element) {
      // 隐藏装饰元素（设置透明度为0或设置visible为false）
      if (element.sprite) {
        this.scene.tweens.add({
          targets: element.sprite,
          alpha: 0,
          duration: 300
        });
      }
      // 如果是容器，也隐藏容器
      if (element.container) {
        element.container.visible = false;
      }
      console.log(`装饰元素已隐藏: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 获取装饰类型的默认属性
   * @param {string} type - 装饰类型
   * @returns {object} - 默认属性
   */
  getDefaultDecorProps(type) {
    const cell = this.cell;
    switch (type) {
      case DECOR_TYPES.TREE:
        return {
          texture: 'tree',
          width: cell * 1.5,
          height: cell * 1.5,
          alpha: 1
        };
      case DECOR_TYPES.REPAIR:
        return {
          texture: 'tree',
          width: cell * 1.8,
          height: cell,
          alpha: 0.5  // 损坏状态半透明
        };
      case DECOR_TYPES.NPC:
        return {
          texture: 'npc',
          width: cell,
          height: cell,
          alpha: 1
        };
      case DECOR_TYPES.HOUSE:
        return {
          texture: 'house',
          width: cell * 2,
          height: cell * 2,
          alpha: 1
        };
      default:
        return {
          texture: 'default',
          width: cell,
          height: cell,
          alpha: 1
        };
    }
  }

  /**
   * 检查所有需要修复的装饰是否满足修复条件
   */
  checkRepair() {
    // 获取当前纸张的折叠状态（转换为格子数）
    const foldState = this.getFoldStateInCells();
    
    for (let i = 0; i < this.elements.length; i++) {
      if (this.elements[i].decoData.type === DECOR_TYPES.REPAIR) {
        this.elements[i].checkRepair(foldState);
      }
    }
  }

  /**
   * 获取当前折叠状态（转换为格子数）
   * @returns {object} - 各方向的折叠格子数
   */
  getFoldStateInCells() {
    if (!this.paperContainer) {
      return {};
    }
    
    const cellSize = CELL_SIZE;
    return {
      left: Math.floor(this.paperContainer.foldLeft / cellSize),
      right: Math.floor(this.paperContainer.foldRight / cellSize),
      top: Math.floor(this.paperContainer.foldTop / cellSize),
      bottom: Math.floor(this.paperContainer.foldBottom / cellSize),
      topLeft: Math.floor(this.paperContainer.foldTopLeft / cellSize),
      topRight: Math.floor(this.paperContainer.foldTopRight / cellSize),
      bottomLeft: Math.floor(this.paperContainer.foldBottomLeft / cellSize),
      bottomRight: Math.floor(this.paperContainer.foldBottomRight / cellSize)
    };
  }
}