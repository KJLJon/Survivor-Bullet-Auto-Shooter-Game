/**
 * 3 level definitions. Each level has:
 * id, name, arenaSize, backgroundColor, spawnPatterns, waves, unlockCondition.
 */

const LEVELS = [
  {
    id: 'level1',
    name: 'The Arena',
    description: 'A small arena with slow enemies and simple radial bullets.',
    arenaSize: { width: 400, height: 700 },
    backgroundColor: '#1a1a2e',
    gridColor: 'rgba(255,255,255,0.03)',
    totalWaves: 10,
    spawnPatterns: [
      {
        type: 'basic',
        enemyType: 'grunt',
        weight: 70,
        bulletPattern: 'radial',
      },
      {
        type: 'basic',
        enemyType: 'shooter',
        weight: 30,
        bulletPattern: 'aimed',
      },
    ],
    bossWave: {
      enemyType: 'boss',
      bulletPattern: 'radial_fast',
      hp: 300,
      size: 28,
    },
    unlockCondition: { type: 'default' },
  },
  {
    id: 'level2',
    name: 'The Gauntlet',
    description: 'Medium arena with faster enemies and spiral bullets.',
    arenaSize: { width: 500, height: 800 },
    backgroundColor: '#162447',
    gridColor: 'rgba(255,255,255,0.04)',
    totalWaves: 15,
    spawnPatterns: [
      {
        type: 'basic',
        enemyType: 'grunt',
        weight: 40,
        bulletPattern: 'radial',
      },
      {
        type: 'basic',
        enemyType: 'shooter',
        weight: 35,
        bulletPattern: 'spiral',
      },
      {
        type: 'mini_boss',
        enemyType: 'mini_boss',
        weight: 25,
        bulletPattern: 'aimed_burst',
        waveMin: 3,
      },
    ],
    bossWave: {
      enemyType: 'boss',
      bulletPattern: 'spiral_multi',
      hp: 600,
      size: 32,
    },
    unlockCondition: { type: 'levelsCompleted', count: 1 },
  },
  {
    id: 'level3',
    name: 'The Inferno',
    description: 'Large arena with dense bullets and a multi-phase boss.',
    arenaSize: { width: 600, height: 900 },
    backgroundColor: '#1b1b2f',
    gridColor: 'rgba(255,255,255,0.03)',
    totalWaves: 20,
    spawnPatterns: [
      {
        type: 'basic',
        enemyType: 'grunt',
        weight: 30,
        bulletPattern: 'radial',
      },
      {
        type: 'basic',
        enemyType: 'shooter',
        weight: 30,
        bulletPattern: 'spiral',
      },
      {
        type: 'basic',
        enemyType: 'fast_grunt',
        weight: 20,
        bulletPattern: 'aimed',
      },
      {
        type: 'mini_boss',
        enemyType: 'mini_boss',
        weight: 20,
        bulletPattern: 'wave',
        waveMin: 2,
      },
    ],
    bossWave: {
      enemyType: 'boss',
      bulletPattern: 'multi_phase',
      hp: 1000,
      size: 36,
      phases: 3,
    },
    unlockCondition: { type: 'levelsCompleted', count: 2 },
  },
];

export default LEVELS;
