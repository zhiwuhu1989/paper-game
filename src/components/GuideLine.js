import Phaser from 'phaser';
import {
  EDGE_X_THRESHOLD,
  EDGE_Y_THRESHOLD,
  EDGE_ANGLE_THRESHOLD,
  FOLD_SNAP_THRESHOLD
} from '../config/gameConfig.js';

export class GuideLine extends Phaser.GameObjects.Container {
  constructor(scene, x, y, paperContainer) {
    super(scene, x, y);
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.paperContainer = paperContainer;

    this.initGuideLine();
  }

  initGuideLine() {
    const r = this.paperContainer.paperRect;
    this.guideLine = this.scene.add.graphics();
    this.guideLine.lineStyle(6, 0xffffff, 1); // 白色引导线
    this.guideLine.beginPath();
    this.guideLine.moveTo(r.x, r.centerY - EDGE_Y_THRESHOLD);
    this.guideLine.lineTo(r.x, r.centerY + EDGE_Y_THRESHOLD);
    this.guideLine.strokePath();
    this.guideLine.setDepth(1000);
    this.scene.tweens.add({
      targets: this.guideLine,
      alpha: { from: 1, to: 0.2 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });
    this.guideLine.visible = false;
  }

  updateGuideLine(edge) {
     if (!edge) return;

     const paperContainer = this.paperContainer;

    const r = paperContainer.paperRect;
    const foldLeft = paperContainer.foldLeft;
    const foldRight = paperContainer.foldRight;
    const foldTop = paperContainer.foldTop;
    const foldBottom = paperContainer.foldBottom;
    const foldTopLeft = paperContainer.foldTopLeft;
    const foldTopRight = paperContainer.foldTopRight;
    const foldBottomLeft = paperContainer.foldBottomLeft;
    const foldBottomRight = paperContainer.foldBottomRight;

    const px = paperContainer.x;
    const py = paperContainer.y;

    this.guideLine.clear();
    this.guideLine.lineStyle(6, 0xffffff, 1); // 白色引导线 // 线宽4像素，白色，不透明
    this.guideLine.beginPath();
    if (edge === 'left') {
      this.guideLine.moveTo(px + r.x + foldLeft, py + r.centerY - EDGE_Y_THRESHOLD);
      this.guideLine.lineTo(px + r.x + foldLeft, py + r.centerY + EDGE_Y_THRESHOLD);
    } else if (edge === 'right') {
      this.guideLine.moveTo(px + r.right - foldRight, py + r.centerY - EDGE_Y_THRESHOLD);
      this.guideLine.lineTo(px + r.right - foldRight, py + r.centerY + EDGE_Y_THRESHOLD);
    } else if (edge === 'top') {
      this.guideLine.moveTo(px + r.centerX - EDGE_Y_THRESHOLD, py + r.top + foldTop);
      this.guideLine.lineTo(px + r.centerX + EDGE_Y_THRESHOLD, py + r.top + foldTop);
    } else if (edge === 'bottom') {
      this.guideLine.moveTo(px + r.centerX - EDGE_Y_THRESHOLD, py + r.bottom - foldBottom);
      this.guideLine.lineTo(px + r.centerX + EDGE_Y_THRESHOLD, py + r.bottom - foldBottom);
    } else if (edge === 'topLeft') {
      const f = foldTopLeft;
  if (f === 0) {
    this.guideLine.moveTo(px + r.x, py + r.top);
    this.guideLine.lineTo(px + r.x + EDGE_ANGLE_THRESHOLD, py + r.top);
    this.guideLine.moveTo(px + r.x, py + r.top);
    this.guideLine.lineTo(px + r.x, py + r.top + EDGE_ANGLE_THRESHOLD);
  } else if (f < EDGE_ANGLE_THRESHOLD) {
    this.guideLine.moveTo(px + r.x, py + r.top + EDGE_ANGLE_THRESHOLD);
    this.guideLine.lineTo(px + r.x, py + r.top + f);
    this.guideLine.lineTo(px + r.x + f, py + r.top + f);
    this.guideLine.lineTo(px + r.x + f, py + r.top);
    this.guideLine.lineTo(px + r.x + EDGE_ANGLE_THRESHOLD, py + r.top);
  } else {
    this.guideLine.moveTo(px + r.x + f, py + r.top + f);
    this.guideLine.lineTo(px + r.x + f, py + r.top + f - EDGE_ANGLE_THRESHOLD);
    this.guideLine.moveTo(px + r.x + f, py + r.top + f);
    this.guideLine.lineTo(px + r.x + f - EDGE_ANGLE_THRESHOLD, py + r.top + f);
  }
    } else if (edge === 'topRight') {
      const f = foldTopRight;
  if (f === 0) {
    this.guideLine.moveTo(px + r.right, py + r.top);
    this.guideLine.lineTo(px + r.right - EDGE_ANGLE_THRESHOLD, py + r.top);
    this.guideLine.moveTo(px + r.right, py + r.top);
    this.guideLine.lineTo(px + r.right, py + r.top + EDGE_ANGLE_THRESHOLD);
  } else if (f < EDGE_ANGLE_THRESHOLD) {
    this.guideLine.moveTo(px + r.right, py + r.top + EDGE_ANGLE_THRESHOLD);
    this.guideLine.lineTo(px + r.right, py + r.top + f);
    this.guideLine.lineTo(px + r.right - f, py + r.top + f);
    this.guideLine.lineTo(px + r.right - f, py + r.top);
    this.guideLine.lineTo(px + r.right - EDGE_ANGLE_THRESHOLD, py + r.top);
  } else {
    this.guideLine.moveTo(px + r.right - f, py + r.top + f);
    this.guideLine.lineTo(px + r.right - f, py + r.top + f - EDGE_ANGLE_THRESHOLD);
    this.guideLine.moveTo(px + r.right - f, py + r.top + f);
    this.guideLine.lineTo(px + r.right - f + EDGE_ANGLE_THRESHOLD, py + r.top + f);
  }
    } else if (edge === 'bottomLeft') {
      const f = foldBottomLeft;
  if (f === 0) {
    this.guideLine.moveTo(px + r.x, py + r.bottom);
    this.guideLine.lineTo(px + r.x + EDGE_ANGLE_THRESHOLD, py + r.bottom);
    this.guideLine.moveTo(px + r.x, py + r.bottom);
    this.guideLine.lineTo(px + r.x, py + r.bottom - EDGE_ANGLE_THRESHOLD);
  } else if (f < EDGE_ANGLE_THRESHOLD) {
    this.guideLine.moveTo(px + r.x, py + r.bottom - EDGE_ANGLE_THRESHOLD);
    this.guideLine.lineTo(px + r.x, py + r.bottom - f);
    this.guideLine.lineTo(px + r.x + f, py + r.bottom - f);
    this.guideLine.lineTo(px + r.x + f, py + r.bottom);
    this.guideLine.lineTo(px + r.x + EDGE_ANGLE_THRESHOLD, py + r.bottom);
  } else {
    this.guideLine.moveTo(px + r.x + f, py + r.bottom - f);
    this.guideLine.lineTo(px + r.x + f - EDGE_ANGLE_THRESHOLD, py + r.bottom - f);
    this.guideLine.moveTo(px + r.x + f, py + r.bottom - f);
    this.guideLine.lineTo(px + r.x + f, py + r.bottom - f + EDGE_ANGLE_THRESHOLD);
  }
    } else if (edge === 'bottomRight') {
      const f = foldBottomRight;
  if (f === 0) {
    this.guideLine.moveTo(px + r.right, py + r.bottom);
    this.guideLine.lineTo(px + r.right - EDGE_ANGLE_THRESHOLD, py + r.bottom);
    this.guideLine.moveTo(px + r.right, py + r.bottom);
    this.guideLine.lineTo(px + r.right, py + r.bottom - EDGE_ANGLE_THRESHOLD);
  } else if (f < EDGE_ANGLE_THRESHOLD) {
    this.guideLine.moveTo(px + r.right, py + r.bottom - EDGE_ANGLE_THRESHOLD);
    this.guideLine.lineTo(px + r.right, py + r.bottom - f);
    this.guideLine.lineTo(px + r.right - f, py + r.bottom - f);
    this.guideLine.lineTo(px + r.right - f, py + r.bottom);
    this.guideLine.lineTo(px + r.right - f, py + r.bottom);
  } else {
    this.guideLine.moveTo(px + r.right - f, py + r.bottom - f);
    this.guideLine.lineTo(px + r.right - f + EDGE_ANGLE_THRESHOLD, py + r.bottom - f);
    this.guideLine.moveTo(px + r.right - f, py + r.bottom - f);
    this.guideLine.lineTo(px + r.right - f, py + r.bottom - f + EDGE_ANGLE_THRESHOLD);
  }
    }
    this.guideLine.strokePath();
  }

  setGuideLineVisible(visible) {
    this.guideLine.visible = visible;
  }
}