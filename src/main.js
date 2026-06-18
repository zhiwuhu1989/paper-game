import Phaser from 'phaser';
import { TutorialScene } from './scenes/TutorialScene.js';
import { GameScene } from './scenes/GameScene.js';
import { PuzzleScene } from './scenes/PuzzleScene.js';

// 获取屏幕尺寸
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

// 等待 DOM 加载完成
const config = {
  type: Phaser.AUTO,
  width: screenWidth,       // 使用屏幕宽度
  height: screenHeight,     // 使用屏幕高度
  parent: 'game-container', // 指定父容器
  scene: [TutorialScene, GameScene, PuzzleScene],  // 先启动引导场景，完成后切换到游戏场景
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scale: {
    // 模式设置为 FIT，保持宽高比并适应屏幕
    mode: Phaser.Scale.FIT,
    // 最小尺寸限制
    min: {
      width: 800,
      height: 600
    },
    // 最大尺寸为屏幕尺寸
    max: {
      width: screenWidth,
      height: screenHeight
    },
    // 自动居中
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // 监听窗口大小变化
    resizeInterval: 100
  },
  // 启用抗锯齿
  antialias: true
};

new Phaser.Game(config);
