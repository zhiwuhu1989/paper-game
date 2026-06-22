export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 660;
export const CELL_SIZE = 60;
export const GRID_COLS = 10;
export const GRID_ROWS = 10;
export const PAPER_WIDTH = GRID_COLS * CELL_SIZE;   // 620
export const PAPER_HEIGHT = GRID_ROWS * CELL_SIZE;  // 496
export const BACKGROUND_COLOR = 0x4b2e16;
export const EDGE_X_THRESHOLD = 20;
export const EDGE_Y_THRESHOLD = 200;
export const EDGE_ANGLE_THRESHOLD = 50;
export const FOLD_SNAP_THRESHOLD = 15;
export const PLAYER_MOVE_DURATION = 600;
export const PLAYER_RADIUS_RATIO = 0.3;

// 调试配置
export const DEBUG_CONFIG = {
  showGrid: false,        // 是否显示网格线
  showTileNumbers: false  // 是否显示格子坐标编号
};

export const DECOR_TYPES = {
  NORMAL: 'normal',
  NPC: 'npc',
  HOUSE: 'house',
  REPAIR: 'repair',
  HIDDEN_ROAD: 'hidden_road',
};

export const NPC_CONFIG = {
  // center_npc1: {
  //   id: 'center_npc1',
  //   paperId: 'center',
  //   tile: { x: 4, y: 7 },
  //   texture: 'npc_1',      // NPC 纹理
  //   width: 102,             // 显示宽度（像素）
  //   height: 77,            // 显示高度（像素）
  //   offsetX: -20,           // 像素级水平偏移（正数向右，负数向左）
  //   offsetY: 14,           // 像素级垂直偏移（正数向下，负数向上）
  //   name: 'A',
  //   dialogues: [
  //     { speaker: 'npc', text: '你好，旅行者！我在这里等你很久了。' },
  //     { speaker: 'player', text: '你是谁？为什么在这里？' },
  //     { speaker: 'npc', text: '我是这片纸世界的守护者。前方有一间小屋，里面藏着重要的东西。' },
  //     { speaker: 'player', text: '我该如何进入那间小屋？' },
  //     { speaker: 'npc', text: '拿着这把钥匙吧，它能打开小屋的门。祝你好运！' }
  //   ],
  //   reward: { type: 'key', id: 'house_key', name: '小屋钥匙' }
  // },
  // center_npc2: {
  //   id: 'center_npc2',
  //   paperId: 'center',
  //   tile: { x: 3, y: 9 },
  //   texture: 'npc_2',      // NPC 纹理
  //   width: 69,             // 显示宽度（像素）
  //   height: 87,            // 显示高度（像素）
  //   offsetX: -7,           // 像素级水平偏移（正数向右，负数向左）
  //   offsetY: 8,           // 像素级垂直偏移（正数向下，负数向上）
  //   name: 'B',
  //   dialogues: [
  //     { speaker: 'npc', text: '你好，旅行者！我在这里等你很久了。' },
  //     { speaker: 'player', text: '你是谁？为什么在这里？' },
  //     { speaker: 'npc', text: '我是这片纸世界的守护者。前方有一间小屋，里面藏着重要的东西。' },
  //     { speaker: 'player', text: '我该如何进入那间小屋？' },
  //     { speaker: 'npc', text: '拿着这把钥匙吧，它能打开小屋的门。祝你好运！' }
  //   ],
  //   reward: { type: 'key', id: 'house_key', name: '小屋钥匙' }
  // },
  center_npc3: {
    id: 'center_npc3',
    paperId: 'center',
    tile: { x: 0, y: 6 },
    texture: 'npc_3',      // NPC 纹理
    width: 45,             // 显示宽度（像素）
    height: 49,            // 显示高度（像素）
    offsetX: 5,           // 像素级水平偏移（正数向右，负数向左）
    offsetY: 20,           // 像素级垂直偏移（正数向下，负数向上）
    name: '小胖猫',
    dialogues: [
      { speaker: 'npc', text: '好冷啊...我需要生一堆火来取暖。' },
      { speaker: 'player', text: '看起来你需要帮助，我能做些什么？' },
      { speaker: 'npc', text: '如果你能帮我燃起篝火，我就把这把钥匙送给你。' },
      { speaker: 'player', text: '好的，我来试试看！' },
      { speaker: 'npc', text: '你需要在左下角进行折叠，这样火堆就能燃起来了。' },
      { speaker: 'player', text: '火堆已经点燃了！' },
      { speaker: 'npc', text: '太感谢你了！这把钥匙送给你，它能打开那间小屋的门。' }
    ],
    requiredRepair: 'broken_fire',  // 需要修复的装饰名称
    reward: { type: 'key', id: 'house_key', name: '小屋钥匙' }
  }
};

