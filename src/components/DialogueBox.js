import { GAME_WIDTH, GAME_HEIGHT, PAPER_HEIGHT } from '../config/gameConfig.js';

export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.dialogues = [];
    this.currentIndex = 0;
    this.onComplete = null;
    
    // 角色立绘
    this.profileLeft = null;   // 左侧立绘（主角）
    this.profileRight = null;   // 右侧立绘（NPC）

    this.createUI();
  }

  createUI() {
    // 使用相机尺寸而不是固定尺寸
    const camera = this.scene.cameras.main;
    const cameraWidth = camera.width;
    const cameraHeight = camera.height;

    // 对话框背景图片 - 使用原始尺寸
    this.dialogBg = this.scene.add.image(cameraWidth / 2, 0, 'dialog_bg');
    this.dialogBg.setOrigin(0.5, 0.5);
    this.dialogBg.setScrollFactor(0);
    this.dialogBg.setDepth(2000);
    // 使用原始尺寸，不缩放
    this.dialogBg.setScale(1);

    // 对话框底部对齐纸张下边缘
    const paperBottomY = cameraHeight / 2 + PAPER_HEIGHT / 2;
    this.dialogBg.y = paperBottomY - this.dialogBg.height / 2;

    // 获取对话框实际尺寸
    const boxWidth = this.dialogBg.width;
    const boxHeight = this.dialogBg.height;
    const boxX = this.dialogBg.x - boxWidth / 2;
    const boxY = this.dialogBg.y - boxHeight / 2;

    // 说话者名称背景 - 使用原始尺寸
    const speakerBgX = boxX + 40;
    const speakerBgY = boxY + 5;  // 下移5像素
    
    const speakerCenterX = speakerBgX + this.dialogBg.width * 0.15;
    
    this.speakerBg = this.scene.add.image(speakerCenterX, speakerBgY, 'dialog_speaker');
    this.speakerBg.setOrigin(0.5, 0.5);
    this.speakerBg.setScrollFactor(0);
    this.speakerBg.setDepth(2000);
    // 使用原始尺寸，不缩放
    this.speakerBg.setScale(1);

    // 说话者名称文字（美术效果图中的棕色文字）
    this.speakerText = this.scene.add.text(speakerCenterX, speakerBgY, '', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei',
      fontStyle: 'bold',
      color: '#8B5A2B',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

    // 对话文本（美术效果图中的棕色文字）
    const textPadding = 40;
    this.dialogueText = this.scene.add.text(boxX + textPadding, boxY + 25, '', {
      fontSize: '20px',
      fontFamily: 'Microsoft YaHei',
      color: '#6B4423',
      wordWrap: { width: boxWidth - textPadding * 2 },
      lineSpacing: 12
    }).setScrollFactor(0).setDepth(2001);

    // 继续提示三角形（使用原始尺寸）
    this.hintTriangle = this.scene.add.image(boxX + boxWidth - 35, boxY + boxHeight - 15, 'dialog_triangle');
    this.hintTriangle.setScrollFactor(0);
    this.hintTriangle.setDepth(2001);
    // 使用原始尺寸，不缩放
    this.hintTriangle.setScale(1);

    // 闪烁动画
    this.scene.tweens.add({
      targets: this.hintTriangle,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // 立绘容器（使用原始尺寸，不缩放）
    // 左侧立绘（主角）- 与说话者底居中对齐
    this.profileLeft = this.scene.add.image(speakerCenterX, boxY, 'profile_picture_1');
    this.profileLeft.setOrigin(0.5, 1);
    this.profileLeft.setScrollFactor(0);
    this.profileLeft.setDepth(1999);
    // 使用原始尺寸，不缩放
    this.profileLeft.setScale(1);
    this.profileLeft.setAlpha(0);

    // 右侧立绘（NPC）- 调整到对话框上方偏右位置，左移并下移
    this.profileRight = this.scene.add.image(boxX + boxWidth - 80, boxY + 15, 'profile_picture_2');
    this.profileRight.setOrigin(0.5, 1);
    this.profileRight.setScrollFactor(0);
    this.profileRight.setDepth(1999);
    // 使用原始尺寸，不缩放
    this.profileRight.setScale(1);
    this.profileRight.setAlpha(0);

    // Click zone
    this.clickZone = this.scene.add.zone(boxX, boxY, boxWidth, boxHeight)
      .setOrigin(0, 0)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(2002);

    this.clickZone.on('pointerdown', () => {
      this.advance();
    });

    this.hide();
  }

  show(dialogues, speakerNames, onComplete) {
    this.dialogues = dialogues;
    this.speakerNames = speakerNames || {};
    this.currentIndex = 0;
    this.onComplete = onComplete;
    this.isActive = true;

    this.dialogBg.setVisible(true);
    this.speakerBg.setVisible(true);
    this.speakerText.setVisible(true);
    this.dialogueText.setVisible(true);
    this.hintTriangle.setVisible(true);
    
    if (this.clickZone && this.clickZone.setInteractive) {
      this.clickZone.setInteractive();
    }

    this.displayCurrent();
  }

  hide() {
    this.isActive = false;
    this.dialogBg.setVisible(false);
    this.speakerBg.setVisible(false);
    this.speakerText.setVisible(false);
    this.dialogueText.setVisible(false);
    this.hintTriangle.setVisible(false);
    
    // 隐藏立绘
    if (this.profileLeft) this.profileLeft.setAlpha(0);
    if (this.profileRight) this.profileRight.setAlpha(0);
    
    if (this.clickZone && this.clickZone.disableInteractive) {
      this.clickZone.disableInteractive();
    }
  }

  displayCurrent() {
    if (this.currentIndex >= this.dialogues.length) {
      this.complete();
      return;
    }

    const dialogue = this.dialogues[this.currentIndex];
    let speakerName;
    
    if (dialogue.speaker === 'npc') {
      speakerName = this.speakerNames.npc || 'NPC';
    } else if (dialogue.speaker === 'system') {
      speakerName = this.speakerNames.system || '系统';
    } else {
      speakerName = this.speakerNames.player || '你';
    }

    this.speakerText.setText(speakerName);
    this.dialogueText.setText(dialogue.text);

    // 根据说话者显示立绘
    if (dialogue.speaker === 'npc') {
      // NPC 说话时显示右侧立绘
      this.profileLeft.setAlpha(0);
      this.profileRight.setAlpha(1);
    } else {
      // 主角或其他人说话时显示左侧立绘
      this.profileLeft.setAlpha(1);
      this.profileRight.setAlpha(0);
    }
  }

  advance() {
    if (!this.isActive) return;
    this.currentIndex++;
    this.displayCurrent();
  }

  complete() {
    this.hide();
    if (this.onComplete) {
      this.onComplete();
    }
  }
}
