/**
 * 拼图游戏场景
 * 功能：展示被打碎的图片碎片，玩家通过拖拽拼图完成
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super('PuzzleScene');
    this.pieces = [];           // 碎片数组
    this.pieceWidth = 0;        // 每个碎片宽度
    this.pieceHeight = 0;       // 每个碎片高度
    this.gridCols = 3;          // 列数
    this.gridRows = 3;          // 行数
    this.pieceCount = 0;        // 碎片总数
    this.onComplete = null;     // 完成回调
    this.isComplete = false;    // 是否已完成
    this.initialized = false;   // 是否已初始化
  }

  init(data) {
    this.textureKey = data.textureKey || 'paper_1';  // 拼图使用的图片
    this.onComplete = data.onComplete || null;        // 完成回调
  }

  create() {
    // 如果图片还未加载，先加载
    if (!this.textures.exists(this.textureKey)) {
      this.load.once('complete', () => {
        this.initPuzzle();
      });
      this.load.image(this.textureKey, `assets/${this.textureKey}.png`);
      this.load.start();
    } else {
      this.initPuzzle();
    }
  }

  /**
   * 初始化拼图
   */
  initPuzzle() {
    if (this.initialized) return;
    this.initialized = true;

    // 半透明黑色背景
    this.overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.85
    ).setDepth(100);

    // 标题
    this.titleText = this.add.text(GAME_WIDTH / 2, 50, '拼图游戏', {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(101);

    // 获取原始图片尺寸
    const baseTexture = this.textures.get(this.textureKey);
    const sourceWidth = baseTexture.source[0].width;
    const sourceHeight = baseTexture.source[0].height;

    // 计算每个碎片的实际尺寸（基于原图比例，长方形）
    // cropWidth/cropHeight 是原图中每个碎片的实际像素尺寸（setCrop 和 setDisplaySize 都使用这个值）
    this.cropWidth = sourceWidth / this.gridCols;
    this.cropHeight = sourceHeight / this.gridRows;
    // 碎片在场景中的显示尺寸 = 原图的实际像素尺寸（1:1显示，不缩放）
    this.pieceWidth = this.cropWidth;
    this.pieceHeight = this.cropHeight;
    this.sourceWidth = sourceWidth;
    this.sourceHeight = sourceHeight;

    // 计算拼图区域的起始位置（居中）
    const puzzleStartX = (GAME_WIDTH - sourceWidth) / 2;
    const puzzleStartY = 100;

    // 底部显示原图参考（小尺寸）
    this.showOriginalImage(sourceWidth, sourceHeight);

    // 提示文字（移到拼图区域上方）
    const puzzleWidth = sourceWidth;
    this.hintText = this.add.text(puzzleStartX + puzzleWidth / 2, 90, '将碎片拖拽到正确位置', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei',
      color: '#aaaaaa'
    }).setOrigin(0.5).setDepth(101);

    // 绘制拼图放置提示区（虚线框）
    this.drawPlacementHint(puzzleStartX, puzzleStartY, sourceWidth, sourceHeight);

    // 创建碎片
    this.createPuzzlePieces(puzzleStartX, puzzleStartY);

    // 添加全局拖拽事件监听器（只添加一次）
    this.setupDragEvents();

    // 打乱碎片
    this.shufflePieces();

    // 完成提示（初始隐藏）
    this.completeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '需要拼图完成！', {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    // 完成动画
    this.tweens.add({
      targets: this.completeText,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 点击任意位置关闭（如果已完成）
    this.input.on('pointerdown', () => {
      if (this.isComplete) {
        this.closePuzzle();
      }
    });
  }

  /**
   * 创建拼图碎片
   */
  createPuzzlePieces(startX, startY) {
    this.pieces = [];
    this.pieceCount = this.gridCols * this.gridRows;

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const index = row * this.gridCols + col;

        // 创建碎片容器 - 位置基于原图尺寸排列
        const pieceContainer = this.add.container(
          startX + col * this.cropWidth,
          startY + row * this.cropHeight
        );

        // 调试：给容器添加背景颜色
        const bgColor = 0x333333; // 深灰色背景
        const bg = this.add.rectangle(0, 0, this.cropWidth, this.cropHeight, bgColor, 0.5);
        pieceContainer.add(bg);

        // 调试：添加编号文字
        const indexText = this.add.text(0, 0, `${index}`, {
          fontSize: '32px',
          fontFamily: 'Arial',
          color: '#ff0000',
          stroke: '#ffffff',
          strokeThickness: 2
        }).setOrigin(0.5, 0.5);
        pieceContainer.add(indexText);

        // 创建碎片图片：从原图裁剪出对应区域，并以原图尺寸显示
        const pieceImage = this.add.image(
          -col * this.cropWidth - this.cropWidth / 2, 
          -row * this.cropHeight - this.cropHeight / 2, 
          this.textureKey)
          .setDisplaySize(this.sourceWidth, this.sourceHeight)
          .setCrop(
            col * this.cropWidth ,
            row * this.cropHeight,
            this.cropWidth,
            this.cropHeight
          )
          .setOrigin(0, 0);

        pieceContainer.add(pieceImage);

        // 保存碎片元数据
        pieceContainer.pieceData = {
          correctX: startX + col * this.cropWidth + this.cropWidth / 2,
          correctY: startY + row * this.cropHeight + this.cropHeight / 2,
          width: this.cropWidth,
          height: this.cropHeight,
          row: row,
          col: col,
          index: index
        };

        // 设置深度和交互
        pieceContainer.setDepth(102);
        pieceContainer.setSize(this.cropWidth, this.cropHeight);
        pieceContainer.setInteractive({
          draggable: true,
          useHandCursor: true
        });

        this.pieces.push(pieceContainer);
      }
    }
  }

  /**
   * 设置拖拽事件（只调用一次）
   */
  setupDragEvents() {
    // 拖拽事件
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (this.isComplete) return;

      // 碎片显示尺寸是原图尺寸
      const pieceW = this.cropWidth;
      const pieceH = this.cropHeight;

      // 限制碎片在屏幕范围内
      const minX = 0;
      const maxX = GAME_WIDTH - pieceW;
      const minY = 50;  // 留出标题空间
      const maxY = GAME_HEIGHT - pieceH;

      // 直接使用 dragX/dragY 作为碎片容器位置，并限制边界
      gameObject.x = Phaser.Math.Clamp(dragX, minX, maxX);
      gameObject.y = Phaser.Math.Clamp(dragY, minY, maxY);
      this.bringPiecesToTop(gameObject);
    });

    // 拖拽结束事件
    this.input.on('dragend', (pointer, gameObject) => {
      if (this.isComplete) return;
      this.snapToGrid(gameObject);
      this.checkCompletion();
    });
  }
  /**
   * 显示原图参考（左下角小尺寸）
   */
  showOriginalImage(sourceWidth, sourceHeight) {
    // 左下角显示原图（小尺寸预览）
    const refWidth = sourceWidth * 0.3;  // 缩放到 30%
    const refHeight = sourceHeight * 0.3;
    const refX = 20 + refWidth / 2;
    const refY = GAME_HEIGHT - refHeight / 2 - 20;

    this.originalImage = this.add.image(refX, refY, this.textureKey)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(refWidth, refHeight)
      .setDepth(101)
      .setAlpha(0.8);

    // 添加参考图边框
    const border = this.add.graphics();
    border.lineStyle(2, 0x44ff44, 0.8);
    border.strokeRect(refX - refWidth / 2, refY - refHeight / 2, refWidth, refHeight);
    border.setDepth(101);

    // 添加参考图标题
    this.add.text(refX, refY - refHeight / 2 - 15, '原图参考', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei',
      color: '#44ff44'
    }).setOrigin(0.5).setDepth(101);

    // 添加网格线辅助（基于缩放后的参考图尺寸）
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0xffffff, 0.3);

    for (let i = 1; i < this.gridCols; i++) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(refX - refWidth / 2 + (refWidth / this.gridCols) * i, refY - refHeight / 2);
      gridGraphics.lineTo(refX - refWidth / 2 + (refWidth / this.gridCols) * i, refY + refHeight / 2);
      gridGraphics.stroke();
    }

    for (let i = 1; i < this.gridRows; i++) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(refX - refWidth / 2, refY - refHeight / 2 + (refHeight / this.gridRows) * i);
      gridGraphics.lineTo(refX + refWidth / 2, refY - refHeight / 2 + (refHeight / this.gridRows) * i);
      gridGraphics.stroke();
    }
    gridGraphics.setDepth(102);
  }

  /**
   * 绘制拼图放置提示区
   */
  drawPlacementHint(startX, startY, width, height) {
    const graphics = this.add.graphics();
    graphics.setDepth(5); // 在碎片之下，显示在碎片后面

    // 绘制背景填充（半透明）
    graphics.fillStyle(0x333333, 0.3);
    graphics.fillRect(startX, startY, width, height);

    // 绘制虚线边框
    graphics.lineStyle(2, 0x888888, 0.8);

    // 绘制水平虚线（上边）
    const dashLen = 10;
    const gapLen = 5;
    for (let x = startX; x < startX + width; x += dashLen + gapLen) {
      const lineEnd = Math.min(x + dashLen, startX + width);
      graphics.beginPath();
      graphics.moveTo(x, startY);
      graphics.lineTo(lineEnd, startY);
      graphics.strokePath();
    }

    // 绘制水平虚线（下边）
    for (let x = startX; x < startX + width; x += dashLen + gapLen) {
      const lineEnd = Math.min(x + dashLen, startX + width);
      graphics.beginPath();
      graphics.moveTo(x, startY + height);
      graphics.lineTo(lineEnd, startY + height);
      graphics.strokePath();
    }

    // 绘制垂直虚线（左边）
    for (let y = startY; y < startY + height; y += dashLen + gapLen) {
      const lineEnd = Math.min(y + dashLen, startY + height);
      graphics.beginPath();
      graphics.moveTo(startX, y);
      graphics.lineTo(startX, lineEnd);
      graphics.strokePath();
    }

    // 绘制垂直虚线（右边）
    for (let y = startY; y < startY + height; y += dashLen + gapLen) {
      const lineEnd = Math.min(y + dashLen, startY + height);
      graphics.beginPath();
      graphics.moveTo(startX + width, y);
      graphics.lineTo(startX + width, lineEnd);
      graphics.strokePath();
    }

    // 绘制内部网格线（3x3）
    graphics.lineStyle(1, 0x666666, 0.5);
    for (let i = 1; i < this.gridCols; i++) {
      const gridX = startX + (width / this.gridCols) * i;
      graphics.beginPath();
      graphics.moveTo(gridX, startY);
      graphics.lineTo(gridX, startY + height);
      graphics.strokePath();
    }
    for (let i = 1; i < this.gridRows; i++) {
      const gridY = startY + (height / this.gridRows) * i;
      graphics.beginPath();
      graphics.moveTo(startX, gridY);
      graphics.lineTo(startX + width, gridY);
      graphics.strokePath();
    }

    // 添加"目标区域"文字提示
    this.add.text(startX + width / 2, startY + height + 15, '← 放置区域', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei',
      color: '#888888'
    }).setOrigin(0.5).setDepth(101);
  }

  /**
   * 打乱碎片位置
   */
  shufflePieces() {
    const margin = 50;
    const minGap = 10; // 碎片之间的最小间距

    // 使用居中的起始位置
    const puzzleStartX = (GAME_WIDTH - this.sourceWidth) / 2;
    const puzzleStartY = 100;

    const pieceW = this.cropWidth;
    const pieceH = this.cropHeight;

    // 计算可用区域（避开中间的拼图区域和提示文字）
    const puzzleEndX = puzzleStartX + this.sourceWidth;
    const puzzleEndY = puzzleStartY + this.sourceHeight;
    const hintY = puzzleEndY + 35; // 提示文字区域

    // 已放置的碎片位置列表
    const placedPieces = [];

    // 检查新位置是否与已放置的碎片重叠
    const isOverlapping = (x, y, pieceW, pieceH) => {
      for (const placed of placedPieces) {
        // 检查矩形重叠（考虑最小间距）
        if (x < placed.x + placed.w + minGap &&
            x + pieceW + minGap > placed.x &&
            y < placed.y + placed.h + minGap &&
            y + pieceH + minGap > placed.y) {
          return true;
        }
      }
      return false;
    };

    // 生成不重叠的随机位置（只在左右两侧）
    const getRandomPosition = () => {
      const side = Phaser.Math.Between(0, 1);
      let x, y;
      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        switch (side) {
          case 0: // 左侧
            x = Phaser.Math.Between(20, puzzleStartX - pieceW - 10);
            y = Phaser.Math.Between(puzzleStartY, GAME_HEIGHT - pieceH - 20);
            break;
          default: // 右侧
            x = Phaser.Math.Between(puzzleEndX + 10, GAME_WIDTH - pieceW - 20);
            y = Phaser.Math.Between(puzzleStartY, GAME_HEIGHT - pieceH - 20);
            break;
        }

        // 限制在屏幕范围内
        x = Phaser.Math.Clamp(x, 0, GAME_WIDTH - pieceW);
        y = Phaser.Math.Clamp(y, 50, GAME_HEIGHT - pieceH);

        // 检查是否重叠
        if (!isOverlapping(x, y, pieceW, pieceH)) {
          return { x, y };
        }
        attempts++;
      }

      // 如果找不到不重叠的位置，返回随机位置（兜底）
      return { x, y };
    };

    // 依次放置碎片
    this.pieces.forEach((pieceContainer, index) => {
      const offsetX = Phaser.Math.Between(-margin, margin);
      const offsetY = Phaser.Math.Between(-margin, margin);

      let targetX, targetY;

      // 前2个碎片放在正确位置附近
      if (index < 2) {
        targetX = pieceContainer.pieceData.correctX + offsetX;
        targetY = pieceContainer.pieceData.correctY + offsetY;
      } else {
        // 其余碎片找不重叠的位置
        const pos = getRandomPosition();
        targetX = pos.x;
        targetY = pos.y;
      }

      // 限制在屏幕范围内
      targetX = Phaser.Math.Clamp(targetX, 100, GAME_WIDTH - pieceW);
      targetY = Phaser.Math.Clamp(targetY, 200, GAME_HEIGHT - pieceH);

      pieceContainer.x = targetX;
      pieceContainer.y = targetY;

      // 记录已放置位置
      placedPieces.push({ x: targetX, y: targetY, w: pieceW, h: pieceH });

      // 入场动画
      pieceContainer.setAlpha(0);
      this.tweens.add({
        targets: pieceContainer,
        alpha: 1,
        duration: 300,
        delay: index * 50
      });
    });
  }

  /**
   * 提升碎片层级
   */
  bringPiecesToTop(draggedPiece) {
    this.pieces.forEach(pieceContainer => {
      if (pieceContainer === draggedPiece) {
        pieceContainer.setDepth(103);
      } else {
        pieceContainer.setDepth(102);
      }
    });
  }

  /**
   * 将碎片吸附到最近的网格位置
   */
  snapToGrid(pieceContainer) {
    const snapThreshold = Math.min(this.sourceWidth, this.sourceHeight) * 0.5;

    // 使用居中的起始位置（与创建碎片时相同）
    const startX = (GAME_WIDTH - this.sourceWidth) / 2;
    const startY = 100;

    // 碎片左上角位置
    const pieceLeft = pieceContainer.x;
    const pieceTop = pieceContainer.y;

    let closestDist = snapThreshold;
    let closestPos = null;

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const gridX = startX + col * this.cropWidth - this.cropWidth / 2;
        const gridY = startY + row * this.cropHeight - this.cropHeight / 2;

        const dist = Phaser.Math.Distance.Between(pieceLeft, pieceTop, gridX, gridY);

        if (dist < closestDist) {
          const isOccupied = this.pieces.some(p =>
            p !== pieceContainer &&
            Math.abs(p.x - gridX) < 10 &&
            Math.abs(p.y - gridY) < 10
          );

          if (!isOccupied) {
            closestDist = dist;
            closestPos = {
              x: gridX,
              y: gridY
            };
          }
        }
      }
    }

    if (closestPos) {
      this.tweens.add({
        targets: pieceContainer,
        x: closestPos.x,
        y: closestPos.y,
        duration: 150,
        ease: 'Power2'
      });
    }
  }

  /**
   * 检查拼图是否完成
   */
  checkCompletion() {
    let correctCount = 0;

    this.pieces.forEach(pieceContainer => {
      const correct = pieceContainer.pieceData;
      // 比较碎片左上角位置与正确位置
      const dist = Phaser.Math.Distance.Between(
        pieceContainer.x, pieceContainer.y,
        correct.correctX, correct.correctY
      );

      if (dist < 10) {
        correctCount++;
      }
    });

    this.hintText.setText(`已放置: ${correctCount}/${this.pieceCount}`);

    if (correctCount === this.pieceCount) {
      this.onPuzzleComplete();
    }
  }

  /**
   * 拼图完成处理
   */
  onPuzzleComplete() {
    this.isComplete = true;

    this.completeText.setAlpha(1);
    this.hintText.setText('拼图完成！点击任意位置继续...');
    this.hintText.setColor('#00ff00');

    // 碎片发光动画
    this.pieces.forEach((pieceContainer, index) => {
      this.tweens.add({
        targets: pieceContainer,
        scale: 1.05,
        duration: 500,
        yoyo: true,
        repeat: -1,
        delay: index * 50
      });
    });

    // 3秒后自动关闭或点击关闭
    this.time.delayedCall(3000, () => {
      if (this.isComplete) {
        this.closePuzzle();
      }
    });
  }

  /**
   * 关闭拼图场景
   */
  closePuzzle() {
    if (this.onComplete) {
      this.onComplete();
    }
    // 停止拼图场景（GameScene 已在回调中唤醒）
    this.scene.stop();
  }
}
