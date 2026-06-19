/**
 * 序章引导场景
 * 描述：
 *   - 初始纸张闭合，中间留一条白缝，像闭合的双眼
 *   - 引导玩家向上和下拖拽打开纸张，模仿睁开双眼
 */
import Phaser from 'phaser';
import { PAPER_WIDTH, PAPER_HEIGHT, CELL_SIZE, GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';
import { PaperContainer } from '../components/PaperContainer.js';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TutorialScene' });

    // 引导状态
    this.tutorialStarted = false;
    this.dialogueComplete = false;
    this.foldComplete = false;
    this.foldRequired = 0; // 需要折叠的距离

    // 分步引导状态：'top' 先引导向上滑，'bottom' 再引导向下滑，'done' 完成
    this.guidePhase = 'top';
    this.topGuideComplete = false;  // 上方引导是否完成
    this.bottomGuideComplete = false; // 下方引导是否完成

    // 音效相关
    this.currentDialogueSound = null; // 当前播放的对话音效
    this.soundEnabled = true; // 音效开关

    // 视频相关
    this.videoPlayed = false; // 视频是否已播放
  }

  preload() {
    // 加载引导视频
    this.load.video('intro_video', 'assets/video.mp4', true); // true = 无音频，允许自动播放

    // 加载纸张相关资源（使用正式背景资源，使用唯一键名避免冲突）
    this.load.image('tutorial_back', 'assets/bg_2_0.png');   // 背面纸张
    this.load.image('tutorial_front', 'assets/bg_1_1.png');  // 正面纸张
    this.load.image('bg_2_0', 'assets/bg_2_0.png');  // 底层纹理

    // 加载道路资源
    this.load.image('road', 'assets/road.png');

    // 加载箭头图片资源
    this.load.image('arrow', 'assets/arrow.png');

    // 加载对话音效
    this.load.audio('dialogue_1', 'assets/audio/dialogue_1.wav');
    this.load.audio('dialogue_2', 'assets/audio/dialogue_2.wav');
    
    // 加载小手资源
    this.load.image('hand', 'assets/hand.png');
  }

  create() {
    // 先播放引导视频
    this.playIntroVideo();
  }

  /**
   * 播放引导视频（使用 Phaser Video API）
   */
  playIntroVideo() {
    // 设置黑色背景
    this.cameras.main.setBackgroundColor('#000000');

    // 获取屏幕尺寸
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // 创建视频对象（居中显示）
    this.introVideo = this.add.video(screenWidth / 2, screenHeight / 2, 'intro_video');

    // 设置视频原点为中心
    this.introVideo.setOrigin(0.5);

    // 限制视频最大尺寸为 600x600
    const maxSize = 600;
    const videoWidth = this.introVideo.width || maxSize;
    const videoHeight = this.introVideo.height || maxSize;

    // 计算缩放比例，限制在 600x600 内
    const scaleX = maxSize / videoWidth;
    const scaleY = maxSize / videoHeight;
    const scale = Math.min(scaleX, scaleY, 1); // 不超过原始尺寸
    this.introVideo.setScale(scale);

    // 设置视频深度为最高
    this.introVideo.setDepth(1000);

    // 监听视频播放完成事件（Phaser Video 使用 'ended' 事件）
    this.introVideo.once('ended', () => {
      this.videoPlayed = true;
      this.introVideo.destroy();
      this.initTutorial();
    });

    // 监听视频播放错误
    this.introVideo.once('error', () => {
      console.log('视频播放出错');
      this.videoPlayed = true;
      this.introVideo.destroy();
      this.initTutorial();
    });

    // 添加点击跳过功能（防止视频无法自动播放时卡住）
    const skipButton = this.add.text(screenWidth / 2, screenHeight - 50, '点击跳过', {
      fontSize: '20px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(1001).setInteractive();

    skipButton.on('pointerdown', () => {
      this.videoPlayed = true;
      skipButton.destroy();
      this.introVideo.destroy();
      this.initTutorial();
    });

    // 处理浏览器自动播放限制：监听 playing 事件判断播放是否成功
    let playButton = null;
    const playTimeout = setTimeout(() => {
      // 如果一段时间后还没开始播放，显示播放按钮
      if (!this.introVideo.isPlaying()) {
        playButton = this.add.text(screenWidth / 2, screenHeight / 2, '▶ 点击播放', {
          fontSize: '32px',
          fontFamily: 'Microsoft YaHei',
          color: '#ffffff',
          backgroundColor: '#444',
          padding: { x: 20, y: 10 },
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5).setDepth(1001).setInteractive();

        playButton.on('pointerdown', () => {
          playButton.destroy();
          this.introVideo.play(true);
        });
      }
    }, 500);

    // 播放成功后清除超时
    this.introVideo.once('playing', () => {
      clearTimeout(playTimeout);
      if (playButton) {
        playButton.destroy();
        playButton = null;
      }
    });

    // 播放视频
    this.introVideo.play(true);
  }

  /**
   * 初始化引导场景
   */
  initTutorial() {
    // 设置场景背景
    this.cameras.main.setBackgroundColor('#000000');
    
    // 创建纸张配置（空白纸张，无道路和装饰）
    const tutorialPaperData = {
      roadMap: Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0)),
      backRoadMap: Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0)),
      frontDecorations: [],
      backDecorations: [],
      frontPaper: 'tutorial_front',  // 正面背景纹理
      backPaper: 'tutorial_back'     // 背面背景纹理
    };
    
    // 创建 PaperContainer，使用 bg_2_0 作为底层纹理
    this.paperContainer = new PaperContainer(
      this,
      this.cameras.main.centerX - PAPER_WIDTH / 2,
      this.cameras.main.centerY - PAPER_HEIGHT / 2,
      'tutorial_paper',
      tutorialPaperData,
      'bg_2_0'
    );
    
    // 设置 PaperContainer 的深度为 0，确保箭头和小手能显示在上面
    this.paperContainer.setDepth(0);
    
    // 初始化为闭合状态（上下各折叠一半）
    this.paperContainer.foldTop = PAPER_HEIGHT / 2 - 5;
    this.paperContainer.foldBottom = PAPER_HEIGHT / 2 - 5;
    this.paperContainer.updateMask();
    this.paperContainer.calculateEffectiveRoadMap();
    
    // 创建中心白缝效果
    this.createCenterGap();
    
    // 设置用户交互以启用音频（浏览器自动播放限制）
    this.setupAudioUnlock();
    
    // 显示对话框
    this.showDialogue();
    
    // 设置拖拽监听
    this.setupDragListener();
    
    // 创建引导提示
    this.createGuideText();
    
    // 初始化鼠标输入
    this.initInput();
  }

  /**
   * 设置用户交互以解锁音频播放（浏览器自动播放限制）
   */
  setupAudioUnlock() {
    // 首次点击时恢复音频上下文
    this.input.once('pointerdown', () => {
      if (this.sound.locked) {
        // 强制恢复音频上下文
        this.sound.unlock();
      }
    });
    
    // 同时监听任何触摸/点击事件
    this.children.bringToTop(this.paperContainer);
  }

  /**
   * 创建中心白缝效果
   */
  createCenterGap() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    // 白色缝隙
    this.centerGap = this.add.graphics();
    this.centerGap.fillStyle(0xffffff, 1);
    this.centerGap.fillRect(centerX - 1, centerY - 1, 2, 2);
    this.centerGap.setDepth(100);
  }

  /**
   * 显示对话框
   */
  showDialogue() {
    const centerX = this.cameras.main.centerX;
    
    // 对话框背景
    this.dialogueBox = this.add.graphics();
    this.dialogueBox.fillStyle(0x000000, 0.8);
    this.dialogueBox.fillRoundedRect(centerX - 300, this.cameras.main.height - 150, 600, 120, 10);
    this.dialogueBox.setDepth(100);
    this.dialogueBox.setAlpha(0);
    
    // 对话框边框
    this.dialogueBox.lineStyle(2, 0x666666);
    this.dialogueBox.strokeRoundedRect(centerX - 300, this.cameras.main.height - 150, 600, 120, 10);
    
    // 角色名
    this.nameText = this.add.text(centerX - 270, this.cameras.main.height - 140, '主人公', {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffcc00'
    });
    this.nameText.setDepth(101);
    this.nameText.setAlpha(0);
    
    // 对话内容
    this.dialogueText = this.add.text(centerX - 270, this.cameras.main.height - 110, '', {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      wordWrap: { width: 540 }
    });
    this.dialogueText.setDepth(101);
    this.dialogueText.setAlpha(0);
    
    // 对话序列
    this.dialogues = [
      { name: '主人公【剪影】', text: '我是谁….我在哪…...' },
      { name: '主人公【剪影】', text: '眼皮好沉重……' },
      { name: '主人公【剪影】', text: '我要想办法尽快恢复行动…..' }
    ];
    
    this.currentDialogueIndex = 0;
    
    // 点击屏幕继续提示
    this.clickHint = this.add.text(centerX, this.cameras.main.height - 60, '点击继续 ▼', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      alpha: 0.7
    });
    this.clickHint.setOrigin(0.5);
    this.clickHint.setDepth(101);
    this.clickHint.setAlpha(0);
    
    // 监听点击事件
    this.input.on('pointerdown', () => this.onClick());
    
    // 开始对话序列
    this.time.delayedCall(500, () => this.showNextDialogue());
  }

  /**
   * 显示下一条对话
   */
  showNextDialogue() {
    if (this.currentDialogueIndex >= this.dialogues.length) {
      this.dialogueComplete = true;
      this.hideDialogue();
      this.startTutorial();
      return;
    }
    
    const dialogue = this.dialogues[this.currentDialogueIndex];
    
    // 显示对话框
    this.tweens.add({
      targets: [this.dialogueBox, this.nameText, this.dialogueText],
      alpha: 1,
      duration: 300,
      onStart: () => {
        // 播放对话框出现音效
        // this.playSound('dialogue_start');
      }
    });
    
    // 更新角色名
    this.nameText.setText(dialogue.name);
    
    // 播放当前对话对应的音效
    this.playDialogueSound(this.currentDialogueIndex + 1);
    
    // 逐字显示对话内容
    this.typeText(dialogue.text, () => {
      // 停止当前对话音效
      this.stopDialogueSound();
      
      // 显示点击继续提示
      this.tweens.add({
        targets: this.clickHint,
        alpha: 0.7,
        duration: 300
      });
    });
  }
  
  /**
   * 点击事件处理
   */
  onClick() {
    if (!this.dialogueComplete && this.currentDialogueIndex < this.dialogues.length) {
      // 隐藏点击提示
      this.tweens.add({
        targets: this.clickHint,
        alpha: 0,
        duration: 200
      });
      
      // 停止当前对话音效
      this.stopDialogueSound();
      
      // 进入下一条对话
      this.currentDialogueIndex++;
      this.hideDialogue(() => this.showNextDialogue());
    }
  }

  /**
   * 逐字显示文本
   */
  typeText(text, callback) {
    this.dialogueText.setText('');
    let index = 0;
    
    const timer = this.time.addEvent({
      delay: 50,
      callback: () => {
        this.dialogueText.setText(text.substring(0, index + 1));
        index++;
        
        if (index >= text.length) {
          timer.remove();
          if (callback) callback();
        }
      },
      loop: true
    });
  }

  /**
   * 隐藏对话框
   */
  hideDialogue(callback) {
    this.tweens.add({
      targets: [this.dialogueBox, this.nameText, this.dialogueText],
      alpha: 0,
      duration: 300,
      onComplete: callback
    });
  }

  /**
   * 开始教程引导
   */
  startTutorial() {
    this.tutorialStarted = true;
    
    // 显示引导提示 - 只显示上方阶段的元素
    this.tweens.add({
      targets: [this.guideText, this.upArrow, this.upHand],
      alpha: 1,
      duration: 500,
      onComplete: () => {
        // 显示完成后开始小手演示动画
        this.startHandDemo();
      }
    });
    
    // 淡出中心缝隙
    this.tweens.add({
      targets: this.centerGap,
      alpha: 0.3,
      duration: 500
    });
  }

  /**
   * 创建引导提示文字
   */
  createGuideText() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    // 上下拖拽提示（初始提示向上滑）
    this.guideText = this.add.text(centerX, centerY - 120, '向上拖拽打开上眼', {
      fontSize: '20px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 15, y: 10 }
    });
    this.guideText.setOrigin(0.5);
    this.guideText.setDepth(50);
    this.guideText.setAlpha(0);
    
    // 箭头提示 - 初始只显示上箭头
    this.upArrow = this.createArrow(centerX, centerY - 20, 'up');
    this.downArrow = this.createArrow(centerX, centerY + 20, 'down');
    this.downArrow.setAlpha(0); // 初始隐藏下箭头
    
    // 创建小手（初始位置在中心偏右80像素，避免和箭头重叠）
    // 初始只显示上方小手
    this.upHand = this.createHand(centerX + 80, centerY, 'up');
    this.downHand = this.createHand(centerX + 80, centerY, 'down');
    this.downHand.setAlpha(0); // 初始隐藏下方小手
  }

  /**
   * 创建小手
   */
  createHand(x, y, direction) {
    const hand = this.add.image(x, y, 'hand');
    hand.setDepth(200);  // 提高深度，确保在所有内容之上
    hand.setAlpha(1);    // 直接显示
    hand.setOrigin(0.5);
    hand.setScale(0.8);  // 适当缩小一点
    // 向下的小手翻转
    if (direction === 'down') {
      hand.setFlipY(true);
    }
    return hand;
  }

  /**
   * 开始小手演示动画
   */
  startHandDemo() {
    // 根据当前引导阶段播放对应的小手动画
    if (this.guidePhase === 'top' && this.upHand) {
      // 上方阶段：只播放上方小手动画
      this.tweens.add({
        targets: this.upHand,
        y: this.upHand.y - 60,
        duration: 600,
        ease: 'Power1',
        yoyo: true,
        repeat: -1,
        delay: 200
      });
    } else if (this.guidePhase === 'bottom' && this.downHand) {
      // 下方阶段：只播放下方小手动画
      this.tweens.add({
        targets: this.downHand,
        y: this.downHand.y + 60,
        duration: 600,
        ease: 'Power1',
        yoyo: true,
        repeat: -1
      });
    }
  }

  /**
   * 创建箭头
   */
  createArrow(x, y, direction) {
    // 使用图片资源创建箭头
    const arrow = this.add.image(x, y, 'arrow');
    arrow.setDepth(201);  // 提高深度
    arrow.setAlpha(1);    // 直接显示
    arrow.setOrigin(0.5);
    arrow.setScale(0.8);  // 适当缩放
    // 根据方向翻转箭头
    if (direction === 'up') {
      arrow.setFlipY(true);
    }
    
    // 添加引导拖拽动画
    // 上箭头向上移动100像素，下箭头向下移动100像素
    this.tweens.add({
      targets: arrow,
      y: direction === 'up' ? y - 100 : y + 100,  // 大幅度移动
      duration: 1000,                             // 动画时长1秒
      yoyo: true,                                 // 往返振动
      repeat: -1,                                 // 无限循环
      ease: 'Sine.easeInOut'                      // 平滑缓动
    });
    
    return arrow;
  }

  /**
   * 设置拖拽监听
   */
  setupDragListener() {
    // 监听 PaperContainer 的折叠更新事件
    this.events.on('foldUpdate', this.checkFoldProgress, this);
  }

  /**
   * 初始化鼠标输入
   */
  initInput() {
    this.input.mouse.disableContextMenu();

    // 鼠标/触摸点击监听
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
  }

  /**
   * 鼠标按下处理
   */
  onDown(p) {
    // 对话进行中不响应
    if (!this.dialogueComplete) return;
    
    this.paperContainer.onDown(p);
  }

  /**
   * 鼠标移动处理
   */
  onMove(p) {
    // 对话进行中不响应
    if (!this.dialogueComplete) return;
    
    this.paperContainer.onMove(p);
  }

  /**
   * 鼠标抬起处理
   */
  onUp(p) {
    // 对话进行中不响应
    if (!this.dialogueComplete) return;
    
    this.paperContainer.onUp(p);
  }

  /**
   * 检查折叠进度
   */
  checkFoldProgress() {
    if (!this.tutorialStarted || this.foldComplete) return;
    
    const foldTop = this.paperContainer.foldTop;
    const foldBottom = this.paperContainer.foldBottom;
    
    // 检查是否完成（上下都完全打开，foldTop 和 foldBottom 都接近 0）
    if (foldTop <= 5 && foldBottom <= 5) {
      this.foldComplete = true;
      this.onFoldComplete();
    }
  }

  /**
   * 折叠完成处理
   */
  onFoldComplete() {
    // 淡出场景并切换到游戏场景
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  /**
   * 更新循环
   */
  update() {
    // 持续检查折叠进度
    if (this.tutorialStarted && !this.foldComplete) {
      this.checkFoldProgress();
      this.updateHandPosition();
    }
  }

  /**
   * 更新小手位置
   */
  updateHandPosition() {
    if (!this.paperContainer) return;
    
    // 获取折叠偏移量
    const foldTop = this.paperContainer.foldTop;
    const foldBottom = this.paperContainer.foldBottom;
    
    // 获取纸张容器位置
    const paperY = this.paperContainer.y;
    const centerX = this.cameras.main.centerX;
    
    // ========== 上方引导阶段 ==========
    if (this.guidePhase === 'top') {
      // 当用户开始折叠时，停止演示动画
      if (foldTop < PAPER_HEIGHT / 2 - 10 && this.demoStopped !== true) {
        this.demoStopped = true;
        if (this.upHand) this.tweens.killTweensOf(this.upHand);
      }
      
      // 更新上方小手位置，跟随顶部边缘
      if (this.upHand) {
        this.upHand.y = paperY + foldTop;
      }
      
      // 上方完全打开（foldTop 接近 0），切换到下方阶段
      if (foldTop <= 5 && !this.topGuideComplete) {
        this.topGuideComplete = true;
        this.guidePhase = 'bottom';
        this.demoStopped = false; // 重置以便下方小手动画
        
        // 隐藏上方小手和箭头
        if (this.upHand) {
          this.tweens.add({
            targets: this.upHand,
            alpha: 0,
            duration: 300
          });
        }
        if (this.upArrow) {
          this.tweens.add({
            targets: this.upArrow,
            alpha: 0,
            duration: 300
          });
        }
        
        // 更新提示文字
        if (this.guideText) {
          this.guideText.setText('向下拖拽打开下眼');
          this.tweens.add({
            targets: this.guideText,
            alpha: 1,
            duration: 300
          });
        }
        
        // 显示下方小手和箭头
        if (this.downHand) {
          this.downHand.y = paperY + PAPER_HEIGHT - foldBottom;
          this.tweens.add({
            targets: this.downHand,
            alpha: 1,
            duration: 300,
            onComplete: () => {
              // 开始下方小手演示动画
              this.startHandDemo();
            }
          });
        }
        if (this.downArrow) {
          this.tweens.add({
            targets: this.downArrow,
            alpha: 1,
            duration: 300
          });
        }
      }
    }
    // ========== 下方引导阶段 ==========
    else if (this.guidePhase === 'bottom') {
      // 当用户开始折叠时，停止演示动画
      if (foldBottom < PAPER_HEIGHT / 2 - 10 && this.demoStopped !== true) {
        this.demoStopped = true;
        if (this.downHand) this.tweens.killTweensOf(this.downHand);
      }
      
      // 更新下方小手位置，跟随底部边缘
      if (this.downHand) {
        this.downHand.y = paperY + PAPER_HEIGHT - foldBottom;
      }
      
      // 下方完全打开（foldBottom 接近 0），完成引导
      if (foldBottom <= 5 && !this.bottomGuideComplete) {
        this.bottomGuideComplete = true;
        this.guidePhase = 'done';
        
        // 隐藏下方小手和箭头
        if (this.downHand) {
          this.tweens.add({
            targets: this.downHand,
            alpha: 0,
            duration: 300
          });
        }
        if (this.downArrow) {
          this.tweens.add({
            targets: this.downArrow,
            alpha: 0,
            duration: 300
          });
        }
        
        // 隐藏提示文字
        if (this.guideText) {
          this.tweens.add({
            targets: this.guideText,
            alpha: 0,
            duration: 300
          });
        }
      }
    }
  }

  // ==================== 音效播放方法 ====================

  /**
   * 播放普通音效
   * @param {string} key - 音效资源键名
   * @param {object} options - 播放选项
   */
  playSound(key, options = {}) {
    if (!this.soundEnabled) return;
    
    try {
      const sound = this.sound.add(key, {
        volume: options.volume || 0.5,
        loop: options.loop || false,
        ...options
      });
      sound.play();
      return sound;
    } catch (error) {
      console.warn(`音效文件未找到或无法播放: ${key}`);
      return null;
    }
  }

  /**
   * 播放对话音效
   * @param {number} dialogueIndex - 对话索引（1-based）
   */
  playDialogueSound(dialogueIndex) {
    const soundKey = `dialogue_${dialogueIndex}`;
    this.currentDialogueSound = this.playSound(soundKey, {
      volume: 0.6,
      loop: false
    });
  }

  /**
   * 停止当前对话音效
   */
  stopDialogueSound() {
    if (this.currentDialogueSound && this.currentDialogueSound.isPlaying) {
      this.currentDialogueSound.stop();
      this.currentDialogueSound = null;
    }
  }
}
