/**
 * Weapon definitions referenced by characters.
 * Each weapon has: id, name, cooldownMs, projectileSpeed, damage,
 * spreadDegrees, projectilesPerShot, special.
 */

const WEAPONS = [
  {
    id: 'pistol',
    name: 'Pistol',
    cooldownMs: 300,
    projectileSpeed: 350,
    damage: 10,
    spreadDegrees: 5,
    projectilesPerShot: 1,
    special: null,
  },
  {
    id: 'smg',
    name: 'SMG',
    cooldownMs: 120,
    projectileSpeed: 380,
    damage: 5,
    spreadDegrees: 12,
    projectilesPerShot: 1,
    special: null,
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    cooldownMs: 600,
    projectileSpeed: 300,
    damage: 8,
    spreadDegrees: 35,
    projectilesPerShot: 5,
    special: null,
  },
  {
    id: 'sniper',
    name: 'Sniper Rifle',
    cooldownMs: 900,
    projectileSpeed: 600,
    damage: 35,
    spreadDegrees: 1,
    projectilesPerShot: 1,
    special: 'piercing',
  },
  {
    id: 'burst_rifle',
    name: 'Burst Rifle',
    cooldownMs: 400,
    projectileSpeed: 400,
    damage: 7,
    spreadDegrees: 8,
    projectilesPerShot: 3,
    special: null,
  },
  {
    id: 'melee_blaster',
    name: 'Melee Blaster',
    cooldownMs: 180,
    projectileSpeed: 200,
    damage: 14,
    spreadDegrees: 30,
    projectilesPerShot: 2,
    special: null,
    range: 80,
  },
  {
    id: 'rocket',
    name: 'Rocket Launcher',
    cooldownMs: 800,
    projectileSpeed: 250,
    damage: 30,
    spreadDegrees: 3,
    projectilesPerShot: 1,
    special: 'explosive',
    explosionRadius: 40,
  },
];

export default WEAPONS;
