import Phaser from 'phaser';
import { Tree } from '../entities/Tree.js';
import {
  PAPER_WIDTH,
  PAPER_HEIGHT,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  DECOR_TYPES,
  EDGE_X_THRESHOLD,
  EDGE_Y_THRESHOLD,
  EDGE_ANGLE_THRESHOLD,
  FOLD_SNAP_THRESHOLD,
  HOUSE_CONFIG,
  NPC_CONFIG
} from '../config/gameConfig.js';
import { FrontPaper } from './FrontPaper.js';
import { BackPaper } from './BackPaper.js';
import { GuideLine } from './GuideLine.js';



export class PaperContainer extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene 主场景 (GameScene)
   * @param {number} x 世界坐标 X
   * @param {number} y 世界坐标 Y
   * @param {string} paperId 纸张唯一ID
   * @param {object} paperData 包含 roadMap 和 decorations 的数据
   * @param {string} [basePaperTexture='paper_2'] 底层纸张纹理名称
   */
  constructor(scene, x, y, paperId, paperData, basePaperTexture = 'paper_2') {
    super(scene, x, y);
    this.paperId = paperId;
    this.paperData = paperData; // 保存 paperData 引用
    this.roadMap = paperData.roadMap;
    this.backRoadMap = paperData.backRoadMap || Array.from({length: GRID_ROWS}, () => Array(GRID_COLS).fill(0));
    this.frontDecorationsData = paperData.frontDecorations;

    // 过滤属于该纸张的房屋配置
    this.housesData = Object.values(HOUSE_CONFIG).filter(house => house.paperId === paperId);
    
    // 过滤属于该纸张的 NPC 配置
    this.npcsData = Object.values(NPC_CONFIG).filter(npc => npc.paperId === paperId);

    // 有效路图：随折叠状态动态计算
    this.effectiveRoadMap = null;

    // 1. 初始化原始纸张的边界矩形（基于局部坐标系，左上角为 0,0）
    this.cell = CELL_SIZE;
    this.paperRect = new Phaser.Geom.Rectangle(0, 0, PAPER_WIDTH, PAPER_HEIGHT);

    // 创建背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xff0000, 0.5); // 红色，50% 透明
    bg.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT);
    // 放进 container（一定要先加，再 add 到 container）
    this.add(bg);  

    // 创建底层背景 sprite，直接添加到场景（而非 Container 内），避免受遮罩影响
    this.basePaper = this.scene.add.image(this.x, this.y, basePaperTexture)
      .setOrigin(0, 0)
      .setDisplaySize(PAPER_WIDTH, PAPER_HEIGHT)
      .setDepth(-1000);

    // 2. 保留你原本的折叠核心状态变量
    this.foldTop = 0; this.foldBottom = 0; this.foldLeft = 0; this.foldRight = 0;
    this.foldTopLeft = 0; this.foldTopRight = 0; this.foldBottomLeft = 0; this.foldBottomRight = 0;
    this.dragEdge = null;
    this.draggingFold = false;
    this.currentFoldEdge = null;
    this.guideEdge = null;
    this.isMoving = false;

    // 3.1 初始化纸张
    this.initPaper();
    // 3.2 初始化引导线
    this.initGuideLine();
    // 3.3 初始化道路
    // this.initRoad();

    // for (let i = 0; i < 10; i++) {
    //     for (let j = 0; j < 10; j++) {
    //         let guideText = this.scene.add.text(0, 0, i + ',' + j, {
    //               fontSize: '14px',
    //               fontFamily: 'Microsoft YaHei',
    //               color: '#ffffff',
    //               stroke: '#000000',
    //               strokeThickness: 3,
    //               align: 'center'
    //             }).setOrigin(0, 0).setDepth(1);
    //         guideText.setPosition(j * this.cell, i * this.cell);
    //         this.add(guideText);
    //       }
    //     }
    
    this.decorGroup = [];
    // this.drawDecorations();

    // 4. 创建图形遮罩 (遮罩需要在大世界坐标系中定位，故设为当前容器的 this.x, this.y)
    // 1. 创建画笔（不需要加到场景显示列表中，它只做模板）
    this.maskGraphics = this.scene.make.graphics({ x: this.x, y: this.y, add: false });

    // 2. 创建几何遮罩（注意修正后的正确命名空间）
    this.geometryMask = new Phaser.Display.Masks.GeometryMask(this.scene, this.maskGraphics);

    // 3. 将遮罩应用给当前纸张容器本身
    this.setMask(this.geometryMask);

    // 5. 初始化首次形状（展开状态）
    this.updateMask();

    // 6. 计算初始有效路图
    this.calculateEffectiveRoadMap();

    scene.add.existing(this);

    this.sort('depth');
  }

  initPaper() {
    // 获取背面装饰数据
    const backDecorations = this.paperData.backDecorations || [];
    
    // 获取正面装饰数据
    const frontDecorations = this.paperData.frontDecorations || [];
    
    this.backPaper = new BackPaper(this.scene, 0, 0, this, this.backRoadMap, this.cell, backDecorations);
    this.frontPaper = new FrontPaper(this.scene, 0, 0, this.roadMap, this.cell, this, frontDecorations, this.housesData, this.npcsData);

    this.add(this.frontPaper);
    this.add(this.backPaper);

    this.backPaper.setDepth(4);
    this.frontPaper.setDepth(0);
  }

    initRoad() {
      const map = this.scene.make.tilemap({
        data: this.roadMap,
        tileWidth: this.cell,
        tileHeight: this.cell
      });
      const tiles = map.addTilesetImage('tiles');
      this.mapLayer = map.createLayer(0, tiles, this.x, this.y);
      this.mapLayer.setOrigin(0, 0);
      this.add(this.mapLayer);
      this.mapLayer.setDepth(2);
  }

  drawDecorations() {
    if (!this.frontDecorationsData) return;
    this.frontDecorationsData.forEach(decor => {
      const rx = decor.x * this.cell + this.cell / 2;
      const ry = decor.y * this.cell + this.cell / 2;
      if (decor.type === 'tree') {
        const tree = new Tree(this.scene, rx, ry, 'tree');
        tree.getSprite().setDisplaySize(this.cell * 1.5, this.cell * 1.5);
        tree.getSprite().setDepth(3);
        this.add(tree.getSprite());
        this.decorGroup.push(tree);
      } else if (decor.type === 'badBridge') {        // 坏桥：红色半透明矩形 + X 标记（支持多格）
        const g = this.scene.add.graphics();        const w = decor.width || 1;
        const h = decor.height || 1;
        const pad = 4;
        const bx = decor.x * this.cell + pad;
        const by = decor.y * this.cell + pad;
        const bw = w * this.cell - pad * 2;
        const bh = h * this.cell - pad * 2;
        // 红色半透明背景
        g.fillStyle(0xff3333, 0.6);
        g.fillRect(bx, by, bw, bh);
        // X 标记（白色线条）
        g.lineStyle(3, 0xffffff, 0.9);
        g.beginPath();
        g.moveTo(bx + 6, by + 6);
        g.lineTo(bx + bw - 6, by + bh - 6);
        g.moveTo(bx + bw - 6, by + 6);
        g.lineTo(bx + 6, by + bh - 6);
        g.strokePath();
        g.setDepth(3);
        this.add(g);
        this.decorGroup.push(g);
      }
    });
  }

  initGuideLine() {
    this.guideLine = new GuideLine(this.scene, 0, 0, this);
  }

  // 获取该纸张上某网格的绝对世界坐标
  getTileWorldPosition(tileX, tileY) {
    return {
      x: this.x + tileX * this.cell + this.cell / 2,
      y: this.y + tileY * this.cell + this.cell / 2
    };
  }

  // 获取该纸张上某网格的局部坐标（纸张容器内）
  getTilePosition(tileX, tileY) {
    return {
      x: tileX * this.cell + this.cell / 2,
      y: tileY * this.cell + this.cell / 2
    };
  }

  updateMask() {
    const r = this.paperRect;

    const rx = r.x;
    const ry = r.y;
    const left = r.left;
    const right = r.right;
    const top = r.top;
    const bottom = r.bottom;

    this.backPaper.updatePos();

    this.maskGraphics.clear();
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.beginPath();

    // --- 1. 左上角 ---
    // 点 A (顶部边缘上的点)
    this.maskGraphics.moveTo(rx + this.foldTopLeft, top + this.foldTop/2); 

    // --- 2. 右上角 ---
    // 点 B (顶部边缘上的点)
    this.maskGraphics.lineTo(right - this.foldTopRight, top + this.foldTop/2);
    // 点 C (右侧边缘上的点)
    this.maskGraphics.lineTo(right - this.foldRight/2, top + this.foldTopRight);

    // --- 3. 右下角 ---
    // 点 D (右侧边缘上的点)
    this.maskGraphics.lineTo(right - this.foldRight/2, bottom - this.foldBottomRight);
    // 点 E (底部边缘上的点)
    this.maskGraphics.lineTo(right - this.foldBottomRight, bottom - this.foldBottom/2);

    // --- 4. 左下角 ---
    // 点 F (底部边缘上的点)
    this.maskGraphics.lineTo(left + this.foldBottomLeft, bottom - this.foldBottom/2);
    // 点 G (左侧边缘上的点)
    this.maskGraphics.lineTo(left + this.foldLeft/2, bottom - this.foldBottomLeft);

    // --- 5. 回到左上角结束 ---
    // 点 H (左侧边缘上的点)
    this.maskGraphics.lineTo(left + this.foldLeft/2, top + this.foldTopLeft);

    this.maskGraphics.closePath();
    this.maskGraphics.fillPath();

    // 折叠状态变化后重算有效路图
    this.calculateEffectiveRoadMap();
  }

  /**
   * 检查所有需要修复的装饰是否满足修复条件
   */
  checkDecorRepair() {
    if (this.frontPaper && this.frontPaper.checkRepair) {
      this.frontPaper.checkRepair();
    }
  }

    updateGuideLine(edge) 
    {
      this.guideLine.updateGuideLine(edge);
  }

  getFoldPos(edge) {
    const r = this.paperRect;
    if (edge === 'left') return this.x + r.x + this.foldLeft;
    if (edge === 'right') return this.x + r.right - this.foldRight;
    if (edge === 'top') return this.y + r.top + this.foldTop;
    if (edge === 'bottom') return this.y + r.bottom - this.foldBottom;
    if (edge === 'topLeft') return { x: this.x + r.x + this.foldTopLeft, y: this.y + r.top + this.foldTopLeft };
    if (edge === 'topRight') return { x: this.x + r.right - this.foldTopRight, y: this.y + r.top + this.foldTopRight };
    if (edge === 'bottomLeft') return { x: this.x + r.x + this.foldBottomLeft, y: this.y + r.bottom - this.foldBottomLeft };
    if (edge === 'bottomRight') return { x: this.x + r.right - this.foldBottomRight, y: this.y + r.bottom - this.foldBottomRight };
    return null;
  }

  setFoldPos(edge, pos) {
    if (edge === 'left') this.foldLeft = pos;
    else if (edge === 'right') this.foldRight = pos;
    else if (edge === 'top') this.foldTop = pos;
    else if (edge === 'bottom') this.foldBottom = pos;
    else if (edge === 'topLeft') this.foldTopLeft = pos;
    else if (edge === 'topRight') this.foldTopRight = pos;
    else if (edge === 'bottomLeft') this.foldBottomLeft = pos;
    else if (edge === 'bottomRight') this.foldBottomRight = pos;
  }

  snapFold(edge) {
    const r = this.paperRect;

    if (edge === 'left' && this.foldLeft !== null) {
      this.foldLeft = this.snapToGrid(this.foldLeft, 0, PAPER_WIDTH);
    }

    if (edge === 'right' && this.foldRight !== null) {
      this.foldRight = this.snapToGrid(this.foldRight, 0, PAPER_WIDTH);
    }

    if (edge === 'top' && this.foldTop !== null) {
      this.foldTop = this.snapToGrid(this.foldTop, 0, PAPER_HEIGHT);
    }

    if (edge === 'bottom' && this.foldBottom !== null) {
      this.foldBottom = this.snapToGrid(this.foldBottom, 0, PAPER_HEIGHT);
    }

    const maxCorner = Math.min(PAPER_WIDTH, PAPER_HEIGHT);
    if (edge === 'topLeft' && this.foldTopLeft !== null) {
      this.foldTopLeft = this.snapToGrid(this.foldTopLeft, 0, maxCorner);
    }

    if (edge === 'topRight' && this.foldTopRight !== null) {
      this.foldTopRight = this.snapToGrid(this.foldTopRight, 0, maxCorner);
    }

    if (edge === 'bottomLeft' && this.foldBottomLeft !== null) {
      this.foldBottomLeft = this.snapToGrid(this.foldBottomLeft, 0, maxCorner);
    }

    if (edge === 'bottomRight' && this.foldBottomRight !== null) {
      this.foldBottomRight = this.snapToGrid(this.foldBottomRight, 0, maxCorner);
    }
  }

  snapToGrid(value, min = 0, max = PAPER_WIDTH) {
    const snapped = Math.round(value / this.cell) * this.cell;
    return Phaser.Math.Clamp(snapped, min, max);
  }

  onDown(p) {
    const r = this.paperRect;
    const localX = p.worldX - this.x;
    const localY = p.worldY - this.y;

    if (p.rightButtonDown() && r.contains(localX, localY)) {
      this.backPaper.setLookState(true);
      return true;
    }

    if (p.leftButtonDown() && this.guideEdge) {
      // 玩家在折叠区上时，不允许拖拽该方向的折叠
      if (this.isPlayerOnFoldArea(this.guideEdge)) {
        return false;
      }
      this.draggingFold = true;
      this.currentFoldEdge = this.guideEdge;
      this.updateMask();
      return true;
    }

    return false;
  }

  onMove(p) {
    if (!this.draggingFold) {
      const edge = this.testPaperEdge(p);
      // console.log(edge);
      if (edge) {
        this.guideEdge = edge;
        this.guideLine.setGuideLineVisible(true);
        this.updateGuideLine(edge);
      } else {
        this.guideLine.setGuideLineVisible(false);
        this.guideEdge = null;
      }
      return;
    }

    const r = this.paperRect;
    const edge = this.currentFoldEdge;
    const paperW = PAPER_WIDTH;
    const paperH = PAPER_HEIGHT;

    // 检查 player 是否存在（TutorialScene 中没有 player）
    let playerX = 5*this.cell;
    let playerY = 5*this.cell;
    if (this.scene.player) {
      const playerTile = this.scene.player.getCurrentTile();
      playerX = playerTile.x * this.cell;
      playerY = playerTile.y * this.cell;
    }

    const rx = this.x + r.x;
    const ry = this.y + r.y;
    const right = this.x + r.right;
    const top = this.y + r.top;
    const bottom = this.y + r.bottom;

    if (edge === 'left') {
      const dx = p.worldX - rx;
      let newPos = rx + dx;
      newPos = Phaser.Math.Clamp(newPos, rx, rx + playerX);
      this.foldLeft = newPos - rx;
    } else if (edge === 'right') {
      const dx = right - p.worldX;
      let newPos = right - dx;
      newPos = Phaser.Math.Clamp(newPos, rx + playerX + this.cell, right);
      this.foldRight = right - newPos;
    } else if (edge === 'top') {
      const dy = p.worldY - top;
      let newPos = top + dy;
      newPos = Phaser.Math.Clamp(newPos, top, top + playerY);
      this.foldTop = newPos - top;
    } else if (edge === 'bottom') {
      const dy = bottom - p.worldY;
      let newPos = bottom - dy;
      newPos = Phaser.Math.Clamp(newPos, top + playerY + this.cell, bottom);
      this.foldBottom = bottom - newPos;
    } else if (edge === 'topLeft') {
      const dx = p.worldX - rx;
      const dy = p.worldY - top;
      const fold = Math.min(dx, dy);
      let dt = Math.max(playerX, playerY);
      dt = Math.min(dt, paperW - this.foldRight);
      dt = Math.min(dt, paperW - this.foldTopRight);
      dt = Math.min(dt, paperW - this.foldBottomRight);
      dt = Math.min(dt, paperH - this.foldBottomRight);
      dt = Math.min(dt, paperH - this.foldBottomLeft);
      let newPos = rx + fold;
      newPos = Phaser.Math.Clamp(newPos, rx, rx + dt);
      this.foldTopLeft = newPos - rx;
    } else if (edge === 'topRight') {
      const dx = right - p.worldX;
      const dy = p.worldY - top;
      const fold = Math.min(dx, dy);

      let dt = Math.max(
        paperW - playerX - this.cell,
        playerY
      );
      dt = Math.min(dt, paperW - this.foldLeft);
      dt = Math.min(dt, paperW - this.foldTopLeft);
      dt = Math.min(dt, paperW - this.foldBottomLeft);
      dt = Math.min(dt, paperH - this.foldBottomLeft);
      dt = Math.min(dt, paperH - this.foldBottomRight);

      let newPos = right - fold;
      newPos = Phaser.Math.Clamp(newPos, right - dt, right);
      this.foldTopRight = right - newPos;
    } else if (edge === 'bottomLeft') {
      const dx = p.worldX - rx;
      const dy = bottom - p.worldY;
      const fold = Math.min(dx, dy);

      let dt = Math.max(
        playerX,
        paperH - playerY - this.cell
      );
      dt = Math.min(dt, paperW - this.foldRight);
      dt = Math.min(dt, paperW - this.foldTopRight);
      dt = Math.min(dt, paperW - this.foldBottomRight);
      dt = Math.min(dt, paperH - this.foldTopRight);
      dt = Math.min(dt, paperH - this.foldTopLeft);

      let newPos = rx + fold;
      newPos = Phaser.Math.Clamp(newPos, rx, rx + dt);
      this.foldBottomLeft = newPos - rx;
    } else if (edge === 'bottomRight') {
      const dx = right - p.worldX;
      const dy = bottom - p.worldY;
      const fold = Math.min(dx, dy);

      let dt = Math.max(
        paperW - playerX - this.cell,
        paperH - playerY - this.cell
      );
      dt = Math.min(dt, paperW - this.foldLeft);
      dt = Math.min(dt, paperW - this.foldTopLeft);
      dt = Math.min(dt, paperW - this.foldBottomLeft);
      dt = Math.min(dt, paperH - this.foldTopLeft);
      dt = Math.min(dt, paperH - this.foldTopRight);

      let newPos = right - fold;
      newPos = Phaser.Math.Clamp(newPos, right - dt, right);
      this.foldBottomRight = right - newPos;
    }

    this.updateMask();
    this.updateGuideLine(edge);
  }

  onUp(p) {
    const r = this.paperRect;
    const localX = p.worldX - this.x;
    const localY = p.worldY - this.y;

    // 右键释放：关闭背面查看
    if (p.rightButtonReleased() && r.contains(localX, localY)) {
      this.backPaper.setLookState(false);
      // 不直接 return，继续检查是否需要结束折叠拖拽
    }

    // 任何按钮释放时，都要终止折叠拖拽
    if (this.draggingFold) {
      // 保存折叠前的状态（用于回滚）
      const savedFold = this.cloneFoldState();

      this.draggingFold = false;
      const edge = this.currentFoldEdge;

      // 吸附到最小网格
      if (edge) {
        this.snapFold(edge);
      }

      this.currentFoldEdge = null;
      this.updateMask();

      // 折叠状态变化后重算有效路图
    this.calculateEffectiveRoadMap();
    
    // 装饰修复检查：折叠松手后检查是否满足修复条件
    this.checkDecorRepair();

    // 安全检查：如果玩家当前在当前纸张上，检查折叠后玩家位置是否仍可通行
    if (this.scene.player && this.scene.currentPaperId === this.paperId) {
      const playerTile = this.scene.player.getCurrentTile();
      if (!this.isTilePassable(playerTile.x, playerTile.y)) {
        // 回滚折叠
        this.restoreFoldState(savedFold);
        this.updateMask();
      }
    }
  }
}

  /**
   * 克隆当前折叠状态
   */
  cloneFoldState() {
    return {
      foldLeft: this.foldLeft,
      foldRight: this.foldRight,
      foldTop: this.foldTop,
      foldBottom: this.foldBottom,
      foldTopLeft: this.foldTopLeft,
      foldTopRight: this.foldTopRight,
      foldBottomLeft: this.foldBottomLeft,
      foldBottomRight: this.foldBottomRight
    };
  }

  /**
   * 恢复折叠状态
   */
  restoreFoldState(state) {
    this.foldLeft = state.foldLeft;
    this.foldRight = state.foldRight;
    this.foldTop = state.foldTop;
    this.foldBottom = state.foldBottom;
    this.foldTopLeft = state.foldTopLeft;
    this.foldTopRight = state.foldTopRight;
    this.foldBottomLeft = state.foldBottomLeft;
    this.foldBottomRight = state.foldBottomRight;
  }

  /**
   * 检查指定格子是否可通行（基于有效路图）
   */
  isTilePassable(x, y) {
    if (!this.effectiveRoadMap) return true;
    if (y < 0 || y >= GRID_ROWS || x < 0 || x >= GRID_COLS) return false;
    return this.effectiveRoadMap[y][x] === 1;
  }

  /**
   * 检测玩家是否在指定折叠方向的覆盖区内
   * 如果玩家站在折叠区上，该方向的折叠不能继续折也不能展开
   * @param {string} edge - 折叠方向
   * @returns {boolean}
   */
  isPlayerOnFoldArea(edge) {
    if (!this.scene.player || this.scene.currentPaperId !== this.paperId) return false;
    const tile = this.scene.player.getCurrentTile();
    const cell = this.cell;

    switch (edge) {
      case 'left': {
        const n = Math.round(this.foldLeft / cell);
        return n > 0 && tile.x < n;
      }
      case 'right': {
        const n = Math.round(this.foldRight / cell);
        return n > 0 && tile.x >= GRID_COLS - n;
      }
      case 'top': {
        const n = Math.round(this.foldTop / cell);
        return n > 0 && tile.y < n;
      }
      case 'bottom': {
        const n = Math.round(this.foldBottom / cell);
        return n > 0 && tile.y >= GRID_ROWS - n;
      }
      case 'topLeft': {
        const n = Math.round(this.foldTopLeft / cell);
        return n > 0 && tile.x < n && tile.y < n;
      }
      case 'topRight': {
        const n = Math.round(this.foldTopRight / cell);
        return n > 0 && tile.x >= GRID_COLS - n && tile.y < n;
      }
      case 'bottomLeft': {
        const n = Math.round(this.foldBottomLeft / cell);
        return n > 0 && tile.x < n && tile.y >= GRID_ROWS - n;
      }
      case 'bottomRight': {
        const n = Math.round(this.foldBottomRight / cell);
        return n > 0 && tile.x >= GRID_COLS - n && tile.y >= GRID_ROWS - n;
      }
      default:
        return false;
    }
  }

   /**
   * 判断某一条边是否允许折叠
   * 【规则】：该边 + 垂直方向相关的边必须都未折
   */
  canFoldEdge(edge) {
    switch (edge) {
      case 'left':
        // 左边折叠：不能已经左折，也不能上/下已有折叠
        return this.foldTopLeft == 0 &&
               this.foldBottomLeft == 0 &&
               this.foldTop == 0 &&
               this.foldBottom == 0;
      case 'right':
        return this.foldTopRight == 0 &&
               this.foldBottomRight == 0 &&
               this.foldTop == 0 &&
               this.foldBottom == 0;
      case 'top':
        return this.foldTopLeft == 0 &&
               this.foldTopRight == 0 &&
               this.foldLeft == 0 &&
               this.foldRight == 0;
      case 'bottom':
        return this.foldBottomLeft == 0 &&
               this.foldBottomRight == 0 &&
               this.foldLeft == 0 &&
               this.foldRight == 0;
    }
  }

  /**
   * 判断某一个角是否允许折叠
   * 【规则】：该角涉及的两条边都必须未折
   */
  canFoldCorner(corner) {
    switch (corner) {
      case 'topLeft':
        return this.foldLeft == 0 && this.foldTop == 0;

      case 'topRight':
        return this.foldRight == 0 && this.foldTop == 0;

      case 'bottomLeft':
        return this.foldLeft == 0 && this.foldBottom == 0;

      case 'bottomRight':
        return this.foldRight == 0 && this.foldBottom == 0;
    }
  }

  /**
 * 根据鼠标位置 p，判断当前可以触发的折叠位置
 * @param {Object} p - 鼠标位置 { x, y }
 * @returns {'left'|'right'|'top'|'bottom'|
 *           'topLeft'|'topRight'|'bottomLeft'|'bottomRight'|null}
 */
