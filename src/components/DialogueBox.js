import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.dialogues = [];
    this.currentIndex = 0;
    this.onComplete = null;

    this.createUI();
  }

  createUI() {
    // 使用相机尺寸而不是固定尺寸
    const camera = this.scene.cameras.main;
    const cameraWidth = camera.width;
    const cameraHeight = camera.height;
    
    const boxWidth = cameraWidth * 0.8;
    const boxHeight = 120;
    const boxX = (cameraWidth - boxWidth) / 2;
    const boxY = cameraHeight - boxHeight - 20;

    // Background box
    this.bg = this.scene.add.graphics();
    this.bg.setScrollFactor(0);
    this.bg.setDepth(2000);
    this.bg.fillStyle(0x000000, 0.85);
    this.bg.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 12);
    this.bg.lineStyle(2, 0xffffff, 0.6);
    this.bg.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 12);

    // Speaker name
    this.speakerText = this.scene.add.text(boxX + 16, boxY + 12, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2
    }).setScrollFactor(0).setDepth(2001);

    // Dialogue text
    this.dialogueText = this.scene.add.text(boxX + 16, boxY + 36, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 32 },
      lineSpacing: 4
    }).setScrollFactor(0).setDepth(2001);

    // Continue hint
    this.hintText = this.scene.add.text(boxX + boxWidth - 16, boxY + boxHeight - 16, '点击继续 ▶', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#aaaaaa'
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(2001);

    // Blink animation for hint
    this.scene.tweens.add({
      targets: this.hintText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Click zone (covers the dialogue box area)
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

    this.bg.setVisible(true);
    this.speakerText.setVisible(true);
    this.dialogueText.setVisible(true);
    this.hintText.setVisible(true);
    
    // 检查 clickZone 是否存在
    if (this.clickZone && this.clickZone.setInteractive) {
      this.clickZone.setInteractive();
    }

    this.displayCurrent();
  }

  hide() {
    this.isActive = false;
    this.bg.setVisible(false);
    this.speakerText.setVisible(false);
    this.dialogueText.setVisible(false);
    this.hintText.setVisible(false);
    
    // 检查 clickZone 是否存在
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
    let speakerName, speakerColor;
    
    if (dialogue.speaker === 'npc') {
      speakerName = this.speakerNames.npc || 'NPC';
      speakerColor = '#00ccff';
    } else if (dialogue.speaker === 'system') {
      speakerName = this.speakerNames.system || '系统';
      speakerColor = '#ff6666';
    } else {
      speakerName = this.speakerNames.player || '你';
      speakerColor = '#ffcc00';
    }

    this.speakerText.setText(`【${speakerName}】`);
    this.speakerText.setColor(speakerColor);
    this.dialogueText.setText(dialogue.text);

    if (this.currentIndex >= this.dialogues.length - 1) {
      this.hintText.setText('点击结束 ■');
    } else {
      this.hintText.setText('点击继续 ▶');
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