import Phaser from 'phaser';
import { DEBUG_CONFIG } from '../config/gameConfig.js';

export class RoadMap extends Phaser.GameObjects.Container {
  constructor(scene, x, y, raodMap, cell, paper) {
    super(scene, x, y);
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.roadMap = raodMap;
    this.cell = cell;
    this.paper = paper;
    this.roadImages = []; // 保存道路图片引用，用于去重
    
    this.initRoad();
  }

  initRoad() {
    for (let i = 0; i < this.roadMap.length; i++) {
        for (let j = 0; j < this.roadMap[i].length; j++) {
          if (this.roadMap[i][j] === 1) {
            const roadImg = this.scene.add.image(j * this.cell, i * this.cell, 'road').setOrigin(0, 0);
            roadImg.setDisplaySize(this.cell, this.cell);
            roadImg.setDepth(2);
            roadImg.setAlpha(DEBUG_CONFIG.showTileNumbers ? 0.5 : 0); // 设置透明度为 0.2
            this.add(roadImg);
            
            // 根据调试配置决定是否显示格子坐标
            if (DEBUG_CONFIG.showTileNumbers) {
              let guideText = this.scene.add.text(0, 0, j + ',' + i, {
                    fontSize: '14px',
                    fontFamily: 'Microsoft YaHei',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3,
                    align: 'center'
                  }).setOrigin(0, 0).setDepth(1);
              guideText.setPosition(j * this.cell + this.cell / 2, i * this.cell + this.cell / 2);
              this.add(guideText);
            }
            
            this.roadImages.push(`${j},${i}`); // 记录已创建的道路格子
          }
        }
      }
  }

  /**
   * 更新道路显示：检查并为新成为道路的格子创建图片
   */
  updateRoads() {
    // 检查场景是否存在
    if (!this.scene || !this.scene.add) {
      return;
    }
    
    for (let i = 0; i < this.roadMap.length; i++) {
      for (let j = 0; j < this.roadMap[i].length; j++) {
        if (this.roadMap[i][j] === 1) {
          const key = `${j},${i}`;
          // 如果这个格子还没有道路图片，则创建
          if (!this.roadImages.includes(key)) {
            const roadImg = this.scene.add.image(j * this.cell, i * this.cell, 'road').setOrigin(0, 0);
            roadImg.setDisplaySize(this.cell, this.cell);
            roadImg.setDepth(2);
            roadImg.setAlpha(DEBUG_CONFIG.showTileNumbers ? 0.5 : 0);
            this.add(roadImg);
            this.roadImages.push(key);
          }
        }
      }
    }
  }
}