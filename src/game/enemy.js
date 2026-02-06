/**
 * Enemy class and spawn management.
 * Handles enemy types, movement, bullet patterns, and wave spawning.
 */

import CONFIG from '../config.js';
import { normalize, sub, distance, fromAngle, randomRange } from '../utils/vector.js';

/** Enemy type definitions */
const ENEMY_TYPES = {
  grunt: {
    hp: 30,
    speed: 50,
    size: CONFIG.ENEMY.DEFAULT_SIZE,
    color: '#e74c3c',
    scoreValue: 10,
    coinChance: 0.3,
    bulletCooldown: 2000,
  },
  shooter: {
    hp: 20,
    speed: 35,
    size: 10,
    color: '#e67e22',
    scoreValue: 15,
    coinChance: 0.4,
    bulletCooldown: 1500,
  },
  fast_grunt: {
    hp: 20,
    speed: 90,
    size: 10,
    color: '#f39c12',
    scoreValue: 12,
    coinChance: 0.35,
    bulletCooldown: 2500,
  },
  mini_boss: {
    hp: 150,
    speed: 30,
    size: CONFIG.ENEMY.MINI_BOSS_SIZE,
    color: CONFIG.ENEMY.MINI_BOSS_COLOR,
    scoreValue: 50,
    coinChance: 1.0,
    coinCount: 3,
    bulletCooldown: 1200,
    isMiniBoss: true,
  },
  boss: {
    hp: 300,
    speed: 20,
    size: CONFIG.ENEMY.BOSS_SIZE,
    color: CONFIG.ENEMY.BOSS_COLOR,
    scoreValue: 200,
    coinChance: 1.0,
    coinCount: 10,
    bulletCooldown: 800,
    isBoss: true,
  },
};

export class Enemy {
  constructor(type, pos, wave = 1, overrides = {}) {
    const def = ENEMY_TYPES[type] || ENEMY_TYPES.grunt;
    this.type = type;
    this.pos = { ...pos };
    this.hp = (overrides.hp || def.hp) + wave * 5;
    this.maxHp = this.hp;
    this.speed = def.speed + wave * 1;
    this.size = overrides.size || def.size;
    this.color = def.color;
    this.scoreValue = def.scoreValue;
    this.coinChance = def.coinChance;
    this.coinCount = def.coinCount || 1;
    this.isBoss = def.isBoss || false;
    this.isMiniBoss = def.isMiniBoss || false;
    this.bulletCooldown = def.bulletCooldown;
    this.bulletTimer = Math.random() * this.bulletCooldown;
    this.bulletPattern = overrides.bulletPattern || 'radial';
    this.hitFlash = 0;
    this.alive = true;

    // Boss phases
    this.phases = overrides.phases || 1;
    this.currentPhase = 1;

    // Movement pattern
    this.moveAngle = Math.random() * Math.PI * 2;
    this.moveTimer = 0;
    this.moveInterval = randomRange(1, 3);
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = CONFIG.ENEMY.HIT_FLASH_DURATION;
    if (this.hp <= 0) {
      this.alive = false;
      // Boss phase transition
      if (this.isBoss && this.currentPhase < this.phases) {
        this.currentPhase++;
        this.hp = this.maxHp * (0.6 + this.currentPhase * 0.2);
        this.maxHp = this.hp;
        this.alive = true;
        this.bulletCooldown = Math.max(300, this.bulletCooldown - 200);
      }
    }
  }

  update(dt, playerPos, arenaW, arenaH) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.bulletTimer -= dt * 1000;

    // Move toward player with some wandering
    this.moveTimer += dt;
    if (this.moveTimer > this.moveInterval) {
      this.moveAngle += randomRange(-1, 1);
      this.moveTimer = 0;
    }

    const toPlayer = normalize(sub(playerPos, this.pos));
    const wander = fromAngle(this.moveAngle, 0.3);
    const dir = normalize({
      x: toPlayer.x * 0.7 + wander.x,
      y: toPlayer.y * 0.7 + wander.y,
    });

    this.pos.x += dir.x * this.speed * dt;
    this.pos.y += dir.y * this.speed * dt;

