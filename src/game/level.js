/**
 * Level manager - handles level state, wave progression,
 * and transitions between waves and levels.
 */

import CONFIG from '../config.js';
import LEVELS from '../data/levels.js';
import { Player } from './player.js';
import { SpawnManager, Enemy } from './enemy.js';
import { Projectile, createPlayerProjectiles, createEnemyProjectiles, createTurretProjectile } from './projectile.js';
import { aabbCollision, distance } from '../utils/vector.js';
import sfx from '../audio/sfx.js';

export class LevelManager {
  constructor() {
    this.currentLevelIndex = 0;
    this.levelDef = null;
    this.player = null;
    this.enemies = [];
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.coins = [];
    this.explosions = [];
    this.spawnManager = null;
    this.wave = 0;
    this.waveDelay = 0;
    this.state = 'idle'; // idle, playing, waveTransition, bossWave, complete, gameover
    this.score = 0;
    this.coinsCollected = 0;
    this.gameTime = 0;
  }

  /** Initialize a level with a character and upgrades */
  startLevel(levelIndex, characterDef, upgrades) {
    this.currentLevelIndex = levelIndex;
    this.levelDef = LEVELS[levelIndex];
    if (!this.levelDef) return false;

    this.player = new Player(characterDef, upgrades);
    this.player.pos = {
      x: this.levelDef.arenaSize.width / 2,
      y: this.levelDef.arenaSize.height / 2,
    };

    this.enemies = [];
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.coins = [];
    this.explosions = [];
    this.spawnManager = new SpawnManager(this.levelDef);
    this.wave = 0;
    this.waveDelay = 1.5;
    this.state = 'waveTransition';
    this.score = 0;
    this.coinsCollected = 0;
    this.gameTime = 0;
    return true;
  }

  /** Main update tick */
  update(dt, input) {
    if (this.state === 'complete' || this.state === 'gameover' || this.state === 'idle') return;

    this.gameTime += dt;

    // Update input
    input.update(this.player.pos);

    // Wave transition delay
    if (this.state === 'waveTransition') {
      this.waveDelay -= dt;
      if (this.waveDelay <= 0) {
        this.wave++;
        this.spawnManager.startWave(this.wave);
        this.state = 'playing';
      }
      // Still update player movement during transition
      this.player.update(dt, input.moveDir, input.aimDir,
        this.levelDef.arenaSize.width, this.levelDef.arenaSize.height);
      return;
    }

    // Player update
    this.player.update(
      dt,
      input.moveDir,
      input.aimDir,
      this.levelDef.arenaSize.width,
      this.levelDef.arenaSize.height
    );

    // Handle special ability
    if (input.consumeSpecial()) {
      this.player.useSpecial();
    }

    // Player shooting
    if (input.shooting && this.player.canShoot()) {
      const projs = createPlayerProjectiles(this.player);
      this.playerProjectiles.push(...projs);
      this.player.onShoot();
      sfx.play('shoot');
    }

    // Turret shooting
    for (const turret of this.player.turrets) {
      if (turret.timer <= 0 && this.enemies.length > 0) {
        // Find nearest enemy
        let nearest = null;
        let nearestDist = turret.range;
        for (const e of this.enemies) {
          const d = distance(turret.pos, e.pos);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = e;
          }
        }
        if (nearest) {
          const proj = createTurretProjectile(turret, nearest.pos);
          if (proj) this.playerProjectiles.push(proj);
          turret.timer = turret.cooldown;
        }
      }
    }

    // Spawn enemies
    const newEnemies = this.spawnManager.update(
      dt,
      this.levelDef.arenaSize.width,
      this.levelDef.arenaSize.height
    );
    this.enemies.push(...newEnemies);

    // Boss wave
    if (this.spawnManager.shouldSpawnBoss()) {
      const boss = this.spawnManager.spawnBoss(
        this.levelDef.arenaSize.width,
        this.levelDef.arenaSize.height
      );
      this.enemies.push(boss);
      this.state = 'bossWave';
    }

    // Update enemies
    for (const e of this.enemies) {
      e.update(dt, this.player.pos,
        this.levelDef.arenaSize.width, this.levelDef.arenaSize.height);

      // Enemy shooting
      const bulletDescs = e.tryShoot(this.player.pos);
      if (bulletDescs.length > 0) {
        this.enemyProjectiles.push(...createEnemyProjectiles(bulletDescs));
      }
    }

    // Update projectiles
    const arenaW = this.levelDef.arenaSize.width;
    const arenaH = this.levelDef.arenaSize.height;

