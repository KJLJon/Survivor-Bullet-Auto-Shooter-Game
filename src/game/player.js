/**
 * Player class - manages player state, movement, shooting, and stats.
 */

import CONFIG from '../config.js';
import WEAPONS from '../data/weapons.js';
import { clamp } from '../utils/vector.js';

export class Player {
  constructor(characterDef, upgrades = {}) {
    const stats = { ...characterDef.baseStats };
    this.characterId = characterDef.id;
    this.name = characterDef.name;
    this.color = characterDef.color;
    this.specialAbility = characterDef.specialAbility || null;

    // Apply upgrades to base stats
    this.maxHealth = stats.maxHealth + (upgrades.maxHealth || 0);
    this.health = this.maxHealth;
    this.healthRegen = stats.healthRegen + (upgrades.healthRegen || 0);
    this.speed = stats.speed + (upgrades.speed || 0);
    this.baseDamage = stats.baseDamage + (upgrades.damageBoost || 0);
    this.armor = stats.armor;
    this.size = stats.size;

    // Position
    this.pos = { x: CONFIG.CANVAS_WIDTH / 2, y: CONFIG.CANVAS_HEIGHT / 2 };
    this.vel = { x: 0, y: 0 };
    this.aimDir = { x: 0, y: -1 };

    // Weapon
    const weaponDef = WEAPONS.find((w) => w.id === characterDef.startingWeaponId) || WEAPONS[0];
    this.weapon = { ...weaponDef };
    this.weapon.cooldownMs -= upgrades.cooldownReduction || 0;
    this.weapon.cooldownMs = Math.max(50, this.weapon.cooldownMs);
    this.weapon.projectileSpeed += upgrades.projectileSpeed || 0;
    this.weapon.projectilesPerShot += upgrades.projectilesPerShot || 0;

    // Upgrade bonuses
    this.piercing = upgrades.piercing || 0;
    this.explosionRadius = (this.weapon.explosionRadius || 0) + (upgrades.explosionRadius || 0);
    this.critChance = upgrades.critChance || 0;
    this.magnetRadius = CONFIG.COIN.BASE_MAGNET_RADIUS + (upgrades.magnetRadius || 0);
    this.shieldMax = upgrades.shield || 0;
    this.shieldCurrent = this.shieldMax;
    this.shieldRegenTimer = 0;
    this.shieldRegenInterval = 10; // seconds
    this.shieldActive = this.shieldMax > 0;

    // Cooldown tracking
    this.shootTimer = 0;
    this.invulnTimer = 0;

    // Dash
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;

    // Special ability
    this.specialCooldown = 0;
    this.specialActive = false;
    this.specialDuration = 0;

    // Turrets (engineer)
    this.turrets = [];

    // Ghost invisibility
    this.invisible = false;
    this.invisTimer = 0;

    // Score and coins for this run
    this.score = 0;
    this.coinsCollected = 0;

    // Berserker passive: bonus damage at low health
    this.isBerserker = characterDef.id === 'berserker';
  }

  /** Apply damage with armor reduction */
  takeDamage(amount) {
    if (this.invulnTimer > 0) return 0;
    if (this.invisible) return 0;

    // Shield absorbs first
    if (this.shieldCurrent > 0) {
      const absorbed = Math.min(this.shieldCurrent, amount);
      this.shieldCurrent -= absorbed;
      amount -= absorbed;
      if (amount <= 0) {
        this.invulnTimer = CONFIG.PLAYER.INVULN_DURATION;
        return absorbed;
      }
    }

    const reduced = amount * (1 - this.armor / 100);
    this.health -= reduced;
    this.health = Math.max(0, this.health);
    this.invulnTimer = CONFIG.PLAYER.INVULN_DURATION;
    return reduced;
  }

  /** Heal the player */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /** Check if player is alive */
  isAlive() {
    return this.health > 0;
  }

  /** Get effective damage (berserker bonus at low health) */
  getEffectiveDamage() {
    let dmg = this.baseDamage + this.weapon.damage;
    if (this.isBerserker && this.health < this.maxHealth * 0.3) {
      dmg *= 1.5;
    }
    // Critical hit
    if (this.critChance > 0 && Math.random() < this.critChance) {
      dmg *= 2;
    }
    return dmg;
  }

  /** Update player each tick */
  update(dt, moveDir, aimDir, arenaW, arenaH) {
    // Movement
    const spd = this.dashTimer > 0
      ? this.speed * CONFIG.PLAYER.DASH_SPEED_MULT
      : this.speed;

    this.pos.x += moveDir.x * spd * dt;
    this.pos.y += moveDir.y * spd * dt;

    // Clamp to arena
    this.pos.x = clamp(this.pos.x, this.size, arenaW - this.size);
    this.pos.y = clamp(this.pos.y, this.size, arenaH - this.size);

    // Aim direction
    if (aimDir && (aimDir.x !== 0 || aimDir.y !== 0)) {
      this.aimDir = { ...aimDir };
    }

    // Timers
    if (this.shootTimer > 0) this.shootTimer -= dt * 1000;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt * 1000;
    if (this.specialCooldown > 0) this.specialCooldown -= dt * 1000;

    // Health regen
    if (this.healthRegen > 0 && this.health < this.maxHealth) {
      this.heal(this.healthRegen * dt);
    }

    // Shield regen
    if (this.shieldMax > 0 && this.shieldCurrent < this.shieldMax) {
      this.shieldRegenTimer += dt;
      if (this.shieldRegenTimer >= this.shieldRegenInterval) {
        this.shieldCurrent = this.shieldMax;
        this.shieldRegenTimer = 0;
      }
    }
    this.shieldActive = this.shieldCurrent > 0;

    // Ghost invisibility
    if (this.invisible) {
      this.invisTimer -= dt;
      if (this.invisTimer <= 0) {
        this.invisible = false;
      }
    }

    // Turret timers
    for (const t of this.turrets) {
      t.timer -= dt * 1000;
      t.lifetime -= dt;
    }
    this.turrets = this.turrets.filter((t) => t.lifetime > 0);
  }

  /** Check if weapon is ready to fire */
  canShoot() {
    return this.shootTimer <= 0;
  }

  /** Reset shoot cooldown */
  onShoot() {
    this.shootTimer = this.weapon.cooldownMs;
  }

  /** Attempt dash */
  dash() {
    if (this.dashCooldownTimer <= 0) {
      this.dashTimer = CONFIG.PLAYER.DASH_DURATION;
      this.dashCooldownTimer = CONFIG.PLAYER.DASH_COOLDOWN;
      return true;
    }
    return false;
  }

  /** Use special ability */
  useSpecial() {
    if (this.specialCooldown > 0) return null;

    if (this.specialAbility === 'turret') {
      this.turrets.push({
        pos: { x: this.pos.x, y: this.pos.y },
        timer: 0,
        cooldown: 500,
        damage: this.baseDamage * 0.5,
        lifetime: 8,
        range: 120,
      });
      this.specialCooldown = 5000;
      return 'turret';
    }

    if (this.specialAbility === 'invisibility') {
      this.invisible = true;
      this.invisTimer = 2;
      this.specialCooldown = 8000;
      return 'invisibility';
    }

    // Default: dash
    if (this.dash()) return 'dash';
    return null;
  }
}

export default Player;
