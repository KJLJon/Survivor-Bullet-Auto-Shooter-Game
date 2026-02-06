/**
 * 12 upgradeable items available in the shop.
 * Each item has: id, name, description, type, levels (array with stat deltas and cost).
 * Types: weaponUpgrade, playerBoost, passive
 */

const ITEMS = [
  {
    id: 'reinforced_plating',
    name: 'Reinforced Plating',
    description: 'Increases max health.',
    type: 'playerBoost',
    stat: 'maxHealth',
    levels: [
      { delta: 20, cost: 30 },
      { delta: 15, cost: 60 },
      { delta: 12, cost: 100 },
      { delta: 10, cost: 150 },
      { delta: 8, cost: 220 },
    ],
  },
  {
    id: 'lightweight_boots',
    name: 'Lightweight Boots',
    description: 'Increases movement speed.',
    type: 'playerBoost',
    stat: 'speed',
    levels: [
      { delta: 15, cost: 25 },
      { delta: 12, cost: 50 },
      { delta: 10, cost: 85 },
      { delta: 8, cost: 130 },
    ],
  },
  {
    id: 'auto_loader',
    name: 'Auto-Loader',
    description: 'Reduces weapon cooldown.',
    type: 'weaponUpgrade',
    stat: 'cooldownReduction',
    levels: [
      { delta: 20, cost: 35 },
      { delta: 15, cost: 70 },
      { delta: 12, cost: 120 },
      { delta: 10, cost: 180 },
    ],
  },
  {
    id: 'high_velocity_rounds',
    name: 'High-Velocity Rounds',
    description: 'Increases projectile speed.',
    type: 'weaponUpgrade',
    stat: 'projectileSpeed',
    levels: [
      { delta: 40, cost: 30 },
      { delta: 35, cost: 60 },
      { delta: 30, cost: 100 },
    ],
  },
  {
    id: 'piercing_rounds',
    name: 'Piercing Rounds',
    description: 'Projectiles pierce through enemies.',
    type: 'weaponUpgrade',
    stat: 'piercing',
    levels: [
      { delta: 1, cost: 80 },
      { delta: 1, cost: 160 },
      { delta: 1, cost: 280 },
    ],
  },
  {
    id: 'rapid_fire_mod',
    name: 'Rapid Fire Mod',
    description: 'Increases projectiles per shot.',
    type: 'weaponUpgrade',
    stat: 'projectilesPerShot',
    levels: [
      { delta: 1, cost: 60 },
      { delta: 1, cost: 130 },
      { delta: 1, cost: 220 },
    ],
  },
  {
    id: 'nano_healer',
    name: 'Nano-Healer',
    description: 'Slowly heals in combat.',
    type: 'passive',
    stat: 'healthRegen',
    levels: [
      { delta: 2, cost: 40 },
      { delta: 2, cost: 80 },
      { delta: 1.5, cost: 130 },
      { delta: 1, cost: 190 },
    ],
  },
  {
    id: 'coin_magnet',
    name: 'Coin Magnet',
    description: 'Increases coin pickup radius.',
    type: 'passive',
    stat: 'magnetRadius',
    levels: [
      { delta: 25, cost: 20 },
      { delta: 20, cost: 45 },
      { delta: 18, cost: 80 },
      { delta: 15, cost: 120 },
      { delta: 12, cost: 170 },
    ],
  },
  {
    id: 'shield_generator',
    name: 'Shield Generator',
    description: 'Periodic damage-absorbing shield.',
    type: 'passive',
    stat: 'shield',
    levels: [
      { delta: 15, cost: 100 },
      { delta: 12, cost: 200 },
      { delta: 10, cost: 320 },
    ],
  },
  {
    id: 'explosive_rounds',
    name: 'Explosive Rounds',
    description: 'Adds area damage on hit.',
    type: 'weaponUpgrade',
    stat: 'explosionRadius',
    levels: [
      { delta: 20, cost: 70 },
      { delta: 15, cost: 140 },
      { delta: 12, cost: 230 },
    ],
  },
  {
    id: 'critical_tuner',
    name: 'Critical Tuner',
    description: 'Increases critical hit chance.',
    type: 'passive',
    stat: 'critChance',
    levels: [
      { delta: 0.08, cost: 50 },
      { delta: 0.06, cost: 100 },
      { delta: 0.05, cost: 160 },
      { delta: 0.04, cost: 240 },
    ],
  },
  {
    id: 'ammo_reserve',
    name: 'Ammo Reserve',
    description: 'Reduces cooldown penalty and increases damage.',
    type: 'passive',
    stat: 'damageBoost',
    levels: [
      { delta: 3, cost: 35 },
      { delta: 3, cost: 70 },
      { delta: 2, cost: 115 },
      { delta: 2, cost: 170 },
      { delta: 1, cost: 230 },
    ],
  },
];

export default ITEMS;