    // Keep in arena
    this.pos.x = Math.max(this.size, Math.min(arenaW - this.size, this.pos.x));
    this.pos.y = Math.max(this.size, Math.min(arenaH - this.size, this.pos.y));
  }

  /** Generate bullets based on pattern. Returns array of bullet descriptors. */
  tryShoot(playerPos) {
    if (this.bulletTimer > 0) return [];
    this.bulletTimer = this.bulletCooldown;
    return generateBulletPattern(this.bulletPattern, this.pos, playerPos, this.currentPhase);
  }
}

/** Generate bullet patterns */
function generateBulletPattern(pattern, pos, playerPos, phase = 1) {
  const bullets = [];
  const speed = 120 + phase * 20;

  switch (pattern) {
    case 'radial': {
      const count = 6 + phase * 2;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count;
        bullets.push({
          pos: { ...pos },
          vel: fromAngle(a, speed),
          damage: 8,
          size: CONFIG.PROJECTILE.DEFAULT_SIZE,
        });
      }
      break;
    }
    case 'radial_fast': {
      const count = 10 + phase * 2;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count;
        bullets.push({
          pos: { ...pos },
          vel: fromAngle(a, speed * 1.3),
          damage: 10,
          size: CONFIG.PROJECTILE.DEFAULT_SIZE,
        });
      }
      break;
    }
    case 'aimed': {
      const dir = normalize(sub(playerPos, pos));
      bullets.push({
        pos: { ...pos },
        vel: { x: dir.x * speed * 1.5, y: dir.y * speed * 1.5 },
        damage: 12,
        size: CONFIG.PROJECTILE.DEFAULT_SIZE + 1,
      });
      break;
    }
    case 'aimed_burst': {
      const baseDir = normalize(sub(playerPos, pos));
      const spread = 0.2;
      for (let i = -1; i <= 1; i++) {
        const a = Math.atan2(baseDir.y, baseDir.x) + i * spread;
        bullets.push({
          pos: { ...pos },
          vel: fromAngle(a, speed * 1.2),
          damage: 10,
          size: CONFIG.PROJECTILE.DEFAULT_SIZE,
        });
      }
      break;
    }
    case 'spiral': {
      const count = 4 + phase;
      const time = performance.now() / 1000;
      for (let i = 0; i < count; i++) {
        const a = time * 2 + (Math.PI * 2 * i) / count;
        bullets.push({
          pos: { ...pos },
          vel: fromAngle(a, speed),
          damage: 8,
          size: CONFIG.PROJECTILE.DEFAULT_SIZE,
        });
      }
      break;
    }
    case 'spiral_multi': {
      const arms = 3 + phase;
      const bulletsPerArm = 2;
      const time = performance.now() / 1000;
      for (let arm = 0; arm < arms; arm++) {
        for (let b = 0; b < bulletsPerArm; b++) {
          const a = time * 1.5 + (Math.PI * 2 * arm) / arms + b * 0.15;
          bullets.push({
            pos: { ...pos },
            vel: fromAngle(a, speed + b * 30),
            damage: 10,
            size: CONFIG.PROJECTILE.DEFAULT_SIZE,
          });
        }
      }
      break;
    }
    case 'wave': {
      const count = 8;
      const time = performance.now() / 1000;
      for (let i = 0; i < count; i++) {
        const a = Math.sin(time + i * 0.5) * Math.PI * 0.5 + Math.atan2(
          playerPos.y - pos.y, playerPos.x - pos.x
        );
        bullets.push({
          pos: { ...pos },
          vel: fromAngle(a, speed),
          damage: 8,
          size: CONFIG.PROJECTILE.DEFAULT_SIZE,
        });
      }
      break;
    }
    case 'multi_phase': {
      // Combines patterns based on phase
      if (phase === 1) return generateBulletPattern('radial_fast', pos, playerPos, phase);
      if (phase === 2) return generateBulletPattern('spiral_multi', pos, playerPos, phase);
      // Phase 3: combined
      return [
        ...generateBulletPattern('radial', pos, playerPos, phase),
        ...generateBulletPattern('aimed_burst', pos, playerPos, phase),
      ];
    }
    default: {
      // Fallback to radial
      return generateBulletPattern('radial', pos, playerPos, phase);
    }
  }

  return bullets;
}

