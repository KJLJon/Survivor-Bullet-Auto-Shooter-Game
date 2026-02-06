/**
 * Projectile class - manages player and enemy bullets.
 */

import CONFIG from '../config.js';
import { fromAngle } from '../utils/vector.js';

export class Projectile {
  constructor({ pos, vel, damage, size, isPlayerBullet, piercing = 0, range, explosionRadius = 0 }) {
    this.pos = { ...pos };
    this.vel = { ...vel };
    this.damage = damage;
    this.size = size || (isPlayerBullet ? CONFIG.PROJECTILE.PLAYER_SIZE : CONFIG.PROJECTILE.DEFAULT_SIZE);
    this.color = isPlayerBullet ? CONFIG.PROJECTILE.PLAYER_COLOR : CONFIG.PROJECTILE.ENEMY_COLOR;
    this.isPlayerBullet = isPlayerBullet;
    this.alive = true;
    this.piercing = piercing;
    this.hitCount = 0;
    this.range = range || 0;
    this.distanceTraveled = 0;
    this.explosionRadius = explosionRadius;
  }

  update(dt) {
    const dx = this.vel.x * dt;
    const dy = this.vel.y * dt;
    this.pos.x += dx;
    this.pos.y += dy;
    this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

    // Limited range check
    if (this.range > 0 && this.distanceTraveled >= this.range) {
      this.alive = false;
    }
  }

  /** Check if projectile is out of bounds */
  isOutOfBounds(arenaW, arenaH) {
    const margin = 20;
    return (
      this.pos.x < -margin ||
      this.pos.x > arenaW + margin ||
      this.pos.y < -margin ||
      this.pos.y > arenaH + margin
    );
  }

  /** Called when projectile hits something */
  onHit() {
    this.hitCount++;
    if (this.hitCount > this.piercing) {
      this.alive = false;
    }
  }
}

/**
 * Create player projectiles from weapon definition and aim direction.
 * Returns array of Projectile instances.
 */
export function createPlayerProjectiles(player) {
  const weapon = player.weapon;
  const projectiles = [];
  const baseAngle = Math.atan2(player.aimDir.y, player.aimDir.x);
  const spreadRad = (weapon.spreadDegrees * Math.PI) / 180;

  for (let i = 0; i < weapon.projectilesPerShot; i++) {
    let angle = baseAngle;
    if (weapon.projectilesPerShot > 1) {
      const t = weapon.projectilesPerShot === 1
        ? 0
        : (i / (weapon.projectilesPerShot - 1)) - 0.5;
      angle += t * spreadRad;
    } else {
      angle += (Math.random() - 0.5) * spreadRad;
    }

    const vel = fromAngle(angle, weapon.projectileSpeed);
    projectiles.push(
      new Projectile({
        pos: { x: player.pos.x, y: player.pos.y },
        vel,
        damage: player.getEffectiveDamage(),
        isPlayerBullet: true,
        piercing: (weapon.special === 'piercing' ? 2 : 0) + player.piercing,
        range: weapon.range || 0,
        explosionRadius: weapon.special === 'explosive'
          ? (weapon.explosionRadius || 40) + player.explosionRadius
          : player.explosionRadius,
      })
    );
  }

  return projectiles;
}

/**
 * Create enemy projectiles from bullet descriptors.
 * Returns array of Projectile instances.
 */
export function createEnemyProjectiles(bulletDescs) {
  return bulletDescs.map(
    (b) =>
      new Projectile({
        pos: b.pos,
        vel: b.vel,
        damage: b.damage,
        size: b.size,
        isPlayerBullet: false,
      })
  );
}

/**
 * Create turret projectile aimed at nearest enemy.
 */
export function createTurretProjectile(turret, targetPos) {
  const dx = targetPos.x - turret.pos.x;
  const dy = targetPos.y - turret.pos.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;

  return new Projectile({
    pos: { ...turret.pos },
    vel: { x: (dx / len) * 300, y: (dy / len) * 300 },
    damage: turret.damage,
    isPlayerBullet: true,
    size: 3,
  });
}

export default Projectile;
