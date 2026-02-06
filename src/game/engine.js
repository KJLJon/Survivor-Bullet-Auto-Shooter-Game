/**
 * Game engine - manages the fixed-timestep game loop,
 * update/render phases, and game state.
 */

import CONFIG from '../config.js';

export class Engine {
  constructor() {
    this.running = false;
    this.paused = false;
    this.accumulator = 0;
    this.lastTime = 0;
    this.rafId = null;
    this.updateFn = null;
    this.renderFn = null;
    this.fixedDt = CONFIG.FIXED_DT;
    this.maxAccumulator = CONFIG.MAX_ACCUMULATOR;
    this.tickCount = 0;
  }

  /**
   * Start the game loop.
   * @param {Function} updateFn - called with dt (fixed timestep) each tick
   * @param {Function} renderFn - called with interpolation alpha each frame
   */
  start(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.running = true;
    this.paused = false;
    this.accumulator = 0;
    this.lastTime = performance.now() / 1000;
    this.tickCount = 0;
    this._loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now() / 1000;
      this.accumulator = 0;
    }
  }

  _loop() {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(() => this._loop());

    const now = performance.now() / 1000;
    let frameTime = now - this.lastTime;
    this.lastTime = now;

    if (this.paused) {
      if (this.renderFn) this.renderFn(0);
      return;
    }

    // Clamp frame time to prevent spiral of death
    if (frameTime > this.maxAccumulator) {
      frameTime = this.maxAccumulator;
    }

    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDt) {
      if (this.updateFn) this.updateFn(this.fixedDt);
      this.accumulator -= this.fixedDt;
      this.tickCount++;
    }

    // Render with interpolation alpha
    const alpha = this.accumulator / this.fixedDt;
    if (this.renderFn) this.renderFn(alpha);
  }
}

export default Engine;