export const HOUSE_CONFIG = {
  center_house: {
    id: 'center_house',
    paperId: 'center',
    tile: { x: 5, y: 3 },
    doorTile: { x: 5, y: 3 },
    offsetX: -25,   // 像素级水平偏移（正数向右，负数向左）
    offsetY: 10,   // 像素级垂直偏移（正数向下，负数向上）
    requiredKey: 'house_key',
    name: '神秘小屋',
    unlockedMessage: '你用钥匙打开了小屋的门！里面似乎藏着什么...',
    lockedMessage: '小屋的门紧锁着，需要一把钥匙才能打开。',
    enterMessage: '点击进入小屋'
  }
};

export const PAPER_TEMPLATES = {
  fullRoad: {
    frontPaper:"bg_1_1",
    backPaper:"bg_1_0",
    roadMap: [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0],
      [0,0,1,0,0,0,0,0,0,0],
      [1,1,1,1,0,0,1,0,0,0],
      [0,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ],
    backRoadMap: [
      [1,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],  // 好桥 (4,3)(5,3)(6,3)
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,1,0,0,0,0,0,0,0],
      [1,1,1,0,0,0,1,0,0,0],
      [1,1,1,0,0,0,0,0,0,0],
      [1,1,1,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0],
    ],
    frontDecorations: [
      // { 
      //   type: DECOR_TYPES.NORMAL, 
      //   name: "tree_1",
      //   texture: "tree_3", 
      //   x: 1, 
      //   y: 1, 
      //   width: 119, 
      //   height: 148,
      //   offsetX: 10,    // 向右偏移 10 像素
      //   offsetY: -5     // 向上偏移 5 像素
      // },
      { 
        type: DECOR_TYPES.NORMAL, 
        name: "paper_1", 
        texture:"paper_1", x: 7, y: 6, 
        width: 212, height: 368, offsetX: 44, offsetY: 25
      },
      // paper_1 下面的隐藏道路（拼图完成后显示）
      { 
        type: DECOR_TYPES.HIDDEN_ROAD, 
        name: "hidden_road_under_paper1",
        roadCells: [
          {x: 7, y: 6}, {x: 8, y: 6}, {x: 9, y: 6},
          {x: 7, y: 7}, {x: 8, y: 7}, {x: 9, y: 7},
          {x: 7, y: 8}, {x: 8, y: 8}, {x: 9, y: 8},
          {x: 7, y: 9}, {x: 8, y: 9}, {x: 9, y: 9}
        ],
        visible: false  // 初始隐藏
      },
      // 需要修复的装饰：向下折叠3格才能修复
      { type: DECOR_TYPES.REPAIR, 
        name: "broken_bridge",
        texture:"bridge_1_0", good:"bridge_1_1", x: 4, y: 7, 
        offsetX: 16, offsetY: -12,
        width: 190, height: 157, repairCondition: { bottom: 4 },
        fillRoad:[{x:4,y:6},{x:5,y:6}] 
      },
      { type: DECOR_TYPES.REPAIR, 
        name: "broken_fire",
        texture:"fire_1_0", good:"fire_1_1", x: 1, y: 6, 
        offsetX: 30, offsetY: 30,
        width: 99, height: 106, repairCondition: { bottomLeft: 4 },
        fillRoad:[] 
      }
    ],
    backDecorations: [
      // { type: DECOR_TYPES.NORMAL, texture:"bridge_1_1", x: 6, y: 9, width: 177, height: 59 },
      { type: DECOR_TYPES.NORMAL, texture:"fire_1_1", x: 0, y: 7, offsetX: 30, offsetY: 30,width: 99, height: 106,rotation: -Math.PI/2}
    ]
  },

  westRoad: {
    roadMap: [
      [2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,1,0,0,0,0,0,0,1,2],
      [2,1,0,1,1,1,1,0,1,2],
      [2,1,0,1,0,0,1,0,1,2],
      [2,1,0,1,1,1,1,0,1,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2],
    ],
    backRoadMap: Array.from({length:8}, () => Array(10).fill(0)),
    frontDecorations: [
      { type: DECOR_TYPES.TREE, x: 2, y: 3, width: 90, height: 90 },
      { type: DECOR_TYPES.TREE, x: 2, y: 5, width: 90, height: 90 }
    ],
    backDecorations: []
  },

  eastRoad: {
    roadMap: [
      [2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,1,0,0,0,0,0,0,1,2],
      [2,1,0,1,1,1,1,0,1,2],
      [2,1,0,1,0,0,1,0,1,2],
      [2,1,0,1,1,1,1,0,1,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2],
    ],
    backRoadMap: Array.from({length:8}, () => Array(10).fill(0)),
    frontDecorations: [
      { type: DECOR_TYPES.TREE, x: 7, y: 3, width: 90, height: 90 },
      { type: DECOR_TYPES.TREE, x: 7, y: 5, width: 90, height: 90 }
    ],
    backDecorations: []
  },

  northRoad: {
    roadMap: [
     [2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,1,0,0,0,0,0,0,1,2],
      [2,1,0,1,1,1,1,0,1,2],
      [2,1,0,1,0,0,1,0,1,2],
      [2,1,0,1,1,1,1,0,1,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2],
    ],
    backRoadMap: Array.from({length:8}, () => Array(10).fill(0)),
    frontDecorations: [
      { type: DECOR_TYPES.TREE, x: 4, y: 2, width: 90, height: 90 },
      { type: DECOR_TYPES.TREE, x: 6, y: 2, width: 90, height: 90 }
    ],
    backDecorations: []
  },
  southRoad: {
    roadMap: [
      [2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,1,0,0,0,0,0,0,1,2],
      [2,1,0,1,1,1,1,0,1,2],
      [2,1,0,1,0,0,1,0,1,2],
      [2,1,0,1,1,1,1,0,1,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2],
    ],
    backRoadMap: Array.from({length:8}, () => Array(10).fill(0)),
    frontDecorations: [
      { type: DECOR_TYPES.TREE, x: 4, y: 6, width: 90, height: 90 },
      { type: DECOR_TYPES.TREE, x: 6, y: 6, width: 90, height: 90 }
    ],
    backDecorations: []
  },
};

