// src/scenes/GameScene.js
import Phaser from 'phaser';
import { PaperContainer } from '../components/PaperContainer.js';
import { Player } from '../entities/Player.js';
import { DialogueBox } from '../components/DialogueBox.js';
import { Inventory } from '../components/Inventory.js';
import { Toast } from '../components/Toast.js';
import { WorldManager } from '../utils/worldManager.js';
import { WorldPathFinder, PathFinder } from '../utils/pathFinder.js';
import {
  WORLD_CONFIG,
  GAME_WIDTH,
  GAME_HEIGHT,
  PAPER_WIDTH,
  PAPER_HEIGHT,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  PLAYER_RADIUS_RATIO,
  PLAYER_MOVE_DURATION,
  NPC_CONFIG,
  HOUSE_CONFIG,
  DEBUG_CONFIG
} from '../config/gameConfig.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.papers = {}; // 存放所有纸张容器的集合
    this.isPlayerMoving = false;
    this.puzzleCompleted = false; // 拼图是否已完成
  }

  preload() {
    // 加载纸张相关资源（使用正式背景资源）
    this.load.image('bg_1_0', 'assets/bg_1_0.png');   // 背面纸张
    this.load.image('bg_1_1', 'assets/bg_1_1.png');  // 正面纸张

    this.load.image('paper_1', 'assets/paper_1.png');
    this.load.image('paper_2', 'assets/paper_2.png');
    
    // 加载道路和桥梁资源
    this.load.image('road', 'assets/road.png');
    this.load.image('bridge_1_0', 'assets/bridge_1_0.png');
    this.load.image('bridge_1_1', 'assets/bridge_1_1.png');
    this.load.image('fire_1_0', 'assets/fire_1_0.png');
    this.load.image('fire_1_1', 'assets/fire_1_1.png');
    
    // 加载装饰资源
    this.load.image('tree_1', 'assets/tree_1.png');
    this.load.image('tree_2', 'assets/tree_2.png');
    this.load.image('tree_3', 'assets/tree_3.png');
    this.load.image('tree_4', 'assets/tree_4.png');
    
    // 加载建筑资源
    this.load.image('house_1', 'assets/house_1.png');
    
    // 加载角色资源
    this.load.image('npc_1', 'assets/npc_1.png');
    this.load.image('npc_2', 'assets/npc_2.png');
    this.load.image('npc_3', 'assets/npc_3.png');
    
    // 加载对话框资源
    this.load.image('dialog_bg', 'assets/dialog_bg.png');
    this.load.image('dialog_speaker', 'assets/dialog_speaker.png');
    this.load.image('dialog_triangle', 'assets/dialog_triangle.png');
    
    // 加载立绘资源
    this.load.image('profile_picture_1', 'assets/profile_picture_1.png');
    this.load.image('profile_picture_2', 'assets/profile_picture_2.png');
    
    // 加载 NPC 头顶标记
    this.load.image('mark', 'assets/mark.png');
    
    // 加载玩家序列帧（7个独立图片）
    for (let i = 1; i <= 7; i++) {
      this.load.image(`player_frame_${i}`, `assets/player/${i}.png`);
    }
    
    // 加载正面纸张序列帧动画（default_0005 到 default_0240，共48帧）
    for (let i = 0; i < 48; i++) {
      const frameNum = String(5 + i * 5).padStart(4, '0'); // 从 0005 开始
      this.load.image(`bg_default_${frameNum}`, `assets/bg/default_${frameNum}.png`);
    }
  }

  create() {
    // 1. 自动兼容和校准 playerStart 的安全读取
    let startPaperId = 'center'; // 默认保底值
    if (WORLD_CONFIG && WORLD_CONFIG.playerStart) {
      startPaperId = WORLD_CONFIG.playerStart.paperId || WORLD_CONFIG.playerStart.id || 'center';
    }
    this.currentPaperId = startPaperId;
    this.currentPaper = null;

    // 2. 初始化世界管理器与大世界寻路器
    this.worldManager = new WorldManager(this, WORLD_CONFIG);
    this.worldManager.init(this.currentPaperId);
    this.worldPathFinder = new WorldPathFinder(this.worldManager, GRID_COLS, GRID_ROWS);

    // 3. 统一在一张画布上平铺创建所有的纸张 Container
    this.createWorldLayers();

    // 3.1 将纸张引用注册到寻路器，使其能获取 effectiveRoadMap
    this.worldPathFinder.setPapers(this.papers);

    // Create UI systems
    this.inventory = new Inventory(this);
    this.dialogueBox = new DialogueBox(this);
    this.toast = new Toast(this);

    this.initPlayer();

    this.focusCameraOnPaper(this.currentPaperId, false);

    // 6. 绑定键盘和点击交互
    this.initInput();
  }

  createWorldLayers() {
    const paperIds = this.worldManager.getAllPaperIds();

    paperIds.forEach(paperId => {
      const config = WORLD_CONFIG.papers[paperId];
      const paperData = this.worldManager.getPaperData(paperId);

      // 基于配置中的九宫格坐标网格 (position.x, position.y)，在世界中错开排放纸张
      const startX = GAME_WIDTH / 2 - PAPER_WIDTH / 2 + config.position.x * PAPER_WIDTH;
      const startY = GAME_HEIGHT / 2 - PAPER_HEIGHT / 2 + config.position.y * PAPER_HEIGHT;

      const paperCont = new PaperContainer(this, startX, startY, paperId, paperData);
      
      // 设置层级：初始激活的纸放在最前(Depth=10)，邻居放在后面(Depth=5)
      paperCont.setDepth(paperId === this.currentPaperId ? 10 : 5);

      this.papers[paperId] = paperCont;
      if (paperId === this.currentPaperId) {
        this.currentPaper = paperCont;
      }
    });
  }

  initPlayer() {
    console.log("当前关卡的所有纸张实例:", Object.keys(this.papers));
    console.log("玩家初始尝试寻找的纸张 ID:", this.currentPaperId);

    const startPaper = this.papers[this.currentPaperId];
    
    if (!startPaper) {
      console.error(`【配置错误】无法初始化玩家！在 this.papers 中找不到 ID 为 "${this.currentPaperId}" 的纸张组件。`);
      return;
    }

    // 同样对 playerStart.tile 进行安全保护
    const startTile = (WORLD_CONFIG.playerStart && WORLD_CONFIG.playerStart.tile) ? WORLD_CONFIG.playerStart.tile : { x: 1, y: 1 };
    
    // 换算玩家在大世界里的绝对坐标位置
    const worldPos = startPaper.getTileWorldPosition(startTile.x, startTile.y);
    const cellSize = CELL_SIZE;
    const radius = cellSize * PLAYER_RADIUS_RATIO;

    // 创建玩家（直接在场景中，深度高于纸张）
    this.player = new Player(this, worldPos.x, worldPos.y, radius, 0xff0000);
    this.player.setCurrentTile(startTile);
    
    // 初始化引导点击功能
    this.initGuideClick();

    // 根据调试配置显示网格线和格子号
    if (DEBUG_CONFIG.showGrid || DEBUG_CONFIG.showTileNumbers) {
      const startX = GAME_WIDTH / 2 - PAPER_WIDTH / 2;
      const startY = GAME_HEIGHT / 2 - PAPER_HEIGHT / 2;
      
      // 显示格子坐标编号
      if (DEBUG_CONFIG.showTileNumbers) {
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            let guideText = this.add.text(0, 0, j + ',' + i, {
                  fontSize: '14px',
                  fontFamily: 'Microsoft YaHei',
                  color: '#ff0000',
                  stroke: '#000000',
                  strokeThickness: 3,
                  align: 'center'
                }).setOrigin(0, 0).setDepth(1);
            guideText.setPosition(startX + j * CELL_SIZE, startY + i * CELL_SIZE);
            guideText.setDepth(2000);
          }
        }
      }
      
      // 绘制网格线
      if (DEBUG_CONFIG.showGrid) {
        const gridGraphics = this.add.graphics();
        gridGraphics.setDepth(1999);
        gridGraphics.lineStyle(1, 0x00ff00, 0.5); // 绿色半透明线
        
        // 绘制10条垂直线
        for (let j = 0; j <= 10; j++) {
          const x = startX + j * CELL_SIZE;
          gridGraphics.beginPath();
          gridGraphics.moveTo(x, startY);
          gridGraphics.lineTo(x, startY + 10 * CELL_SIZE);
          gridGraphics.strokePath();
        }
        
        // 绘制10条水平线
        for (let i = 0; i <= 10; i++) {
          const y = startY + i * CELL_SIZE;
          gridGraphics.beginPath();
          gridGraphics.moveTo(startX, y);
          gridGraphics.lineTo(startX + 10 * CELL_SIZE, y);
          gridGraphics.strokePath();
        }
      }
    }
  }

  /**
   * 初始化引导功能
   */
  initGuideClick() {
    this.guideActive = true;
    
    // 获取房子配置中的 doorTile 位置作为引导目标
    const houseConfig = HOUSE_CONFIG['center_house'];
    if (houseConfig && houseConfig.doorTile) {
      this.guideTargetTile = houseConfig.doorTile;
    } else {
      this.guideTargetTile = { x: 4, y: 3 }; // 默认值
    }
    
    // 创建引导提示
    this.createGuideIndicator();
  }

  /**
   * 创建引导指示器
   */
  createGuideIndicator() {
    const paper = this.papers[this.currentPaperId];
    
    // 使用世界坐标
    const worldPos = paper.getTileWorldPosition(this.guideTargetTile.x, this.guideTargetTile.y+1);
    
    // 创建高亮圆形（添加到场景中）
    this.guideCircle = this.add.circle(worldPos.x, worldPos.y, CELL_SIZE / 2, 0x00ff00);
    this.guideCircle.setAlpha(0.5);
    this.guideCircle.setDepth(1000);  // 设置高深度确保在最上层
    
    // 创建脉冲动画（保存引用以便停止）
    this.guideTween = this.tweens.add({
      targets: this.guideCircle,
      scale: 1.5,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 创建提示文字（添加到场景中）
    this.guideText = this.add.text(worldPos.x, worldPos.y - CELL_SIZE, '前往小屋', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setDepth(1001);
  }

  /**
   * 完成引导（清除引导元素并显示对话框）
   */
  completeGuide() {
    this.guideActive = false;
    
    // 停止脉冲动画
    if (this.guideTween) {
      this.guideTween.stop();
      this.guideTween = null;
    }
    
    // 移除引导元素
    if (this.guideCircle) {
      this.guideCircle.destroy();
      this.guideCircle = null;
    }
    if (this.guideText) {
      this.guideText.destroy();
      this.guideText = null;
    }
  }

  focusCameraOnPaper(paperId, animated = true) {
    const paper = this.papers[paperId];
    if (!paper) return;
    const targetX = paper.x + PAPER_WIDTH / 2;
    const targetY = paper.y + PAPER_HEIGHT / 2;

    if (animated) {
      this.cameras.main.pan(targetX, targetY, 500, 'Power2');
    } else {
      this.cameras.main.centerOn(targetX, targetY);
    }
  }

  initInput() {
    this.input.mouse.disableContextMenu();

    // 键盘走动监听
    this.input.keyboard.on('keydown', this.onKeyDown, this);

    // 鼠标/触摸点击监听
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);

    // 鼠标/触摸点击监听
    // Object.values(this.papers).forEach(paperCont => {
        

    //   paperCont.on('pointerdown', (pointer) => {
    //     this.handlePaperClick(paperCont, pointer);
    //   });
    // });
  }

  onKeyDown(event) {
    if (this.isPlayerMoving) return;
    if (this.dialogueBox.isActive) return;

    let direction = null;
    switch (event.key) {
      case 'ArrowUp': case 'w': direction = 'north'; break;
      case 'ArrowDown': case 's': direction = 'south'; break;
      case 'ArrowLeft': case 'a': direction = 'west'; break;
      case 'ArrowRight': case 'd': direction = 'east'; break;
    }

    if (direction) {
      this.tryMove(direction);
    }
  }

  onDown(p) {
    if (this.dialogueBox.isActive) return;

    const ret = this.currentPaper.onDown(p);
    if (ret) {
      return;
    }
    // 左键点击：点击移动
    if (p.leftButtonDown()) {
      this.handleClickMove(p);
    }
  }

  onMove(p) {
    if (this.dialogueBox.isActive) return;
    this.currentPaper.onMove(p);
  }

  onUp(p) {
    if (this.dialogueBox.isActive) return;
    this.currentPaper.onUp(p);
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
  };

  /**
   * 方向移动：玩家按方向键时，尝试移动一步
   * @param {string} direction - 'north'|'south'|'east'|'west'
   */
  tryMove(direction) {
    if (this.isPlayerMoving) return;

    const playerTile = this.player.getCurrentTile();
    let dx = 0, dy = 0;

    switch (direction) {
      case 'north': dy = -1; break;
      case 'south': dy = 1; break;
      case 'west': dx = -1; break;
      case 'east': dx = 1; break;
      default: return; // 非法方向参数，忽略
    }

    const nextX = playerTile.x + dx;
    const nextY = playerTile.y + dy;

    // 1. 尝试在当前纸张上移动（使用有效路图，含坏桥/反面覆盖）
    const effectiveRoadMap = this.currentPaper.getEffectiveRoadMap();
    const pf = new PathFinder(effectiveRoadMap, GRID_COLS, GRID_ROWS);

    if (pf.isRoad(nextX, nextY)) {
      this.movePlayerToTile(this.currentPaperId, nextX, nextY);
      return;
    }

    // 2. 无法在当前纸张上移动，检查是否可以跨纸移动
    const neighborId = this.getNeighborInDirection(direction);
    if (!neighborId) return; // 没有邻居纸张，无法移动

    // 3. 确认玩家处于道路边缘，才允许跨纸
    if (!this.isAtRoadEdge(playerTile, direction)) return;

    // 4. 计算目标纸张的入口坐标（保持玩家在原纸张的对应位置）
    const entryX = direction === 'east' ? 1 : direction === 'west' ? 8 : playerTile.x;
    const entryY = direction === 'south' ? 1 : direction === 'north' ? 6 : playerTile.y;

    this.movePlayerToTile(neighborId, entryX, entryY);
  }

  /**
   * 获取当前纸张在指定方向上的邻居纸张 ID
   * @param {string} direction - 方向
   * @returns {string|null}
   */
  getNeighborInDirection(direction) {
    const neighbors = this.worldManager.getNeighbors(this.currentPaperId);
    for (const neighborId of neighbors) {
      const dir = this.worldPathFinder.getDirection(this.currentPaperId, neighborId);
      if (dir === direction) return neighborId;
    }
    return null;
  }

  /**
   * 判断玩家是否处于当前纸张的道路边缘（可以跨纸的位置）
   * 针对 fullRoad 模板：道路环在 x=1~8, y=1~7
   * @param {{x:number, y:number}} tile - 玩家当前网格坐标
   * @param {string} direction - 移动方向
   * @returns {boolean}
   */
  isAtRoadEdge(tile, direction) {
    switch (direction) {
      case 'north': return tile.y <= 1;
      case 'south': return tile.y >= 6;
      case 'west': return tile.x <= 1;
      case 'east': return tile.x >= 8;
      default: return false;
    }
  }

  /**
   * 将玩家移动到指定纸张的指定网格坐标（单步移动）
   * @param {string} paperId - 目标纸张 ID
   * @param {number} tileX - 目标网格 X
   * @param {number} tileY - 目标网格 Y
   */
  movePlayerToTile(paperId, tileX, tileY) {
    this.isPlayerMoving = true;

    const targetPaper = this.papers[paperId];
    const targetWorldPos = targetPaper.getTileWorldPosition(tileX, tileY);

    // 如果跨纸张移动，同步所有状态
    if (paperId !== this.currentPaperId) {
      // 隐藏所有纸张的引导线并重置折叠拖拽状态
      Object.values(this.papers).forEach(p => {
        p.guideLine.setGuideLineVisible(false);
        p.guideEdge = null;
        p.draggingFold = false;
        p.currentFoldEdge = null;
      });

      this.currentPaperId = paperId;
      this.currentPaper = this.papers[paperId];
      this.worldManager.setCurrentPaperId(paperId);
      this.focusCameraOnPaper(paperId, true);

      Object.values(this.papers).forEach(p => p.setDepth(5));
      targetPaper.setDepth(10);
    }

    this.player.moveTo(targetWorldPos.x, targetWorldPos.y, PLAYER_MOVE_DURATION, () => {
      this.player.setCurrentTile({ x: tileX, y: tileY });
      this.isPlayerMoving = false;
      this.checkInteractions();
    });
  }

  /**
   * 按路径逐步移动玩家（用于多步寻路结果，如点击移动）
   * @param {{paperId: string, x: number, y: number}[]} worldPath - 寻路结果
   */
  executeWorldPathMove(worldPath) {
    this.isPlayerMoving = true;
    let stepIndex = 0;

    const moveNextStep = () => {
      if (stepIndex >= worldPath.length) {
        this.isPlayerMoving = false;
        this.checkInteractions();
        return;
      }

      const node = worldPath[stepIndex];
      const targetPaper = this.papers[node.paperId];

      // 检查目标格子是否仍可通行（折叠可能改变了路图）
      if (targetPaper && !targetPaper.isTilePassable(node.x, node.y)) {
        // 路径被阻断，中断移动
        this.isPlayerMoving = false;
        return;
      }

      const targetWorldPos = targetPaper.getTileWorldPosition(node.x, node.y);

      if (node.paperId !== this.currentPaperId) {
        // 隐藏所有纸张的引导线并重置折叠拖拽状态
        Object.values(this.papers).forEach(p => {
          p.guideLine.setGuideLineVisible(false);
          p.guideEdge = null;
          p.draggingFold = false;
          p.currentFoldEdge = null;
        });

        this.currentPaperId = node.paperId;
        this.currentPaper = this.papers[node.paperId];
        this.worldManager.setCurrentPaperId(node.paperId);
        this.focusCameraOnPaper(this.currentPaperId, true);

        Object.values(this.papers).forEach(p => p.setDepth(5));
        targetPaper.setDepth(10);
      }

      this.player.moveTo(targetWorldPos.x, targetWorldPos.y, PLAYER_MOVE_DURATION, () => {
        this.player.setCurrentTile({ x: node.x, y: node.y });
        stepIndex++;
        moveNextStep();
      });
    };

    moveNextStep();
  }

  checkInteractions() {
    const playerTile = this.player.getCurrentTile();

    // Check NPC interactions (从当前纸张的 frontPaper 获取)
    const npcs = this.currentPaper.frontPaper.npcInstances || [];
    npcs.forEach(npc => {
      if (npc.hasGivenReward) return;

      if (npc.isAdjacentTo(playerTile) || npc.isAtSameTile(playerTile)) {
        this.triggerNPCDialogue(npc);
      }
    });

    // Check House interactions (从当前纸张的 frontPaper 获取)
    const houses = this.currentPaper.frontPaper.houseInstances || [];
    houses.forEach(house => {
      if (house.isAdjacentToDoor(playerTile) || house.isAtDoor(playerTile)) {
        this.triggerHouseInteraction(house);
      }
    });
  }

  triggerNPCDialogue(npc) {
    if (this.dialogueBox.isActive) return;
    if (npc.hasGivenReward) return;

    // 检查是否有任务要求
    const hasQuest = npc.requiredRepair && !npc.questCompleted;
    const isQuestCompleted = this.checkRepairCompleted(npc.requiredRepair);

    this.dialogueBox.show(
      npc.dialogues,
      { npc: npc.name, player: '你' },
      () => {
        // 对话完成后检查任务状态
        if (hasQuest) {
          if (isQuestCompleted) {
            // 任务已完成，给予奖励
            npc.questCompleted = true;
            if (npc.reward && !npc.hasGivenReward) {
              npc.hasGivenReward = true;
              npc.hideMark();
              this.inventory.addItem(npc.reward);
              this.toast.show(`获得物品：${npc.reward.name}`, 3000, '#ffdd44');
            }
          } else {
            // 任务未完成，提示玩家
            this.toast.show('请先完成任务再回来领取奖励！', 2500, '#ffaa00');
          }
        } else {
          // 没有任务要求，直接给奖励
          if (npc.reward && !npc.hasGivenReward) {
            npc.hasGivenReward = true;
            npc.hideMark();
            this.inventory.addItem(npc.reward);
            this.toast.show(`获得物品：${npc.reward.name}`, 3000, '#ffdd44');
          }
        }
      }
    );
  }

  /**
   * 检查指定名称的装饰是否已修复
   * @param {string} decorName - 装饰名称
   * @returns {boolean} - 是否已修复
   */
  checkRepairCompleted(decorName) {
    if (!decorName) return false;
    
    // 遍历所有纸张的正面装饰，查找指定名称的装饰
    for (const paperId in this.papers) {
      const paper = this.papers[paperId];
      if (paper.frontPaper && paper.frontPaper.elements) {
        for (const deco of paper.frontPaper.elements) {
          // 同时检查 deco.name 和 deco.data.name，确保兼容性
          const decoName = deco.name || (deco.decoData && deco.decoData.name);
          if (decoName === decorName) {
            // 返回该装饰是否已修复
            return deco.isRepaired || false;
          }
        }
      }
    }
    
    return false;
  }

  triggerHouseInteraction(house) {
    if (this.dialogueBox.isActive) return;

    // 如果是第一次到达，显示引导对话框并清除引导
    if (this.guideActive) {
      this.completeGuide();
    }

    if (house.isUnlocked) {
      // 小屋已解锁，显示内部探索对话
      this.exploreHouse(house);
      return;
    }

    if (this.inventory.hasItem(house.requiredKey)) {
      // Has key - unlock!
      house.unlock();
      this.inventory.removeItem(house.requiredKey);
      this.toast.show(house.config.unlockedMessage, 4000, '#44ff44');
      
      // 解锁后立即开始探索
      this.dialogueBox.show(
        [{ speaker: 'narrator', text: '你推开了小屋的门...' }],
        { narrator: '旁白' },
        () => {
          this.exploreHouse(house);
        }
      );
    } else {
      // No key
      // 弹出对话框提示需要找钥匙（点击继续形式）
    this.dialogueBox.show(
      [{ speaker: 'system', text: house.config.lockedMessage }],
      { system: '系统提示' },
      () => {
        this.dialogueBox.hide();
      }
    );
    }
  }

  exploreHouse(house) {
    // 检查是否已经获得过地图碎片
    const hasFragment = this.inventory.hasItem('map_fragment');
    
    if (hasFragment && this.houseExplored) {
      // 已经探索过小屋
      this.dialogueBox.show(
        [{ speaker: 'narrator', text: '小屋已经没有更多可以发现的东西了...' }],
        { narrator: '旁白' },
        () => {
          this.dialogueBox.hide();
        }
      );
      return;
    }

    // 如果已完成拼图，直接显示剩余对话
    if (this.puzzleCompleted && hasFragment) {
      this.showNewspaperClues();
      return;
    }

    // 小屋探索对话序列（第一部分）
    const dialogues = [
      { speaker: 'narrator', text: '你进入了这间破旧的小屋...' },
      { speaker: 'narrator', text: '墙壁已经破损，看起来很久没有人居住了。' },
      { speaker: 'narrator', text: '角落里有两堆旧报纸，墙上似乎有什么东西在反光...' },
      { speaker: 'player', text: '让我仔细看看墙上是什么...' },
      { speaker: 'narrator', text: '你发现了一张被打碎的古老地图碎片！' },
      { speaker: 'narrator', text: '也许需要把它拼凑完整才能看清上面的内容...' }
    ];

    this.dialogueBox.show(dialogues, { narrator: '旁白', player: '你' }, () => {
      // 启动拼图游戏
      this.startPuzzleGame();
    });
  }

  /**
   * 启动拼图游戏
   */
  startPuzzleGame() {
    // 使用 sleep 而不是 pause，保持场景对象活跃
    this.scene.sleep();
    
    // 启动拼图场景（使用 launch 而不是 start，保持 GameScene 实例）
    this.scene.launch('PuzzleScene', {
      textureKey: 'paper_1',
      onComplete: () => {
        // 拼图完成回调 - 先唤醒场景
        this.scene.wake('GameScene');
        this.onPuzzleComplete();
      }
    });
  }

  /**
   * 拼图完成回调
   */
  onPuzzleComplete() {
    this.puzzleCompleted = true;
    
    // 给予地图碎片
    if (!this.inventory.hasItem('map_fragment')) {
      const fragment = {
        id: 'map_fragment',
        name: '地图碎片',
        description: '一张被报纸包裹的古老地图碎片'
      };
      this.inventory.addItem(fragment);
    }
    
    this.toast.show('地图碎片已拼好！', 3000, '#44ff44');
    
    // 使用 scene.time.delayedCall 确保在场景上下文中执行
    this.time.delayedCall(500, () => {
      this.revealHiddenRoad();
    });
    
    this.time.delayedCall(3500, () => {
      this.showNewspaperClues();
    });
  }

  /**
   * 显示隐藏道路
   */
  revealHiddenRoad() {
    // 遍历所有纸张的正面，找到隐藏道路并显示
    for (const paperId in this.papers) {
      const paper = this.papers[paperId];
      if (paper.frontPaper && paper.frontPaper.showHiddenRoad) {
        const shown = paper.frontPaper.showHiddenRoad('hidden_road_under_paper1');
        if (shown) {
          // 隐藏覆盖在道路上面的 paper_1 装饰元素
          if (paper.frontPaper.hideDecoElement) {
            paper.frontPaper.hideDecoElement('paper_1');
          }
          this.toast.show('发现了一条隐藏的道路！', 3000, '#44ff44');
          break;
        }
      }
    }
  }

  showNewspaperClues() {
    const dialogues = [
      { speaker: 'narrator', text: '你展开了角落的旧报纸...' },
      { speaker: 'narrator', text: '报纸上记载着这个纸世界的历史...' },
      { speaker: 'narrator', text: '曾经这里是一个繁荣的文明，但一场灾难让一切化为废墟。' },
      { speaker: 'narrator', text: '传说中，完整的地图可以指引找到重建世界的方法。' },
      { speaker: 'narrator', text: '而要修复这个世界，需要先修复这间小屋...' },
      { speaker: 'narrator', text: '也许折叠的力量可以帮助修复一切...' }
    ];

    this.dialogueBox.show(dialogues, { narrator: '旁白', player: '你' }, () => {
      this.houseExplored = true;
      this.toast.show('小屋中有更多线索，需要修复小屋才能发现！', 4000);
    });
  }

  handleClickMove(pointer) {
    if (this.isPlayerMoving) return;
    if (this.dialogueBox.isActive) return;

    const cellSize = CELL_SIZE;
    const playerTile = this.player.getCurrentTile();

    // 1. 遍历所有纸张，找到被点击的道路格子（优先当前纸张）
    let clickedPaperId = null;
    let clickedTile = null;

    // 优先检查当前纸张
    const paperOrder = [this.currentPaperId];
    Object.keys(this.papers).forEach(id => {
      if (id !== this.currentPaperId) paperOrder.push(id);
    });

    for (const paperId of paperOrder) {
      const paper = this.papers[paperId];
      const localX = pointer.worldX - paper.x;
      const localY = pointer.worldY - paper.y;

      if (localX < 0 || localY < 0 || localX >= PAPER_WIDTH || localY >= PAPER_HEIGHT) continue;

      const tileX = Math.floor(localX / cellSize);
      const tileY = Math.floor(localY / cellSize);

      // 检查点击的格子是否为道路（使用有效路图）
      const effectiveRoadMap = this.papers[paperId].getEffectiveRoadMap();
      const pf = new PathFinder(effectiveRoadMap, GRID_COLS, GRID_ROWS);

      if (pf.isRoad(tileX, tileY)) {
        clickedPaperId = paperId;
        clickedTile = { x: tileX, y: tileY };
        break;
      }
    }

    if (!clickedPaperId || !clickedTile) return; // 未点击到有效道路

    // 2. 点击了当前位置，无需移动
    if (clickedPaperId === this.currentPaperId &&
        clickedTile.x === playerTile.x && clickedTile.y === playerTile.y) {
      return;
    }

    // 3. 调用大世界寻路器计算路径
    const worldPath = this.worldPathFinder.findPath(
      this.currentPaperId,
      playerTile,
      clickedPaperId,
      clickedTile
    );

    // 4. 执行路径（跳过第一个节点，即玩家当前位置）
    if (worldPath && worldPath.length > 1) {
      this.executeWorldPathMove(worldPath.slice(1));
    }
  }

  handlePaperClick(paperContainer, pointer) {
    const cellSize = CELL_SIZE;
    
    const localX = pointer.worldX - paperContainer.x;
    const localY = pointer.worldY - paperContainer.y;

    const tileX = Math.floor(localX / cellSize);
    const tileY = Math.floor(localY / cellSize);

    console.log(`成功点击纸张 [${paperContainer.paperId}]，点击网格为: x:${tileX}, y:${tileY}`);
  }
}