    for (const p of this.playerProjectiles) {
      p.update(dt);
      if (p.isOutOfBounds(arenaW, arenaH)) p.alive = false;
    }
    for (const p of this.enemyProjectiles) {
      p.update(dt);
      if (p.isOutOfBounds(arenaW, arenaH)) p.alive = false;
    }

    // Update coins
    for (const c of this.coins) {
      c.lifetime -= dt;
      if (c.lifetime <= 0) c.alive = false;

      // Magnet pull
      const d = distance(this.player.pos, c.pos);
      if (d < this.player.magnetRadius) {
        const pull = CONFIG.COIN.MAGNET_SPEED * dt;
        const dx = this.player.pos.x - c.pos.x;
        const dy = this.player.pos.y - c.pos.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          c.pos.x += (dx / len) * pull;
          c.pos.y += (dy / len) * pull;
        }
      }

      // Pickup
      if (d < CONFIG.COIN.PICKUP_RADIUS) {
        c.alive = false;
        this.coinsCollected += CONFIG.SCORE.COIN_VALUE;
        this.player.coinsCollected += CONFIG.SCORE.COIN_VALUE;
        this.score += 5;
        sfx.play('coin');
      }
    }

    // Update explosions
    for (const ex of this.explosions) {
      ex.timer += dt;
      if (ex.timer >= ex.duration) ex.alive = false;
    }

    // Collision: player projectiles vs enemies
    for (const p of this.playerProjectiles) {
      if (!p.alive) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (aabbCollision(p.pos, p.size, e.pos, e.size)) {
          e.takeDamage(p.damage);
          p.onHit();
          sfx.play('hit');

          // Explosion
          if (p.explosionRadius > 0) {
            this.explosions.push({
              pos: { ...p.pos },
              radius: p.explosionRadius,
              timer: 0,
              duration: 0.3,
              alive: true,
            });
            // Area damage
            for (const ae of this.enemies) {
              if (ae !== e && ae.alive && distance(p.pos, ae.pos) < p.explosionRadius) {
                ae.takeDamage(p.damage * 0.5);
              }
            }
          }

          if (!e.alive) {
            this.score += e.scoreValue;
            sfx.play('enemyDeath');
            // Drop coins
            if (Math.random() < e.coinChance) {
              for (let i = 0; i < e.coinCount; i++) {
                this.coins.push({
                  pos: {
                    x: e.pos.x + (Math.random() - 0.5) * 20,
                    y: e.pos.y + (Math.random() - 0.5) * 20,
                  },
                  lifetime: CONFIG.COIN.LIFETIME,
                  alive: true,
                });
              }
            }
          }
          if (!p.alive) break;
        }
      }
    }

    // Collision: enemy projectiles vs player
    for (const p of this.enemyProjectiles) {
      if (!p.alive) continue;
      if (aabbCollision(p.pos, p.size, this.player.pos, this.player.size)) {
        const dmg = this.player.takeDamage(p.damage);
        p.alive = false;
        if (dmg > 0) sfx.play('playerHit');
      }
    }

    // Collision: enemies vs player (contact damage)
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (aabbCollision(e.pos, e.size, this.player.pos, this.player.size)) {
        this.player.takeDamage(15);
      }
    }

    // Clean up dead entities
    this.enemies = this.enemies.filter((e) => e.alive);
    this.playerProjectiles = this.playerProjectiles.filter((p) => p.alive);
    this.enemyProjectiles = this.enemyProjectiles.filter((p) => p.alive);
    this.coins = this.coins.filter((c) => c.alive);
    this.explosions = this.explosions.filter((ex) => ex.alive);

    // Check player death
    if (!this.player.isAlive()) {
      this.state = 'gameover';
      return;
    }

    // Check wave completion
    if (
      this.spawnManager.isWaveSpawningComplete() &&
      this.enemies.length === 0
    ) {
      this.spawnManager.completeWave();
      this.score += CONFIG.SCORE.WAVE_BONUS;

      if (this.spawnManager.allWavesComplete) {
        this.score += CONFIG.SCORE.LEVEL_COMPLETE_BONUS;
        this.state = 'complete';
        sfx.play('levelUp');
      } else {
        this.state = 'waveTransition';
        this.waveDelay = 2;
        sfx.play('levelUp');
      }
    }
  }

  getArenaSize() {
    return this.levelDef ? this.levelDef.arenaSize : { width: CONFIG.CANVAS_WIDTH, height: CONFIG.CANVAS_HEIGHT };
  }
}

/** Check if a level is unlocked based on progression data */
export function isLevelUnlocked(levelDef, progression) {
  const cond = levelDef.unlockCondition;
  if (!cond || cond.type === 'default') return true;
  if (cond.type === 'levelsCompleted') {
    return (progression.levelsCompleted || 0) >= cond.count;
  }
  return false;
}

export default LevelManager;
