import { describe, expect, it } from 'vitest';
import { ENTITY_SIZE, GAME_HEIGHT, GAME_OBSTACLES, GAME_WIDTH, getHintPositions, rectsOverlap } from './labGameLayout';

describe('2D lab hint layout', () => {
  it.each([1, 2, 3, 4, 5, 8, 12, 16, 20])('keeps %i hint characters on walkable floor', (count) => {
    const positions = getHintPositions(count);
    expect(positions).toHaveLength(count);
    positions.forEach(position => {
      const entity = { ...position, width: ENTITY_SIZE, height: ENTITY_SIZE };
      expect(entity.x).toBeGreaterThanOrEqual(0);
      expect(entity.y).toBeGreaterThanOrEqual(0);
      expect(entity.x + entity.width).toBeLessThanOrEqual(GAME_WIDTH);
      expect(entity.y + entity.height).toBeLessThanOrEqual(GAME_HEIGHT);
      expect(GAME_OBSTACLES.some(obstacle => rectsOverlap(entity, obstacle, 8))).toBe(false);
    });
  });

  it('keeps the first and last hint on the upper row', () => {
    const positions = getHintPositions(6);
    expect(positions[0]).toEqual({ x: 228, y: 212 });
    expect(positions.at(-1)).toEqual({ x: 548, y: 212 });
  });

  it('does not overlap hint characters', () => {
    const positions = getHintPositions(12);
    positions.forEach((position, index) => {
      const entity = { ...position, width: ENTITY_SIZE, height: ENTITY_SIZE };
      positions.slice(index + 1).forEach(other => {
        expect(rectsOverlap(entity, { ...other, width: ENTITY_SIZE, height: ENTITY_SIZE }, 32)).toBe(false);
      });
    });
  });
});
