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

/**
 * Distribute hint stations in a compact cluster in the middle area of the map.
 * For few hints (1-4), they stay close together rather than spread across the map.
 * For many hints (5+), they fill rows naturally.
 */
export function getHintPositions(hintCount: number) {
  if (hintCount <= 0) return [];

  // Center of the playable hint zone
  const centerX = 388;
  const startY = 210;
  const rowSpacing = 80;

  // Determine grid layout based on hint count
  let cols: number;
  if (hintCount <= 2) cols = 2;
  else if (hintCount <= 4) cols = 2;
  else if (hintCount <= 6) cols = 3;
  else cols = 4;

  // Horizontal spacing adapts to column count to keep things compact
  const colSpacing = Math.min(160, 100 + (cols <= 2 ? 0 : 20));

  const rows = Math.ceil(hintCount / cols);
  const totalWidth = (cols - 1) * colSpacing;
  const totalHeight = (rows - 1) * rowSpacing;
  const originX = centerX - totalWidth / 2;
  const originY = startY - totalHeight / 2 + (rows > 1 ? 20 : 0);

  const candidates: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < rows; row++) {
    const itemsInRow = row < rows - 1 ? cols : hintCount - row * cols;
    const rowWidth = (itemsInRow - 1) * colSpacing;
    const rowOriginX = centerX - rowWidth / 2;
    for (let col = 0; col < itemsInRow; col++) {
      candidates.push({
        x: Math.round(rowOriginX + col * colSpacing),
        y: Math.round(originY + row * rowSpacing),
      });
    }
  }

  // Validate each position and nudge if it overlaps obstacles/stations
  const occupied: GameRect[] = [];
  const positions: Array<{ x: number; y: number }> = [];

  for (const candidate of candidates) {
    let pos = candidate;
    if (!isWalkableEntityPosition(pos, occupied)) {
      // Try nudging in a small radius to find a valid spot
      let found = false;
      for (const dy of [0, -30, 30, -60, 60]) {
        for (const dx of [0, -30, 30, -60, 60, -90, 90]) {
          const nudged = { x: pos.x + dx, y: pos.y + dy };
          if (isWalkableEntityPosition(nudged, occupied)) {
            pos = nudged;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
    positions.push(pos);
    occupied.push({ ...pos, width: ENTITY_SIZE, height: ENTITY_SIZE });
  }

  return positions;
}
