// 导入游戏配置
import { WORLD_CONFIG, GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';

/**
 * 单纸张寻路器类
 * 用于在单张纸的道路网格上寻找最短路径
 */
export class PathFinder {
  /**
   * 构造函数
   * @param {number[][]} roadMap - 道路网格地图，1表示可通行，0表示不可通行
   * @param {number} gridSize - 网格大小
   * @param {function} isBlockedCallback - 可选的阻塞检测回调函数
   */
  constructor(roadMap, gridCols, gridRows, isBlockedCallback) {
    this.roadMap = roadMap;
    this.gridCols = gridCols;
    this.gridRows = gridRows;
    this.isBlockedCallback = isBlockedCallback;
  }

  /**
   * 使用BFS算法寻找从起点到终点的路径
   * @param {{x: number, y: number}} start - 起点坐标
   * @param {{x: number, y: number}} end - 终点坐标
   * @returns {{x: number, y: number}[]} - 路径点数组，从起点到终点
   */
  findPath(start, end) {
    // 生成坐标的唯一键
    const key = p => `${p.x},${p.y}`;

    // 检查起点是否在道路上
    if (!this.isRoad(start.x, start.y)) {
      return [];
    }

    // 检查终点是否在道路上
    if (!this.isRoad(end.x, end.y)) {
      return [];
    }

    // 检查起点是否被阻塞
    if (this.isBlockedCallback && this.isBlockedCallback(start.x, start.y)) {
      return [];
    }

    // 检查终点是否被阻塞
    if (this.isBlockedCallback && this.isBlockedCallback(end.x, end.y)) {
      return [];
    }

    // BFS算法初始化
    const open = [start];      // 待探索队列
    const came = {};           // 记录路径来源
    const cost = { [key(start)]: 0 };  // 记录到达每个点的代价

    // BFS主循环
    while (open.length > 0) {
      const cur = open.shift();
      // 到达终点，退出循环
      if (cur.x === end.x && cur.y === end.y) break;

      // 探索四个方向：右、左、下、上
      for (const d of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cur.x + d[0], ny = cur.y + d[1];
        // 检查边界、道路和阻塞状态
        if (
          nx < 0 || ny < 0 || nx >= this.gridCols || ny >= this.gridRows ||
          !this.isRoad(nx, ny) ||
          (this.isBlockedCallback && this.isBlockedCallback(nx, ny))
        ) continue;

        const nk = `${nx},${ny}`;
        const nc = cost[key(cur)] + 1;
        // 如果该点未被访问过
        if (cost[nk] === undefined) {
          cost[nk] = nc;
          came[nk] = cur;
          open.push({x:nx, y:ny});
        }
      }
    }

    // 回溯路径
    const path = [];
    let cur = end;
    while (cur && key(cur) !== key(start)) {
      path.push(cur);
      cur = came[key(cur)];
    }

    // 如果无法到达起点，返回空路径
    if (!cur) {
      return [];
    }

    // 添加起点并反转路径顺序
    path.push(start);
    return path.reverse();
  }

  /**
   * 检查指定坐标是否为道路
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} - 是否为道路
   */
  isRoad(x, y) {
    // 边界检查
    if (y < 0 || y >= this.gridRows || x < 0 || x >= this.gridCols) {
      return false;
    }
    // 1表示道路，0表示非道路
    return this.roadMap[y][x] === 1;
  }
}

// 替换整个 WorldPathFinder 类
export class WorldPathFinder {
  constructor(worldManager, gridCols = GRID_COLS, gridRows = GRID_ROWS) {
    this.worldManager = worldManager;
    this.gridCols = gridCols;
    this.gridRows = gridRows;
    this.papers = null; // 由 GameScene 设置，引用 papers map
  }

  /**
   * 设置纸张容器的引用（由 GameScene 调用）
   * @param {Object} papers - paperId -> PaperContainer 映射
   */
  setPapers(papers) {
    this.papers = papers;
  }

  /**
   * 获取指定纸张的有效路图
   * @param {string} paperId
   * @returns {number[][]}
   */
  getRoadMap(paperId) {
    if (this.papers && this.papers[paperId]) {
      return this.papers[paperId].getEffectiveRoadMap();
    }
    const paperData = this.worldManager.getPaperData(paperId);
    return paperData ? paperData.roadMap : null;
  }

  findPath(startPaperId, startGrid, endPaperId, endGrid) {
    // 如果在同一张纸上，直接使用单纸寻路
    if (startPaperId === endPaperId) {
      const roadMap = this.getRoadMap(startPaperId);
      if (!roadMap) return [];
      const pf = new PathFinder(roadMap, GRID_COLS, GRID_ROWS);
      const path = pf.findPath(startGrid, endGrid);
      return path.map(p => ({ paperId: startPaperId, x: p.x, y: p.y }));
    }

    // 跨纸张寻路：先获取纸张层面的拓扑路径
    const paperPath = this.findPaperPath(startPaperId, endPaperId);
    if (!paperPath || paperPath.length === 0) return [];

    let currentStart = startGrid;
    let fullPath = [];

    for (let i = 0; i < paperPath.length - 1; i++) {
      const curPaperId = paperPath[i];
      const nextPaperId = paperPath[i + 1];

      // 获取当前纸张到下一张纸张的方向
      const dir = this.getDirection(curPaperId, nextPaperId);
      if (!dir) return [];

      // 获取当前纸张的有效出口点
      const exitPoint = this.getExitPoint(dir);
      
      // 寻路：当前位置 -> 出口点
      const curRoadMap = this.getRoadMap(curPaperId);
      if (!curRoadMap) return [];
      const pf = new PathFinder(curRoadMap, GRID_COLS, GRID_ROWS);
      const subPath = pf.findPath(currentStart, exitPoint);
      if (subPath.length === 0) return []; // 内部断路

      // 合并路径
      fullPath = fullPath.concat(subPath.map(p => ({ paperId: curPaperId, x: p.x, y: p.y })));

      // 计算下一张纸张的入口点
      currentStart = this.getEntryPoint(nextPaperId, curPaperId);
    }

    // 最后一张纸张的内部路径：入口点 -> 最终目标点
    const finalPaperId = endPaperId;
    const finalRoadMap = this.getRoadMap(finalPaperId);
    if (!finalRoadMap) return [];
    const pf = new PathFinder(finalRoadMap, GRID_COLS, GRID_ROWS);
    const subPath = pf.findPath(currentStart, endGrid);
    if (subPath.length === 0) return [];

    fullPath = fullPath.concat(subPath.map(p => ({ paperId: finalPaperId, x: p.x, y: p.y })));
    return fullPath;
  }

  findPaperPath(startId, endId) {
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node === endId) return path;

      const neighbors = this.worldManager.getNeighbors(node);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return null;
  }

  getDirection(fromId, toId) {
    const fromData = this.worldManager.getPaperData(fromId);
    const toData = this.worldManager.getPaperData(toId);
    if (!fromData || !toData) return null;

    const dx = toData.position.x - fromData.position.x;
    const dy = toData.position.y - fromData.position.y;

    if (dx > 0) return 'east';
    if (dx < 0) return 'west';
    if (dy > 0) return 'south';
    if (dy < 0) return 'north';
    return null;
  }

  // 针对你的模板进行连接点修正（固定在中间通路位置上）
  // 8行10列：道路环在 x=1~8, y=1~6, 中间行 y=3, 中间列 x=4/5
  getExitPoint(direction) {
    if (direction === 'east') return { x: 8, y: 3 };
    if (direction === 'west') return { x: 1, y: 3 };
    if (direction === 'south') return { x: 4, y: 6 };
    if (direction === 'north') return { x: 4, y: 1 };
    return { x: 4, y: 3 };
  }

  getEntryPoint(paperId, fromPaperId) {
    const direction = this.getDirection(fromPaperId, paperId);
    if (direction === 'east') return { x: 1, y: 3 };  // 进东边的纸，入口在它的西侧
    if (direction === 'west') return { x: 8, y: 3 };  // 进西边的纸，入口在它的东侧
    if (direction === 'south') return { x: 4, y: 1 }; // 进南边的纸，入口在它的北侧
    if (direction === 'north') return { x: 4, y: 6 }; // 进北边的纸，入口在它的南侧
    return { x: 1, y: 1 };
  }
}