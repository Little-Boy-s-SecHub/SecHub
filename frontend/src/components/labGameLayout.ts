export interface GameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;
export const ENTITY_SIZE = 24;

export const GAME_OBSTACLES: GameRect[] = [
  { x: 80, y: 60, width: 80, height: 40 },
  { x: 360, y: 60, width: 80, height: 40 },
  { x: 640, y: 60, width: 80, height: 40 },
  { x: 200, y: 120, width: 80, height: 80 },
  { x: 520, y: 120, width: 80, height: 80 },
  { x: 200, y: 320, width: 80, height: 100 },
  { x: 520, y: 320, width: 80, height: 100 },
  { x: 360, y: 300, width: 80, height: 40 },
];

const WORKFLOW_STATIONS: GameRect[] = [
  { x: 108, y: 100, width: ENTITY_SIZE, height: ENTITY_SIZE },
  { x: 388, y: 100, width: ENTITY_SIZE, height: ENTITY_SIZE },
  { x: 668, y: 100, width: ENTITY_SIZE, height: ENTITY_SIZE },
];

const MIDDLE_HINT_SLOTS = [
  { x: 108, y: 270 }, { x: 308, y: 270 }, { x: 468, y: 270 }, { x: 668, y: 270 },
  { x: 108, y: 355 }, { x: 308, y: 355 }, { x: 468, y: 355 }, { x: 668, y: 355 },
  { x: 108, y: 440 }, { x: 308, y: 440 }, { x: 468, y: 440 }, { x: 668, y: 440 },
];

export function rectsOverlap(a: GameRect, b: GameRect, clearance = 0) {
  return a.x < b.x + b.width + clearance
    && a.x + a.width + clearance > b.x
    && a.y < b.y + b.height + clearance
    && a.y + a.height + clearance > b.y;
}

export function isWalkableEntityPosition(position: { x: number; y: number }, occupied: GameRect[] = []) {
  const entity = { ...position, width: ENTITY_SIZE, height: ENTITY_SIZE };
  const insideMap = entity.x >= 12 && entity.y >= 40
    && entity.x + entity.width <= GAME_WIDTH - 12
    && entity.y + entity.height <= GAME_HEIGHT - 10;
  return insideMap
    && !GAME_OBSTACLES.some(obstacle => rectsOverlap(entity, obstacle, 8))
    && !WORKFLOW_STATIONS.some(station => rectsOverlap(entity, station, 18))
    && !occupied.some(other => rectsOverlap(entity, other, 36));
}

export function getHintPositions(hintCount: number) {
  if (hintCount <= 0) return [];
  if (hintCount === 1) return [{ x: 388, y: 205 }];

  const positions: Array<{ x: number; y: number }> = Array(hintCount);
  positions[0] = { x: 228, y: 212 };
  positions[hintCount - 1] = { x: 548, y: 212 };
  const occupied: GameRect[] = [positions[0], positions[hintCount - 1]].map(position => ({
    ...position,
    width: ENTITY_SIZE,
    height: ENTITY_SIZE,
  }));

  const candidates = [...MIDDLE_HINT_SLOTS];
  for (let y = 225; y <= 440; y += 43) {
    for (let x = 38; x <= 738; x += 70) candidates.push({ x, y });
  }

  for (let index = 1; index < hintCount - 1; index++) {
    const candidateIndex = candidates.findIndex(candidate => isWalkableEntityPosition(candidate, occupied));
    if (candidateIndex < 0) break;
    const [position] = candidates.splice(candidateIndex, 1);
    positions[index] = position;
    occupied.push({ ...position, width: ENTITY_SIZE, height: ENTITY_SIZE });
  }

  return positions.filter(Boolean);
}
