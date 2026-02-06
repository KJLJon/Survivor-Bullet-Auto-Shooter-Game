/**
 * Tests for collision detection functions.
 */

import { describe, it, expect } from 'vitest';
import { aabbCollision, circleCollision, distance, normalize, length, fromAngle } from '../src/utils/vector.js';

describe('Collision Detection', () => {
  describe('aabbCollision', () => {
    it('should detect overlapping boxes', () => {
      const a = { x: 10, y: 10 };
      const b = { x: 15, y: 15 };
      expect(aabbCollision(a, 8, b, 8)).toBe(true);
    });

    it('should not detect non-overlapping boxes', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 100, y: 100 };
      expect(aabbCollision(a, 5, b, 5)).toBe(false);
    });

    it('should detect touching edges', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 0 };
      // Sizes sum to 10, distance is 10, so they're just touching (not colliding with < check)
      expect(aabbCollision(a, 5, b, 5)).toBe(false);
    });

    it('should detect same position', () => {
      const a = { x: 50, y: 50 };
      expect(aabbCollision(a, 10, a, 10)).toBe(true);
    });

    it('should work with different sizes', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 20, y: 0 };
      expect(aabbCollision(a, 5, b, 16)).toBe(true); // 5+16=21 > 20
      expect(aabbCollision(a, 5, b, 14)).toBe(false); // 5+14=19 < 20
    });
  });

  describe('circleCollision', () => {
    it('should detect overlapping circles', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 5, y: 0 };
      expect(circleCollision(a, 4, b, 4)).toBe(true);
    });

    it('should not detect non-overlapping circles', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 20, y: 0 };
      expect(circleCollision(a, 5, b, 5)).toBe(false);
    });

    it('should detect same position', () => {
      const a = { x: 10, y: 10 };
      expect(circleCollision(a, 1, a, 1)).toBe(true);
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('should return 0 for same point', () => {
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });
  });

  describe('normalize', () => {
    it('should normalize a vector', () => {
      const v = normalize({ x: 3, y: 4 });
      expect(v.x).toBeCloseTo(0.6);
      expect(v.y).toBeCloseTo(0.8);
      expect(length(v)).toBeCloseTo(1);
    });

    it('should return zero vector for zero input', () => {
      const v = normalize({ x: 0, y: 0 });
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });
  });

  describe('fromAngle', () => {
    it('should create vector from angle', () => {
      const v = fromAngle(0, 1);
      expect(v.x).toBeCloseTo(1);
      expect(v.y).toBeCloseTo(0);
    });

    it('should handle PI/2 angle', () => {
      const v = fromAngle(Math.PI / 2, 1);
      expect(v.x).toBeCloseTo(0);
      expect(v.y).toBeCloseTo(1);
    });

    it('should scale magnitude', () => {
      const v = fromAngle(0, 5);
      expect(v.x).toBeCloseTo(5);
      expect(v.y).toBeCloseTo(0);
    });
  });
});
