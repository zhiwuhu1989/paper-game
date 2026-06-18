// src/utils/worldManager.js
import { WORLD_CONFIG, PAPER_TEMPLATES } from '../config/gameConfig.js';

/**
 * 大世界管理器类
 * 负责管理多张纸张的静态配置、地图矩阵数据访问、以及状态同步
 */
export class WorldManager {
  /**
   * 构造函数
   * @param {Phaser.Scene} scene - 场景引用 (GameScene)
   * @param {object} config - 世界总配置 (WORLD_CONFIG)
   */
  constructor(scene, config) {
    this.scene = scene;
    this.worldConfig = config || WORLD_CONFIG;
    this.paperTemplates = PAPER_TEMPLATES;
    this.papers = {};           // 存储加工后的所有纸张运行时数据
    this.currentPaperId = null; // 当前活动/玩家所在的纸张ID
  }

  /**
   * 初始化世界管理器
   * @param {string} initialPaperId - 初始玩家诞生的纸张ID
   */
  init(initialPaperId) {
    // 1. 预加载并将所有纸张的数据展平
    this.preloadAllPapers();
    // 2. 设置当前初始纸张
    this.currentPaperId = initialPaperId || 'center';
  }

  /**
   * 预加载所有纸张数据
   * 根据 WORLD_CONFIG 中定义的所有纸张ID进行遍历组装
   */
  preloadAllPapers() {
    if (!this.worldConfig || !this.worldConfig.papers) {
      console.error("【错误】WorldManager 找不到合法的 WORLD_CONFIG 纸张配置！");
      return;
    }
    
    const paperIds = Object.keys(this.worldConfig.papers);
    paperIds.forEach(paperId => {
      this.loadPaper(paperId);
    });
  }

  /**
   * 组装单张纸的数据结构，将模板上的 roadMap 与配置中的专属装饰物融合
   * @param {string} paperId - 纸张ID
   */
  loadPaper(paperId) {
    const paperConfig = this.worldConfig.papers[paperId];
    if (!paperConfig) return;

    // 根据配置里的 template 字符串（例如 'fullRoad'），获取底层的网格数据
    const templateName = paperConfig.template;
    const templateData = this.paperTemplates[templateName] || { roadMap: [] };

    // 组装成一个完整的、供外界（如寻路、容器绘制）方便直接使用的运行时对象
    this.papers[paperId] = {
      id: paperId,
      config: paperConfig,
      position: paperConfig.position, // 九宫格网格坐标，如 {x: 0, y: 0}
      roadMap: templateData.roadMap,   // 2D 道路地图矩阵
      backRoadMap: templateData.backRoadMap, // 反面路图
      frontDecorations: templateData.frontDecorations || [], // 正面装饰（树、可修复装饰等）
      backDecorations: templateData.backDecorations || [], // 背面装饰
      frontPaper: templateData.frontPaper, // 正面纸张
      backPaper: templateData.backPaper, // 背面纸张
    };
  }

  /**
   * 【核心同步】当玩家跨纸移动成功或镜头改变后，显式调用此方法同步状态
   * @param {string} paperId - 新的当前纸张 ID
   */
  setCurrentPaperId(paperId) {
    if (this.papers[paperId]) {
      this.currentPaperId = paperId;
    } else {
      console.warn(`【警告】尝试设置当前纸张为未知的 ID: ${paperId}`);
    }
  }

  /**
   * 获取当前玩家踩着的纸张 ID
   * @returns {string}
   */
  getCurrentPaperId() {
    return this.currentPaperId;
  }

  /**
   * 获取指定纸张的完整组装数据（提供给 PaperContainer 绘制用）
   * @param {string} paperId - 纸张ID
   * @returns {object|null}
   */
  getPaperData(paperId) {
    return this.papers[paperId] || null;
  }

  /**
   * 获取指定纸张的邻居列表
   * @param {string} paperId - 纸张ID
   * @returns {string[]} - 邻居纸张ID数组
   */
  getNeighbors(paperId) {
    const paper = this.papers[paperId];
    if (!paper || !paper.config || !paper.config.neighbors) {
      return [];
    }
    return paper.config.neighbors;
  }

  /**
   * 获取当前活动纸张的邻居列表
   * @returns {string[]} - 邻居纸张ID数组
   */
  getCurrentNeighbors() {
    return this.getNeighbors(this.currentPaperId);
  }

  /**
   * 获取大世界配置里注册过的所有纸张 ID 列表（用于 GameScene 在循环中一次性 new 容器）
   * @returns {string[]} - 所有纸张ID数组
   */
  getAllPaperIds() {
    return Object.keys(this.papers);
  }

  /**
   * 获取指定纸张在九宫格布局里的相对网格位置
   * @param {string} paperId - 纸张ID
   * @returns {{x: number, y: number} | null} - 位置坐标，如 {x: 1, y: -1}
   */
  getPaperPosition(paperId) {
    const paper = this.papers[paperId];
    if (!paper) return null;
    return paper.position;
  }

  /**
   * 计算目标纸张相对于当前纸张的相对网格位移
   * @param {string} targetPaperId - 目标纸张ID
   * @returns {{x: number, y: number} | null} - 相对偏移向量
   */
  getOffsetToTarget(targetPaperId) {
    const currentPos = this.getPaperPosition(this.currentPaperId);
    const targetPos = this.getPaperPosition(targetPaperId);

    if (!currentPos || !targetPos) return null;

    return {
      x: targetPos.x - currentPos.x,
      y: targetPos.y - currentPos.y
    };
  }

  /**
   * 根据大世界九宫格相对坐标，反查它是哪一张纸的 ID
   * @param {number} gridX - 大世界相对X
   * @param {number} gridY - 大世界相对Y
   * @returns {string|null} - 找到的纸张ID，未找到返回 null
   */
  getPaperIdByPosition(gridX, gridY) {
    const foundId = Object.keys(this.papers).find(paperId => {
      const pos = this.papers[paperId].position;
      return pos.x === gridX && pos.y === gridY;
    });
    return foundId || null;
  }
}