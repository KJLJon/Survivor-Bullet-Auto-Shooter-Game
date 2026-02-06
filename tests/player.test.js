/**
 * Tests for Player class - damage, heal, cooldown, and upgrades.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../src/game/player.js';
import CHARACTERS from '../src/data/characters.js';

describe('Player', () => {
  let player;
  const rookie = CHARACTERS.find((c) => c.id === 'rookie');

  beforeEach(() => {
    player = new Player(rookie, {});
  });

  it('should initialize with character base stats', () => {
    expect(player.name).toBe('Rookie');
    expect(player.maxHealth).toBe(100);
    expect(player.health).toBe(100);
    expect(player.speed).toBe(160);
    expect(player.armor).toBe(0);
    expect(player.size).toBe(14);
    expect(player.isAlive()).toBe(true);
  });

  it('should take damage correctly', () => {
    const dmg = player.takeDamage(30);
    expect(dmg).toBe(30);
    expect(player.health).toBe(70);
    expect(player.isAlive()).toBe(true);
  });

  it('should apply armor damage reduction', () => {
    // Use Tank which has 15 armor
    const tank = CHARACTERS.find((c) => c.id === 'tank');
    const tankPlayer = new Player(tank, {});
    tankPlayer.invulnTimer = 0; // Ensure no invuln
    const dmg = tankPlayer.takeDamage(100);
    expect(dmg).toBe(85); // 100 * (1 - 15/100) = 85
    expect(tankPlayer.health).toBeCloseTo(tankPlayer.maxHealth - 85);
  });

  it('should not take damage when invulnerable', () => {
    player.invulnTimer = 1;
    const dmg = player.takeDamage(50);
    expect(dmg).toBe(0);
    expect(player.health).toBe(100);
  });

  it('should die when health reaches 0', () => {
    player.takeDamage(100);
    expect(player.health).toBe(0);
    expect(player.isAlive()).toBe(false);
  });

  it('should handle overkill damage', () => {
    player.takeDamage(200);
    expect(player.health).toBe(0);
    expect(player.isAlive()).toBe(false);
  });

  it('should heal correctly', () => {
    player.takeDamage(50);
    player.heal(30);
    expect(player.health).toBe(80);
  });

  it('should not heal beyond max health', () => {
    player.heal(50);
    expect(player.health).toBe(100);
  });

  it('should manage shoot cooldown', () => {
    expect(player.canShoot()).toBe(true);
    player.onShoot();
    expect(player.canShoot()).toBe(false);

    // Simulate time passing
    player.shootTimer = 0;
    expect(player.canShoot()).toBe(true);
  });

  it('should apply upgrades to stats', () => {
    const upgradedPlayer = new Player(rookie, {
      maxHealth: 30,
      speed: 20,
      damageBoost: 5,
      cooldownReduction: 50,
      magnetRadius: 40,
    });

    expect(upgradedPlayer.maxHealth).toBe(130);
    expect(upgradedPlayer.health).toBe(130);
    expect(upgradedPlayer.speed).toBe(180);
    expect(upgradedPlayer.baseDamage).toBe(15);
    expect(upgradedPlayer.weapon.cooldownMs).toBe(250);
    expect(upgradedPlayer.magnetRadius).toBe(80);
  });

  it('should clamp cooldown to minimum 50ms', () => {
    const fastPlayer = new Player(rookie, { cooldownReduction: 500 });
    expect(fastPlayer.weapon.cooldownMs).toBe(50);
  });

  it('should update position based on movement', () => {
    const startX = player.pos.x;
    const startY = player.pos.y;
    player.update(1 / 60, { x: 1, y: 0 }, { x: 1, y: 0 }, 400, 700);
    expect(player.pos.x).toBeGreaterThan(startX);
    expect(player.pos.y).toBe(startY);
  });

  it('should clamp position to arena bounds', () => {
    player.pos.x = -100;
    player.update(0, { x: 0, y: 0 }, { x: 0, y: -1 }, 400, 700);
    expect(player.pos.x).toBe(player.size);
  });

  it('should regenerate health over time for medic', () => {
    const medic = CHARACTERS.find((c) => c.id === 'medic');
    const medicPlayer = new Player(medic, {});
    medicPlayer.health = 50;
    medicPlayer.update(1, { x: 0, y: 0 }, { x: 0, y: -1 }, 400, 700);
    expect(medicPlayer.health).toBeGreaterThan(50);
  });

  it('should give berserker bonus damage at low health', () => {
    const berserker = CHARACTERS.find((c) => c.id === 'berserker');
    const bPlayer = new Player(berserker, {});

    const normalDmg = bPlayer.getEffectiveDamage();
    bPlayer.health = bPlayer.maxHealth * 0.2; // Below 30% threshold
    const lowHpDmg = bPlayer.getEffectiveDamage();

    expect(lowHpDmg).toBeGreaterThan(normalDmg);
  });

  it('should handle shield absorption', () => {
    const shieldPlayer = new Player(rookie, { shield: 20 });
    expect(shieldPlayer.shieldMax).toBe(20);
    expect(shieldPlayer.shieldCurrent).toBe(20);

    shieldPlayer.takeDamage(15);
    expect(shieldPlayer.shieldCurrent).toBe(5);
    expect(shieldPlayer.health).toBe(100);

    // Reset invuln for next test
    shieldPlayer.invulnTimer = 0;

    shieldPlayer.takeDamage(10);
    expect(shieldPlayer.shieldCurrent).toBe(0);
    expect(shieldPlayer.health).toBe(95);
  });
});