export const WORLD_CONFIG = {
  papers: {
    'center': {
      id: 'center',
      template: 'fullRoad',
      position: { x: 0, y: 0 },
      neighbors: ['west', 'east', 'north', 'south']
    },
    // 'west': {
    //   id: 'west',
    //   template: 'fullRoad',
    //   position: { x: -1, y: 0 },
    //   neighbors: ['center', 'northwest', 'southwest']
    // },
    // 'east': {
    //   id: 'east',
    //   template: 'fullRoad',
    //   position: { x: 1, y: 0 },
    //   neighbors: ['center', 'northeast', 'southeast']
    // },
    // 'north': {
    //   id: 'north',
    //   template: 'fullRoad',
    //   position: { x: 0, y: -1 },
    //   neighbors: ['center', 'northwest', 'northeast']
    // },
    // 'south': {
    //   id: 'south',
    //   template: 'fullRoad',
    //   position: { x: 0, y: 1 },
    //   neighbors: ['center', 'southwest', 'southeast']
    // },
    // 'northwest': {
    //   id: 'northwest',
    //   template: 'fullRoad',
    //   position: { x: -1, y: -1 },
    //   neighbors: ['west', 'north']
    // },
    // 'northeast': {
    //   id: 'northeast',
    //   template: 'fullRoad',
    //   position: { x: 1, y: -1 },
    //   neighbors: ['east', 'north']
    // },
    // 'southwest': {
    //   id: 'southwest',
    //   template: 'fullRoad',
    //   position: { x: -1, y: 1 },
    //   neighbors: ['west', 'south']
    // },
    // 'southeast': {
    //   id: 'southeast',
    //   template: 'fullRoad',
    //   position: { x: 1, y: 1 },
    //   neighbors: ['east', 'south']
    // }
  },
  playerStart: {
    paperId: 'center',
    tile: { x: 6, y: 4 }
  }
};

export const ASSETS = {
  front: 'assets/front.png',
  back: 'assets/back.png',
  tiles: 'assets/tiles.png',
  tree: 'assets/tree.png',
  npc: 'assets/npc.png',
  house: 'assets/house.png',
  road: 'assets/road.png'
};