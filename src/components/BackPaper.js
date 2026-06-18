/**
 * 背面纸张管理器组件
 * 负责管理所有方向的背面纸张，包括创建、更新位置和状态
 */
import Phaser from 'phaser';
import { BackPaperSingle } from './BackPaperSingle.js';

export class BackPaper extends Phaser.GameObjects.Container {
  /**
   * 构造函数
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {PaperContainer} paperContainer - 纸张容器引用
   * @param {number[][]} roadMap - 道路地图
   * @param {number} cell - 单元格大小
   * @param {Array} decorations - 装饰数据数组（用于背面显示）
   */
  constructor(scene, x, y, paperContainer, roadMap, cell, decorations = []) {
    super(scene, x, y);
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.paperContainer = paperContainer;
    this.roadMap = roadMap;
    this.cell = cell;
    this.decorations = decorations;
    
    // 存储各个方向的背面纸张实例
    this.backPapers = {};
    
    // 存储容器引用（保持向后兼容）
    this.bottomCon = {};
    this.elementCon = {};

    this.initPaper();
  }

  /**
   * 初始化所有方向的背面纸张
   */
  initPaper() {
    // 创建四个边缘方向的背面纸张（带道路和装饰）
    this.backPapers['left'] = this.createBackPaper('left', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);
    this.backPapers['top'] = this.createBackPaper('top', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);
    this.backPapers['right'] = this.createBackPaper('right', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);
    this.backPapers['bottom'] = this.createBackPaper('bottom', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);

    // 创建四个对角方向的背面纸张（带道路和装饰）
    this.backPapers['topLeft'] = this.createBackPaper('topLeft', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);
    this.backPapers['topRight'] = this.createBackPaper('topRight', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);
    this.backPapers['bottomLeft'] = this.createBackPaper('bottomLeft', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);
    this.backPapers['bottomRight'] = this.createBackPaper('bottomRight', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);

    // 创建中间背面纸张（默认隐藏，带道路和装饰）
    this.backPapers['mid'] = this.createBackPaper('mid', this.roadMap, this.cell, this.decorations, this.paperContainer.paperData.backPaper);
    this.backPapers['mid'].visible = false;

    // 将所有背面纸张添加到容器中
    Object.values(this.backPapers).forEach(paper => {
      this.add(paper);
    });
  }

  /**
   * 创建单个方向的背面纸张
   * @param {string} direction - 方向
   * @param {number[][]} roadMap - 道路地图
   * @param {number} cell - 单元格大小
   * @param {Array} decorations - 装饰数据（可选，默认为空数组）
   * @param {string} backPaper - 背景纹理名称（可选，默认为'back'）
   * @returns {BackPaperSingle}
   */
  createBackPaper(direction, roadMap, cell, decorations = [], backPaper = 'back') {
    // 使用 BackPaperSingle 创建单个方向的背面纸张，传递道路、单元格大小、装饰数据和背景纹理
    const backPaperSingle = new BackPaperSingle(this.scene, 0, 0, direction, roadMap, cell, decorations, backPaper);
    
    // 保存容器引用（保持向后兼容）
    this.bottomCon[direction] = backPaperSingle.getBottomContainer();
    this.elementCon[direction] = backPaperSingle.getElementContainer();
    
    return backPaperSingle;
  }

  /**
   * 更新所有背面纸张的位置
   */
  updatePos() {
    const paperContainer = this.paperContainer;
    
    // 上下左右四个方向
    this.backPapers['left'].x = paperContainer.foldLeft;
    this.backPapers['top'].y = paperContainer.foldTop;
    this.backPapers['right'].x = -paperContainer.foldRight;
    this.backPapers['bottom'].y = -paperContainer.foldBottom;

    // 左上对角
    this.backPapers['topLeft'].x = paperContainer.foldTopLeft;
    this.backPapers['topLeft'].y = paperContainer.foldTopLeft;
    
    // 右上对角
    this.backPapers['topRight'].x = -paperContainer.foldTopRight;
    this.backPapers['topRight'].y = paperContainer.foldTopRight;

    // 左下对角
    this.backPapers['bottomLeft'].x = paperContainer.foldBottomLeft;
    this.backPapers['bottomLeft'].y = -paperContainer.foldBottomLeft;

    // 右下对角
    this.backPapers['bottomRight'].x = -paperContainer.foldBottomRight;
    this.backPapers['bottomRight'].y = -paperContainer.foldBottomRight;
  }

  /**
   * 设置中间纸张的可见状态
   * @param {boolean} isLook - 是否可见
   */
  setLookState(isLook) {
    this.backPapers['mid'].visible = isLook;
  }

  /**
   * 获取指定方向的背面纸张
   * @param {string} direction - 方向
   * @returns {BackPaperSingle | null}
   */
  getBackPaper(direction) {
    return this.backPapers[direction] || null;
  }

  /**
   * 获取所有装饰元素（从中间纸张获取）
   * @returns {Array}
   */
  getDecorElements() {
    const midPaper = this.backPapers['mid'];
    return midPaper ? midPaper.getDecorElements() : [];
  }
}