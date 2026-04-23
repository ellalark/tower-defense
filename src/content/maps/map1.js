import { buildBuildableMask } from './_gridMask.js';

const waypoints = [
  { x: 0, y: 120 },
  { x: 320, y: 120 },
  { x: 320, y: 480 },
  { x: 640, y: 480 },
  { x: 640, y: 200 },
  { x: 960, y: 200 },
  { x: 960, y: 560 },
  { x: 1280, y: 560 },
];

export const map1 = {
  id: 'map1',
  theme: 'cute-alien-planet',
  difficulty: 'easy',
  targetWave: 30,
  finalBoss: 'finalBossMap1',
  canvas: { width: 1280, height: 720 },
  grid: { cols: 32, rows: 18, cellSize: 40 },
  waypoints,
  buildableMask: buildBuildableMask(waypoints, {
    gridCols: 32,
    gridRows: 18,
    cellSize: 40,
    buffer: 1,
  }),
  unlocksMapId: 'map2',
  unlocksTowerId: 'splash',
};

export default map1;
