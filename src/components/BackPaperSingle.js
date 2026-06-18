/**
 * 单个方向的背面纸张组件
 * 负责处理单个折叠方向的背面纸张渲染和变换
 */
import Phaser from 'phaser';
import { 
  PAPER_WIDTH, 
  PAPER_HEIGHT,
  CELL_SIZE,
  DECOR_TYPES
} from '../config/gameConfig.js';
import { DecoElement } from '../entities/DecoElement.js';
import { RoadMap } from './RoadMap.js';

export class BackPaperSingle extends Phaser.GameObjects.Container {
  /**
   * 构造函数
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} direction - 折叠方向（left/right/top/bottom/topLeft/topRight/bottomLeft/bottomRight/mid）
   * @param {number[][]} roadMap - 道路地图
   * @param {number} cell - 单元格大小
   * @param {Array} decorations - 装饰数据数组（可选）
   * @param {string} backPaper - 背景纹理名称（可选）
   */
  constructor(scene, x, y, direction, roadMap, cell, decorations = [], backPaper = 'back') {
    super(scene, x, y);
    this.scene = scene;
    this.direction = direction;
    this.roadMap = roadMap;
    this.cell = cell;
    this.decorations = decorations;
    this.backPaper = backPaper; // 背景纹理
    
    // 子容器
    this.content = null;
    this.bottomContainer = null;
    this.elementContainer = null;
    
    // 装饰元素列表
    this.decorElements = [];
    
    // 道路地图实例
    this.roadMapInstance = null;
    
    this.init();
  }

  /**
   * 初始化组件
   */
  init() {
    // 创建内容容器
    this.content = this.scene.add.container(0, 0);
    this.content.setSize(PAPER_WIDTH, PAPER_HEIGHT);
    
    // 创建底部容器（放置背景和道路）
    this.bottomContainer = this.scene.add.container(0, 0);
    this.bottomContainer.setSize(PAPER_WIDTH, PAPER_HEIGHT);
    this.bottomContainer.setDepth(1);
    
    // 创建元素容器（放置装饰等）
    this.elementContainer = this.scene.add.container(0, 0);
    this.elementContainer.setSize(PAPER_WIDTH, PAPER_HEIGHT);
    this.elementContainer.setDepth(3);
    
    // 添加子容器到内容容器
    this.content.add(this.bottomContainer);
    this.content.add(this.elementContainer);
    
    // 添加背景图片
    this.createBackground();
    
    // 初始化道路
    this.initRoad();
    
    // 初始化装饰元素
    this.initDecorations();
    
    // 设置方向变换
    this.setDirectionTransform();
    
    // 添加内容到自身
    this.add(this.content);
    
    // 设置深度
    this.setDepth(4);
  }

  /**
   * 创建背景图片
   */
  createBackground() {
    const bg = this.scene.add.image(0, 0, this.backPaper); // 使用传入的背景纹理
    bg.setOrigin(0);
    bg.setDisplaySize(PAPER_WIDTH, PAPER_HEIGHT);
    this.bottomContainer.add(bg);
  }

  /**
   * 初始化道路
   */
  initRoad() {
    if (this.roadMap && this.cell) {
      this.roadMapInstance = new RoadMap(this.scene, 0, 0, this.roadMap, this.cell, this);
      this.bottomContainer.add(this.roadMapInstance);
    }
  }

  /**
   * 初始化装饰元素（背面装饰，无修复逻辑）
   */
  initDecorations() {
    // 遍历装饰数据，为每个装饰创建 DecoElement
    this.decorations.forEach(decorData => {
      const defaultProps = this.getDefaultDecorProps(decorData.type);
      
      const decoElement = new DecoElement(this.scene, {
        type: decorData.type || 'default',
        name: decorData.name || null,
        // 将格子坐标转换为像素坐标
        x: decorData.x * this.cell + this.cell / 2,
        y: decorData.y * this.cell + this.cell / 2,
        texture: decorData.texture || defaultProps.texture,
        rotation: decorData.rotation || 0,
        width: decorData.width || defaultProps.width,
        height: decorData.height || defaultProps.height,
        alpha: decorData.alpha !== undefined ? decorData.alpha : defaultProps.alpha,
        // 像素级偏移
        offsetX: decorData.offsetX || 0,
        offsetY: decorData.offsetY || 0
        // 背面装饰不需要 repairCondition，因为背面没有修复逻辑
      });
      
      this.decorElements.push(decoElement);
      this.elementContainer.add(decoElement.getSprite());
    });
  }

  /**
   * 获取装饰类型的默认属性
   * @param {string} type - 装饰类型
   * @returns {object} - 默认属性
   */
  getDefaultDecorProps(type) {
    const cell = this.cell || CELL_SIZE;
    switch (type) {
      case DECOR_TYPES.TREE:
        return {
          texture: 'tree',
          width: cell * 1.5,
          height: cell * 1.5,
          alpha: 1
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
   * 根据方向设置变换（缩放、旋转、位置）
   */
  setDirectionTransform() {
    switch (this.direction) {
      case 'left':
        this.content.scaleX = -1;
        this.content.x = 0;
        break;
      case 'right':
        this.content.scaleX = -1;
        this.content.x = 2 * PAPER_WIDTH;
        break;
      case 'top':
        this.content.scaleY = -1;
        this.content.y = 0;
        break;
      case 'bottom':
        this.content.scaleY = -1;
        this.content.y = 2 * PAPER_HEIGHT;
        break;
      case 'topLeft':
        this.content.scaleX = -1;
        this.content.rotation = Math.PI / 2;
        this.content.setPosition(0, 0);
        break;
      case 'topRight':
        this.content.scaleY = -1;
        this.content.rotation = Math.PI / 2;
        this.content.setPosition(PAPER_WIDTH, -PAPER_HEIGHT);
        break;
      case 'bottomLeft':
        this.content.scaleY = -1;
        this.content.rotation = Math.PI / 2;
        this.content.setPosition(-PAPER_WIDTH, PAPER_HEIGHT);
        break;
      case 'bottomRight':
        this.content.scaleX = -1;
        this.content.rotation = Math.PI / 2;
        this.content.setPosition(2 * PAPER_WIDTH, 2 * PAPER_HEIGHT);
        break;
      case 'mid':
        // 中间纸张不需要特殊变换
        break;
    }
  }

  /**
   * 获取底部容器（用于添加背景相关元素）
   * @returns {Phaser.GameObjects.Container}
   */
  getBottomContainer() {
    return this.bottomContainer;
  }

  /**
   * 获取元素容器（用于添加道路、装饰等）
   * @returns {Phaser.GameObjects.Container}
   */
  getElementContainer() {
    return this.elementContainer;
  }

  /**
   * 获取方向
   * @returns {string}
   */
  getDirection() {
    return this.direction;
  }

  /**
   * 获取所有装饰元素
   * @returns {Array}
   */
  getDecorElements() {
    return this.decorElements;
  }

  /**
   * 获取道路地图实例
   * @returns {RoadMap | null}
   */
  getRoadMap() {
    return this.roadMapInstance;
  }
}