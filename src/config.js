/**
 * Central configuration constants for the game.
 * All colors, sizes, speeds, and tuning values are here
 * so they can be easily swapped or overridden.
 */

export const CONFIG = {
  // Canvas
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 700,

  // Fixed timestep (60 FPS target)
  FIXED_DT: 1 / 60,
  MAX_ACCUMULATOR: 0.25,

  // Player defaults
  PLAYER: {
    COLOR: '#3498db',
    SIZE: 14,
    DEFAULT_SPEED: 160,
    DEFAULT_MAX_HEALTH: 100,
    DEFAULT_HEALTH_REGEN: 0,
    DEFAULT_ARMOR: 0,
    DEFAULT_BASE_DAMAGE: 10,
    DEFAULT_COOLDOWN: 300,
    DASH_SPEED_MULT: 3,
    DASH_DURATION: 0.15,
    DASH_COOLDOWN: 2000,
    INVULN_DURATION: 0.1,
  },

  // Projectiles
  PROJECTILE: {
    PLAYER_COLOR: '#f1c40f',
    ENEMY_COLOR: '#e74c3c',
    DEFAULT_SPEED: 350,
    DEFAULT_SIZE: 4,
    PLAYER_SIZE: 5,
  },

  // Enemies
  ENEMY: {
    DEFAULT_COLOR: '#e74c3c',
    BOSS_COLOR: '#9b59b6',
    MINI_BOSS_COLOR: '#e67e22',
    DEFAULT_SIZE: 12,
    BOSS_SIZE: 28,
    MINI_BOSS_SIZE: 20,
    HIT_FLASH_DURATION: 0.08,
  },

  // Coins
  COIN: {
    COLOR: '#f1c40f',
    SIZE: 6,
    MAGNET_RADIUS: 40,
    BASE_MAGNET_RADIUS: 40,
    PICKUP_RADIUS: 16,
    MAGNET_SPEED: 250,
    LIFETIME: 15,
  },

  // HUD and UI
  UI: {
    TOAST_DURATION: 3000,
    UPDATE_TOAST_DURATION: 0,
    FONT: '14px "Segoe UI", system-ui, sans-serif',
  },

  // Waves
  WAVE: {
    BASE_SPAWN_INTERVAL: 2.0,
    MIN_SPAWN_INTERVAL: 0.4,
    ENEMIES_PER_WAVE_BASE: 5,
    ENEMIES_PER_WAVE_GROWTH: 3,
    WAVE_DURATION: 20,
    BOSS_WAVE_INTERVAL: 5,
  },

  // Arena padding for spawning
  SPAWN_MARGIN: 40,

  // Score
  SCORE: {
    ENEMY_KILL_BASE: 10,
    COIN_VALUE: 1,
    WAVE_BONUS: 50,
    LEVEL_COMPLETE_BONUS: 500,
  },
};

export default CONFIG;
