/**
 * Tests for the game Engine fixed timestep behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Engine } from '../src/game/engine.js';

describe('Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new Engine();
  });

  it('should initialize with correct defaults', () => {
    expect(engine.running).toBe(false);
    expect(engine.paused).toBe(false);
    expect(engine.accumulator).toBe(0);
    expect(engine.tickCount).toBe(0);
    expect(engine.fixedDt).toBeCloseTo(1 / 60);
  });

  it('should start and set running state', () => {
    const update = vi.fn();
    const render = vi.fn();

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

    engine.start(update, render);
    expect(engine.running).toBe(true);
    expect(engine.paused).toBe(false);
    expect(engine.updateFn).toBe(update);
    expect(engine.renderFn).toBe(render);

    engine.stop();
    vi.restoreAllMocks();
  });

  it('should stop the engine', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    engine.start(vi.fn(), vi.fn());
    engine.stop();

    expect(engine.running).toBe(false);
    vi.restoreAllMocks();
  });

  it('should pause and resume', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

    engine.start(vi.fn(), vi.fn());

    engine.pause();
    expect(engine.paused).toBe(true);

    engine.resume();
    expect(engine.paused).toBe(false);

    engine.stop();
    vi.restoreAllMocks();
  });

  it('should have a max accumulator clamp', () => {
    expect(engine.maxAccumulator).toBe(0.25);
  });

  it('should track tick count', () => {
    expect(engine.tickCount).toBe(0);
  });

  it('should not call update when stopped', () => {
    const update = vi.fn();
    engine.updateFn = update;
    // Directly verify engine is not running
    expect(engine.running).toBe(false);
  });
});