testPaperEdge(p) {
  const r = this.paperRect;

  // ===========================
  // 一、参数定义（吸附范围）
  // ===========================

  // Corner 的判定半径（使用圆形范围，防止吃掉 edge）
  const CORNER_RADIUS = EDGE_X_THRESHOLD;

  // ===========================
  // 二、折叠可用性规则（核心）
  // ===========================

  // ===========================
  // 三、Corner 判定（优先）
  // ===========================

  const corners = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

  for (const corner of corners) {
    // 如果规则上不允许折这个角，直接跳过
    if (!this.canFoldCorner(corner)) continue;

    // 获取该角的几何位置（世界坐标）
    const pos = this.getFoldPos(corner);
    if (!pos) continue;

    // 使用圆形半径判断，避免覆盖 edge 区域（统一使用世界坐标）
    const dx = p.worldX - pos.x;
    const dy = p.worldY - pos.y;

    if (dx * dx + dy * dy < CORNER_RADIUS * CORNER_RADIUS) {
      // 玩家在该角折叠区上时，不允许折叠
      if (!this.isPlayerOnFoldArea(corner)) {
        return corner;
      }
    }
  }

  // ===========================
  // 四、Edge 判定
  // ===========================

  const edges = ['left', 'right', 'top', 'bottom'];

  for (const edge of edges) {
    // 如果规则上不允许折这条边，直接跳过
    if (!this.canFoldEdge(edge)) continue;

    const pos = this.getFoldPos(edge);
    if (pos == null) continue;

    // -------- 垂直边（左 / 右）--------
    // pos 是世界坐标，p.worldX/worldY 也是世界坐标
    // r.centerY 是本地坐标，需加上 this.y 转为世界坐标
    if (
      (edge === 'left' || edge === 'right') &&
      Math.abs(p.worldX - pos) < EDGE_X_THRESHOLD &&      // 靠近边
      Math.abs(p.worldY - (this.y + r.centerY)) < EDGE_Y_THRESHOLD   // 靠近中间
    ) {
      // 玩家在该边折叠区上时，不允许折叠
      if (!this.isPlayerOnFoldArea(edge)) {
        return edge;
      }
    }

    // -------- 水平边（上 / 下）--------
    // r.centerX 是本地坐标，需加上 this.x 转为世界坐标
    if (
      (edge === 'top' || edge === 'bottom') &&
      Math.abs(p.worldY - pos) < FOLD_SNAP_THRESHOLD &&
      Math.abs(p.worldX - (this.x + r.centerX)) < EDGE_Y_THRESHOLD
    ) {
      // 玩家在该边折叠区上时，不允许折叠
      if (!this.isPlayerOnFoldArea(edge)) {
        return edge;
      }
    }
  }

  // ===========================
  // 五、没有任何可折叠目标
  // ===========================
  return null;
}

  /**
   * 判断玩家所在格子是否被背面覆盖（即玩家在背面）
   * @param {number} gridX - 格子X坐标
   * @param {number} gridY - 格子Y坐标
   * @returns {boolean} - true表示在背面，false表示在正面
   */
  isPlayerOnBack(gridX, gridY) {
    const covered = this.getFoldCoverage().covered;
    if (covered.has(`${gridX},${gridY}`)) {
      return covered.get(`${gridX},${gridY}`).type;
    }
    return null;
  }

  /**
   * 获取玩家应该放置的容器（正面或背面）
   * @param {number} gridX - 格子X坐标
   * @param {number} gridY - 格子Y坐标
   * @returns {Phaser.GameObjects.Container} - 返回对应的elementContainer
   */
  getPlayerContainer(gridX, gridY) {
    const type = this.isPlayerOnBack(gridX, gridY);
    if (type) {
      // 在背面，返回中间背面纸张的elementContainer
      return this.backPaper.elementCon['mid'];
    } else {
      // 在正面，返回正面纸张的elementContainer
      return this.frontPaper.elementContainer;
    }
  }

  /**
   * 获取当前被反面覆盖的格子集合
   * @returns {Map<string, string>} 被覆盖的格子映射，key="x,y", value='horizontal'|'vertical'|'corner'
   */
  getFoldCoverage() {
    const covered = new Map();
    const cell = this.cell;
    const emptyed = new Map();

    // 左折：覆盖左侧 N 列 (水平翻转)
    const leftNMid = Math.ceil(this.foldLeft*.5 / cell);
    for (let c = 0; c < leftNMid; c++)
      for (let r = 0; r < GRID_ROWS; r++)
        emptyed.set(`${c},${r}`, 'left');
    const leftN = Math.round(this.foldLeft / cell);
    for (let c = leftN-1, fx = 0; c >= leftNMid; c--, fx++)
      for (let r = 0; r < GRID_ROWS; r++)
        covered.set(`${c},${r}`, {type:'left',x:fx,y:r});

    // 右折：覆盖右侧 N 列 (水平翻转)
    const rightNMid = Math.ceil(this.foldRight*.5 / cell);
    for (let c = GRID_COLS - rightNMid; c < GRID_COLS; c++)
      for (let r = 0; r < GRID_ROWS; r++)
        emptyed.set(`${c},${r}`, 'right');
    const rightN = Math.round(this.foldRight / cell);
    for (let c = GRID_COLS - rightN, fx = 0; c < GRID_COLS - rightNMid; c++, fx++)
      for (let r = 0; r < GRID_ROWS; r++)
        covered.set(`${c},${r}`, {type:'right',x:fx,y:r});

    // 上折：覆盖顶部 N 行 (垂直翻转)
    const topNMid = Math.ceil(this.foldTop*.5 / cell);
    for (let r = 0; r < topNMid; r++)
      for (let c = 0; c < GRID_COLS; c++)
        emptyed.set(`${c},${r}`, 'top');
    const topN = Math.round(this.foldTop / cell);
    for (let r = topN-1, fy = 0; r >= topNMid; r--, fy++)
      for (let c = 0; c < GRID_COLS; c++)
        covered.set(`${c},${r}`, {type:'top',x:c,y:fy});

    // 下折：覆盖底部 N 行 (垂直翻转)
    const bottomNMid = Math.ceil(this.foldBottom*.5 / cell);
    for (let r = GRID_ROWS - bottomNMid; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        emptyed.set(`${c},${r}`, 'bottom');
    const bottomN = Math.round(this.foldBottom / cell);
    for (let r = GRID_ROWS - bottomN, fy = 0; r < GRID_ROWS - bottomNMid; r++, fy++)
      for (let c = 0; c < GRID_COLS; c++)
        covered.set(`${c},${r}`, {type:'bottom',x:c,y:GRID_ROWS-1-fy});

    // 左对角折叠（左上角）：双轴翻转
    // 将正方形区域按对角线分成两个三角形
    const tlN = Math.round(this.foldTopLeft / cell);
    for (let c = 0; c < tlN; c++) {
      for (let r = 0; r < tlN; r++) {
        if ((r+c) >= tlN) {
          // 右上三角形（靠近中心）→ covered（可用）
          const fx = tlN - 1 - c;
          const fy = tlN - 1 - r;
          covered.set(`${c},${r}`, { type: 'topLeft', x: fy, y: fx });
        } else {
          // 左下三角形（靠近角落）→ emptyed（不能走）
          emptyed.set(`${c},${r}`, 'topLeft');
        }
      }
    }

    // 右上角折叠：双轴翻转
    // 将正方形区域按对角线分成两个三角形
    const trN = Math.round(this.foldTopRight / cell);
    for (let c = GRID_COLS - trN; c < GRID_COLS; c++) {
      for (let r = 0; r < trN; r++) {
        // 相对坐标（从0开始）
        const relC = c - (GRID_COLS - trN);
        const relR = r;
        if ((relR + relC) >= trN) {
          // 右下三角形（靠近中心）→ covered（可用）
          const fx = trN - 1 - relC;
          const fy = trN - 1 - relR;
          covered.set(`${c},${r}`, { type: 'topRight', x: c - fx, y: r - fy });
        } else {
          // 左上三角形（靠近角落）→ emptyed（不能走）
          emptyed.set(`${c},${r}`, 'topRight');
        }
      }
    }

    // 左下角折叠：双轴翻转
    // 将正方形区域按对角线分成两个三角形
    const blN = Math.round(this.foldBottomLeft / cell);
    for (let c = 0; c < blN; c++) {
      for (let r = 0; r < blN; r++) {
        if ((r+c) >= blN) {
          // 右上三角形（靠近中心）→ covered（可用）
          const fx = blN - 1 - c;
          const fy = blN - 1 - r;
          covered.set(`${c},${GRID_ROWS-1-r}`, { type: 'bottomLeft', x: fy, y: GRID_ROWS-1-fx });
        } else {
          // 左下三角形（靠近角落）→ emptyed（不能走）
          emptyed.set(`${c},${GRID_ROWS-1-r}`, 'bottomLeft');
        }
      }
    }

    // 右下角折叠：双轴翻转
    // 将正方形区域按对角线分成两个三角形
    const brN = Math.round(this.foldBottomRight / cell);
    for (let c = GRID_COLS - brN; c < GRID_COLS; c++) {
      for (let r = GRID_ROWS - brN; r < GRID_ROWS; r++) {
        // 相对坐标（从0开始）
        const relC = c - (GRID_COLS - brN);
        const relR = r - (GRID_ROWS - brN);
        if ((relR + relC) >= brN) {
          // 右下三角形（靠近中心）→ covered（可用）
          const fx = brN - 1 - relC;
          const fy = brN - 1 - relR;
          covered.set(`${c},${r}`, { type: 'bottomRight', x: c - fx, y: r - fy });
        } else {
          // 左上三角形（靠近角落）→ emptyed（不能走）
          emptyed.set(`${c},${r}`, 'bottomRight');
        }
      }
    }

    return {covered, emptyed};
  }

  /**
   * 根据折叠方向计算镜像映射：正面坐标 → 反面坐标
   * 水平折叠(左/右)：只翻 x 轴
   * 垂直折叠(上/下)：只翻 y 轴
   * 角折叠：双轴翻转
   */
  getMirrorBackPos(fx, fy, foldType) {
    switch (foldType) {
      case 'left':
        return { x: fx, y: fy };
      case 'right':
        return { x: fx, y: fy };
      case 'vertical':
        return { x: fx, y: GRID_ROWS - 1 - fy };
      case 'corner':
        return { x: GRID_COLS - 1 - fx, y: GRID_ROWS - 1 - fy };
    }
    return {x: fx, y: fy};
  }

  /**
   * 计算有效路图：结合正面 roadMap + 反面覆盖
   * 规则：
   *   - 被反面覆盖的格子：用 backRoadMap 方向相关镜像位置的值
   *   - 其余格子：使用原始 roadMap 值
   */
  calculateEffectiveRoadMap() {
    const base = this.roadMap;
    const back = this.backRoadMap;
    const {covered, emptyed} = this.getFoldCoverage();

    this.effectiveRoadMap = base.map((row, y) =>
      row.map((val, x) => {
        const key = `${x},${y}`;
        // 折叠一半的区域空白了
        if (emptyed.has(key)) {
          return 0;
        }
        // 被反面覆盖 → 用方向相关镜像映射
        if (covered.has(key)) {
          const fold = covered.get(key);
          // const backPos = this.getMirrorBackPos(x, y, foldType);
          return back[fold.y][fold.x];
        }
        // 普通格子 → 用正面 roadMap
        return val;
      })
    );
  }

  /**
   * 获取当前有效路图
   * @returns {number[][]} 有效路图
   */
  getEffectiveRoadMap() {
    if (!this.effectiveRoadMap) {
      this.calculateEffectiveRoadMap();
    }
    return this.effectiveRoadMap;
  }

  /**
   * 使用指定的格子坐标数组更新道路地图（将对应格子设为1，即路）
   * @param {Array<{x: number, y: number}>} cells - 格子坐标数组
   */
  fillRoadWithCells(cells) {
    if (!cells || cells.length === 0) return;
    
    cells.forEach(({x, y}) => {
      if (y >= 0 && y < this.roadMap.length && x >= 0 && x < this.roadMap[0].length) {
        this.roadMap[y][x] = 1; // 设置为路
      }
    });
    
    // 重新计算有效道路地图
    this.calculateEffectiveRoadMap();
    
    // 更新 RoadMap 的显示
    if (this.frontPaper && this.frontPaper.roadMapInstance) {
      this.frontPaper.roadMapInstance.updateRoads();
    }
  }
}