/** Spawn manager creates enemies based on level spawn patterns */
export class SpawnManager {
  constructor(levelDef) {
    this.levelDef = levelDef;
    this.wave = 0;
    this.spawnTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesToSpawnThisWave = 0;
    this.waveTimer = 0;
    this.waveActive = false;
    this.allWavesComplete = false;
    this.bossSpawned = false;
  }

  startWave(waveNum) {
    this.wave = waveNum;
    this.spawnTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesToSpawnThisWave =
      CONFIG.WAVE.ENEMIES_PER_WAVE_BASE + (waveNum - 1) * CONFIG.WAVE.ENEMIES_PER_WAVE_GROWTH;
    this.waveTimer = 0;
    this.waveActive = true;
  }

  /** Update spawner. Returns array of new enemies to add. */
  update(dt, arenaW, arenaH) {
    if (!this.waveActive) return [];
    const newEnemies = [];

    this.waveTimer += dt;
    this.spawnTimer += dt;

    const interval = Math.max(
      CONFIG.WAVE.MIN_SPAWN_INTERVAL,
      CONFIG.WAVE.BASE_SPAWN_INTERVAL - this.wave * 0.1
    );

    while (
      this.spawnTimer >= interval &&
      this.enemiesSpawnedThisWave < this.enemiesToSpawnThisWave
    ) {
      this.spawnTimer -= interval;
      const enemy = this._spawnOne(arenaW, arenaH);
      if (enemy) newEnemies.push(enemy);
      this.enemiesSpawnedThisWave++;
    }

    return newEnemies;
  }

  /** Check if it's time to spawn boss */
  shouldSpawnBoss() {
    return (
      this.wave > 0 &&
      this.wave % CONFIG.WAVE.BOSS_WAVE_INTERVAL === 0 &&
      !this.bossSpawned
    );
  }

  /** Spawn boss enemy */
  spawnBoss(arenaW, arenaH) {
    this.bossSpawned = true;
    const boss = this.levelDef.bossWave;
    const pos = this._randomEdgePos(arenaW, arenaH);
    return new Enemy('boss', pos, this.wave, {
      hp: boss.hp + this.wave * 20,
      size: boss.size,
      bulletPattern: boss.bulletPattern,
      phases: boss.phases || 1,
    });
  }

  /** Check if current wave spawning is done */
  isWaveSpawningComplete() {
    return this.enemiesSpawnedThisWave >= this.enemiesToSpawnThisWave;
  }

  /** Mark wave as fully complete (all enemies dead) */
  completeWave() {
    this.waveActive = false;
    this.bossSpawned = false;
    if (this.wave >= this.levelDef.totalWaves) {
      this.allWavesComplete = true;
    }
  }

  _spawnOne(arenaW, arenaH) {
    // Pick a pattern based on weights
    const patterns = this.levelDef.spawnPatterns.filter(
      (p) => !p.waveMin || this.wave >= p.waveMin
    );
    const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = patterns[0];
    for (const p of patterns) {
      roll -= p.weight;
      if (roll <= 0) {
        chosen = p;
        break;
      }
    }

    const pos = this._randomEdgePos(arenaW, arenaH);
    return new Enemy(chosen.enemyType, pos, this.wave, {
      bulletPattern: chosen.bulletPattern,
    });
  }

  _randomEdgePos(arenaW, arenaH) {
    const side = Math.floor(Math.random() * 4);
    const margin = CONFIG.SPAWN_MARGIN;
    switch (side) {
      case 0: return { x: randomRange(margin, arenaW - margin), y: -margin };
      case 1: return { x: arenaW + margin, y: randomRange(margin, arenaH - margin) };
      case 2: return { x: randomRange(margin, arenaW - margin), y: arenaH + margin };
      case 3: return { x: -margin, y: randomRange(margin, arenaH - margin) };
      default: return { x: 0, y: 0 };
    }
  }
}

export default Enemy;
