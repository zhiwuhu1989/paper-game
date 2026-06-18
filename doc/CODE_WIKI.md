# Phaser-AI 项目 Code Wiki

## 目录
- [项目概述](#项目概述)
- [项目架构](#项目架构)
- [目录结构](#目录结构)
- [核心模块说明](#核心模块说明)
- [关键类与函数](#关键类与函数)
- [依赖关系](#依赖关系)
- [项目运行方式](#项目运行方式)
- [配置说明](#配置说明)

---

## 项目概述

**Phaser-AI** 是一个基于 **Phaser 3** 游戏引擎开发的纸折叠解谜游戏项目。游戏的核心玩法是通过折叠纸张来改变地图布局，玩家需要在折叠后的纸张上移动、与NPC交互、修复损坏的装饰物，最终完成拼图任务。

### 核心特性
- **纸张折叠系统**：支持8个方向的折叠（上、下、左、右、四个对角）
- **动态道路系统**：折叠后道路地图会实时变化
- **寻路系统**：支持单纸张和跨纸张的路径寻找
- **交互系统**：NPC对话、房屋解锁、物品收集
- **拼图小游戏**：独立的拼图场景

---

## 项目架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          入口层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  main.js    │  │ paper.html  │  │ gameConfig  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          场景层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │TutorialScene│  │ GameScene   │  │ PuzzleScene │              │
│  │  (引导场景)  │  │  (主场景)   │  │  (拼图场景) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        组件层 (Components)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │PaperContainer│  │ FrontPaper   │  │  BackPaper   │           │
│  │  (纸张容器)   │  │  (正面纸张)  │  │  (背面纸张)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   RoadMap    │  │  GuideLine   │  │ DialogueBox  │           │
│  │  (道路地图)   │  │  (引导线)    │  │  (对话框)    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  Inventory   │  │    Toast     │                              │
│  │   (背包)     │  │  (提示消息)  │                              │
│  └──────────────┘  └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        实体层 (Entities)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Player    │  │     NPC      │  │    House     │           │
│  │   (玩家)     │  │   (NPC)      │  │   (房屋)     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  DecoElement │  │    Tree      │                              │
│  │  (装饰元素)   │  │   (树木)     │                              │
│  └──────────────┘  └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        工具层 (Utils)                            │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │    WorldManager      │  │    WorldPathFinder   │             │
│  │    (世界管理器)       │  │    (世界寻路器)      │             │
│  └──────────────────────┘  └──────────────────────┘             │
│  ┌──────────────────────┐                                       │
│  │     PathFinder       │                                       │
│  │    (单纸寻路器)       │                                       │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
phaser-ai/
├── assets/                    # 游戏资源文件
│   ├── audio/                 # 音频文件
│   │   ├── dialogue_1.wav
│   │   └── dialogue_2.wav
│   ├── bg_1_0.png            # 背面纸张纹理
│   ├── bg_1_1.png            # 正面纸张纹理
│   ├── bridge_1_0.png        # 损坏的桥梁
│   ├── bridge_1_1.png        # 修复的桥梁
│   ├── fire_1_0.png          # 熄灭的火堆
│   ├── fire_1_1.png          # 燃烧的火堆
│   ├── house_1.png           # 房屋图片
│   ├── npc_1.png             # NPC图片
│   ├── npc_2.png
│   ├── npc_3.png
│   ├── paper_1.png           # 拼图图片
│   ├── paper_2.png
│   ├── protagonist.png       # 主角图片
│   ├── road.png              # 道路纹理
│   ├── tiles.png             # 瓷砖纹理
│   └── tree_*.png            # 树木图片
│
├── components/               # UI组件模块
│   ├── BackPaper.js         # 背面纸张管理器
│   ├── BackPaperSingle.js   # 单方向背面纸张
│   ├── DialogueBox.js       # 对话框组件
│   ├── FrontPaper.js        # 正面纸张组件
│   ├── GuideLine.js         # 折叠引导线
│   ├── Inventory.js         # 背包系统
│   ├── PaperContainer.js    # 纸张容器（核心）
│   ├── RoadMap.js           # 道路地图渲染
│   └── Toast.js             # 提示消息组件
│
├── config/                   # 配置文件
│   └── gameConfig.js        # 游戏核心配置
│
├── entities/                 # 游戏实体
│   ├── DecoElement.js       # 装饰元素基类
│   ├── House.js             # 房屋实体
│   ├── NPC.js               # NPC实体
│   ├── Player.js            # 玩家实体
│   └── Tree.js              # 树木实体
│
├── scenes/                   # 游戏场景
│   ├── GameScene.js         # 主游戏场景
│   ├── PuzzleScene.js       # 拼图场景
│   └── TutorialScene.js     # 引导场景
│
├── utils/                    # 工具类
│   ├── pathFinder.js        # 寻路算法
│   └── worldManager.js      # 世界管理器
│
├── main.js                   # 游戏入口文件
└── paper.html               # HTML入口页面
```

---

## 核心模块说明

### 1. 场景模块 (Scenes)

#### GameScene - 主游戏场景
**职责**：
- 管理游戏主循环和玩家交互
- 协调所有游戏组件和实体
- 处理玩家移动和寻路
- 管理NPC对话和房屋交互

**核心功能**：
- `createWorldLayers()` - 创建所有纸张容器
- `initPlayer()` - 初始化玩家
- `handleClickMove()` - 处理点击移动
- `checkInteractions()` - 检查NPC和房屋交互
- `triggerNPCDialogue()` - 触发NPC对话
- `triggerHouseInteraction()` - 触发房屋交互

#### PuzzleScene - 拼图场景
**职责**：
- 管理拼图小游戏
- 处理碎片拖拽和吸附
- 检测拼图完成状态

**核心功能**：
- `initPuzzle()` - 初始化拼图
- `createPuzzlePieces()` - 创建拼图碎片
- `snapToGrid()` - 碎片吸附到网格
- `checkCompletion()` - 检查拼图完成

#### TutorialScene - 引导场景
**职责**：
- 游戏开场引导
- 教玩家如何折叠纸张
- 播放对话和音效

**核心功能**：
- `showDialogue()` - 显示对话
- `setupDragListener()` - 设置拖拽监听
- `checkFoldProgress()` - 检查折叠进度

---

### 2. 组件模块 (Components)

#### PaperContainer - 纸张容器（核心组件）
**职责**：
- 管理单张纸的所有折叠状态
- 处理折叠交互和遮罩
- 计算有效道路地图
- 协调正面和背面纸张

**折叠状态变量**：
```javascript
foldTop, foldBottom, foldLeft, foldRight           // 四边折叠量
foldTopLeft, foldTopRight, foldBottomLeft, foldBottomRight  // 四角折叠量
```

**核心方法**：
- `updateMask()` - 更新遮罩形状
- `calculateEffectiveRoadMap()` - 计算有效道路
- `getFoldCoverage()` - 获取折叠覆盖区域
- `testPaperEdge()` - 检测可折叠边缘
- `isPlayerOnFoldArea()` - 检查玩家是否在折叠区

#### FrontPaper - 正面纸张
**职责**：
- 渲染正面纸张背景
- 管理道路和装饰元素
- 处理装饰修复逻辑

**核心方法**：
- `initElements()` - 初始化装饰元素
- `checkRepair()` - 检查装饰修复条件
- `showHiddenRoad()` - 显示隐藏道路

#### BackPaper - 背面纸张管理器
**职责**：
- 管理所有方向的背面纸张
- 处理背面纸张的位置更新

**核心方法**：
- `updatePos()` - 更新所有背面纸张位置
- `setLookState()` - 设置查看状态

#### RoadMap - 道路地图
**职责**：
- 渲染道路网格
- 动态更新道路显示

#### GuideLine - 引导线
**职责**：
- 显示折叠引导线
- 指示可折叠方向

#### DialogueBox - 对话框
**职责**：
- 显示NPC对话
- 处理对话序列

#### Inventory - 背包系统
**职责**：
- 管理玩家物品
- 显示背包UI

#### Toast - 提示消息
**职责**：
- 显示临时提示消息
- 消息队列管理

---

### 3. 实体模块 (Entities)

#### Player - 玩家
**职责**：
- 管理玩家位置和移动
- 处理玩家动画

**核心方法**：
- `moveTo()` - 移动到指定位置
- `getCurrentTile()` - 获取当前格子

#### NPC - 非玩家角色
**职责**：
- 管理NPC状态和对话
- 处理任务奖励

**核心属性**：
- `dialogues` - 对话序列
- `reward` - 奖励物品
- `requiredRepair` - 任务要求

#### House - 房屋
**职责**：
- 管理房屋状态
- 处理解锁逻辑

**核心方法**：
- `unlock()` - 解锁房屋
- `isAdjacentToDoor()` - 检查是否靠近门

#### DecoElement - 装饰元素
**职责**：
- 管理装饰元素状态
- 处理修复逻辑

**核心方法**：
- `checkRepair()` - 检查修复条件
- `doRepair()` - 执行修复

---

### 4. 工具模块 (Utils)

#### WorldManager - 世界管理器
**职责**：
- 管理多张纸张的配置和数据
- 提供纸张数据访问接口

**核心方法**：
- `loadPaper()` - 加载纸张数据
- `getNeighbors()` - 获取邻居纸张
- `setCurrentPaperId()` - 设置当前纸张

#### PathFinder - 单纸寻路器
**职责**：
- 在单张纸上寻找最短路径
- 使用BFS算法

**核心方法**：
- `findPath()` - 寻找路径
- `isRoad()` - 检查是否为道路

#### WorldPathFinder - 世界寻路器
**职责**：
- 跨纸张寻路
- 计算纸张间路径

**核心方法**：
- `findPath()` - 跨纸寻路
- `findPaperPath()` - 寻找纸张路径
- `getDirection()` - 获取方向

---

## 关键类与函数

### PaperContainer 核心方法

#### `calculateEffectiveRoadMap()`
计算有效道路地图，结合正面roadMap和反面覆盖。

```javascript
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
        return back[fold.y][fold.x];
      }
      // 普通格子 → 用正面 roadMap
      return val;
    })
  );
}
```

#### `getFoldCoverage()`
获取当前被反面覆盖的格子集合。

**返回值**：
- `covered` - 被覆盖的格子映射
- `emptyed` - 被清空的格子映射

---

### GameScene 核心方法

#### `executeWorldPathMove(worldPath)`
按路径逐步移动玩家。

```javascript
executeWorldPathMove(worldPath) {
  this.isPlayerMoving = true;
  let stepIndex = 0;

  const moveNextStep = () => {
    if (stepIndex >= worldPath.length) {
      this.isPlayerMoving = false;
      this.checkInteractions();
      return;
    }
    // ... 移动逻辑
  };
  moveNextStep();
}
```

#### `checkInteractions()`
检查玩家与NPC、房屋的交互。

---

### PathFinder 核心方法

#### `findPath(start, end)`
使用BFS算法寻找最短路径。

```javascript
findPath(start, end) {
  const open = [start];
  const came = {};
  const cost = { [key(start)]: 0 };

  while (open.length > 0) {
    const cur = open.shift();
    if (cur.x === end.x && cur.y === end.y) break;

    for (const d of [[1,0],[-1,0],[0,1],[0,-1]]) {
      // ... 探索四个方向
    }
  }
  // ... 回溯路径
}
```

---

## 依赖关系

### 模块依赖图

```
main.js
├── TutorialScene
│   ├── PaperContainer
│   │   ├── FrontPaper
│   │   │   ├── RoadMap
│   │   │   ├── DecoElement
│   │   │   ├── House
│   │   │   └── NPC
│   │   ├── BackPaper
│   │   │   └── BackPaperSingle
│   │   │       ├── RoadMap
│   │   │       └── DecoElement
│   │   └── GuideLine
│   └── gameConfig
│
├── GameScene
│   ├── PaperContainer (同上)
│   ├── Player
│   ├── DialogueBox
│   ├── Inventory
│   ├── Toast
│   ├── WorldManager
│   ├── WorldPathFinder
│   │   └── PathFinder
│   └── gameConfig
│
└── PuzzleScene
    └── gameConfig
```

### 外部依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| Phaser | 3.80.0 | 游戏引擎 |

---

## 项目运行方式

### 环境要求
- 现代浏览器（支持ES6模块）
- 本地Web服务器（因ES模块安全限制）

### 运行步骤

1. **使用本地服务器运行**

   方法一：使用 Python
   ```bash
   # Python 3
   python -m http.server 8080

   # Python 2
   python -m SimpleHTTPServer 8080
   ```

   方法二：使用 Node.js
   ```bash
   npx http-server -p 8080
   ```

   方法三：使用 VS Code Live Server 插件
   - 安装 Live Server 插件
   - 右键 `paper.html` 选择 "Open with Live Server"

2. **访问游戏**
   ```
   http://localhost:8080/paper.html
   ```

### 游戏操作

| 操作 | 说明 |
|------|------|
| 鼠标左键点击 | 移动玩家到点击位置 |
| WASD / 方向键 | 键盘移动玩家 |
| 鼠标拖拽边缘 | 折叠纸张 |
| 右键按住 | 查看纸张背面 |
| 点击对话框 | 推进对话 |

---

## 配置说明

### gameConfig.js 核心配置

#### 游戏尺寸配置
```javascript
export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 660;
export const CELL_SIZE = 60;
export const GRID_COLS = 10;
export const GRID_ROWS = 10;
```

#### 折叠阈值配置
```javascript
export const EDGE_X_THRESHOLD = 20;      // 水平边缘检测阈值
export const EDGE_Y_THRESHOLD = 200;     // 垂直边缘检测阈值
export const EDGE_ANGLE_THRESHOLD = 50;  // 角落检测阈值
export const FOLD_SNAP_THRESHOLD = 15;   // 折叠吸附阈值
```

#### 装饰类型
```javascript
export const DECOR_TYPES = {
  NORMAL: 'normal',       // 普通装饰
  NPC: 'npc',             // NPC
  HOUSE: 'house',         // 房屋
  REPAIR: 'repair',       // 可修复装饰
  HIDDEN_ROAD: 'hidden_road',  // 隐藏道路
};
```

#### NPC配置示例
```javascript
export const NPC_CONFIG = {
  center_npc3: {
    id: 'center_npc3',
    paperId: 'center',
    tile: { x: 0, y: 6 },
    texture: 'npc_3',
    name: '小黑瘦',
    dialogues: [...],
    requiredRepair: 'broken_fire',
    reward: { type: 'key', id: 'house_key', name: '小屋钥匙' }
  }
};
```

#### 房屋配置示例
```javascript
export const HOUSE_CONFIG = {
  center_house: {
    id: 'center_house',
    paperId: 'center',
    tile: { x: 5, y: 3 },
    doorTile: { x: 5, y: 3 },
    requiredKey: 'house_key',
    name: '神秘小屋'
  }
};
```

#### 纸张模板配置
```javascript
export const PAPER_TEMPLATES = {
  fullRoad: {
    frontPaper: "bg_1_1",
    backPaper: "bg_1_0",
    roadMap: [...],          // 正面道路地图
    backRoadMap: [...],      // 背面道路地图
    frontDecorations: [...], // 正面装饰
    backDecorations: [...]   // 背面装饰
  }
};
```

#### 世界配置
```javascript
export const WORLD_CONFIG = {
  papers: {
    'center': {
      id: 'center',
      template: 'fullRoad',
      position: { x: 0, y: 0 },
      neighbors: ['west', 'east', 'north', 'south']
    }
  },
  playerStart: {
    paperId: 'center',
    tile: { x: 6, y: 4 }
  }
};
```

---

## 游戏流程

### 1. 启动流程
```
main.js → 创建 Phaser.Game
       → 加载 PuzzleScene（当前激活）
       → PuzzleScene.init()
       → PuzzleScene.create()
```

### 2. 游戏主循环
```
GameScene.create()
├── 初始化 WorldManager
├── 创建所有 PaperContainer
├── 初始化 Player
├── 创建 UI 组件（Inventory, DialogueBox, Toast）
└── 绑定输入事件
```

### 3. 玩家移动流程
```
用户点击 → handleClickMove()
       → WorldPathFinder.findPath()
       → executeWorldPathMove()
       → Player.moveTo()
       → checkInteractions()
```

### 4. 折叠交互流程
```
鼠标移动 → testPaperEdge() → 检测可折叠边缘
       → 显示 GuideLine
鼠标按下 → onDown() → 开始折叠
鼠标移动 → onMove() → 更新折叠量
鼠标松开 → onUp() → 吸附到网格
       → calculateEffectiveRoadMap()
       → checkDecorRepair()
```

---

## 扩展开发指南

### 添加新场景
1. 在 `scenes/` 目录创建新场景文件
2. 继承 `Phaser.Scene`
3. 在 `main.js` 中注册场景

### 添加新装饰类型
1. 在 `gameConfig.js` 的 `DECOR_TYPES` 添加新类型
2. 在 `DecoElement.js` 中添加对应逻辑
3. 在 `FrontPaper.js` 的 `getDefaultDecorProps()` 添加默认属性

### 添加新NPC
1. 在 `gameConfig.js` 的 `NPC_CONFIG` 添加配置
2. 配置对话序列和奖励

### 添加新纸张
1. 在 `gameConfig.js` 的 `PAPER_TEMPLATES` 添加模板
2. 在 `WORLD_CONFIG.papers` 添加纸张配置
3. 设置邻居关系

---

## 调试配置

```javascript
export const DEBUG_CONFIG = {
  showGrid: true,         // 显示网格线
  showTileNumbers: true   // 显示格子坐标
};
```

---

## 总结

Phaser-AI 是一个结构清晰、模块化程度高的纸折叠解谜游戏项目。核心创新点在于：

1. **动态折叠系统**：支持8个方向的折叠，实时计算有效道路
2. **跨纸寻路**：支持在多张纸张间自动寻路
3. **修复机制**：通过折叠修复损坏的装饰物
4. **拼图小游戏**：独立的拼图场景增加游戏趣味性

项目采用 Phaser 3 引擎，使用 ES6 模块化开发，代码结构清晰，易于扩展和维护。
