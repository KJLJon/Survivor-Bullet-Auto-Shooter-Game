# Survivors Bullet Hell

A mobile-first Survivors-style bullet hell game built with vanilla JavaScript, HTML Canvas, and CSS. No heavy frameworks -- just fast, minimal tooling with esbuild and Vitest.

## Features

- **Survivors bullet-hell gameplay** -- dodge enemy bullets, shoot back, collect coins, and upgrade
- **10 playable characters** with unique starting weapons and stats
- **12 upgradeable items** in the shop (health, speed, weapon mods, passives)
- **3 distinct levels** with escalating difficulty, wave-based enemy spawns, and bosses
- **Mobile-first controls** -- virtual joystick and shoot button on touch, WASD/arrows + mouse on desktop
- **Shop and progression** -- earn coins, buy characters/upgrades, unlock content through play
- **Offline PWA** -- service worker caches the app shell; works offline after first load
- **Update notifications** -- detects new service worker versions and prompts the user to refresh
- **Simple SFX** -- WebAudio oscillator-based sounds, all replaceable
- **Storage abstraction** -- LocalStorage adapter with async interface; swappable for a remote API

## Quick Start

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
# Open http://localhost:8000 in your browser

# Production build
npm run build

# Run tests
npm test

# Watch mode tests
npm run test:watch
```

## How to Play

### Controls

| Action | Mobile | Desktop |
|--------|--------|---------|
| Move | Virtual joystick (bottom-left) | WASD or Arrow keys |
| Shoot | FIRE button (bottom-right) / auto-shoots while moving | Space bar or Mouse click |
| Special ability | SPEC button | E key |
| Pause | -- | Escape |

### Gameplay

1. **Select a character** from the Characters menu (Rookie is unlocked by default)
2. **Choose a level** or hit Play to start Level 1
3. **Survive waves** of enemies -- dodge their bullets and shoot them down
4. **Collect coins** dropped by defeated enemies
5. **Between runs**, spend coins in the Shop on upgrades and new characters
6. **Unlock new levels** by completing previous ones
7. **Unlock characters** by reaching play count, score, or level thresholds

### HUD

- **Top-left**: Health bar and character name
- **Top-right**: Coins collected, score, and current wave
- **Bottom**: Mobile controls (joystick and action buttons)

## Project Structure

```
/
  public/
    index.html          # Main HTML page
    manifest.json       # PWA manifest
    service-worker.js   # Service worker for offline + updates
    icons/              # PWA icons (SVG placeholders)
    dist/               # Built bundle output
  src/
    main.js             # App bootstrap
    config.js           # All tuning constants
    game/
      engine.js         # Fixed-timestep game loop
      render.js         # Canvas rendering
      input.js          # Keyboard + touch input
      player.js         # Player class
      enemy.js          # Enemy class + spawn manager
      projectile.js     # Projectile class + factory functions
      level.js          # Level manager + wave logic
      shop.js           # Shop, upgrades, progression
      ui.js             # DOM overlays, HUD, toasts
    storage/
      storageAdapter.js      # Abstract storage interface
      localStorageAdapter.js # localStorage implementation
    audio/
      sfx.js            # WebAudio SFX manager
    data/
      characters.js     # 10 character definitions
      items.js          # 12 upgrade item definitions
      levels.js         # 3 level definitions
      weapons.js        # Weapon definitions
    utils/
      vector.js         # 2D vector math utilities
  tests/
    storage.test.js     # Storage adapter tests
    engine.test.js      # Engine loop tests
    player.test.js      # Player logic tests
    collision.test.js   # Collision detection tests
  package.json
  vitest.config.js
  TEST_PLAN.md
```

## Extending the Game

### Adding a new character

Add an entry to `src/data/characters.js`:

```js
{
  id: 'my_char',
  name: 'My Character',
  description: 'Does cool things.',
  color: '#ff6600',
  baseStats: { maxHealth: 100, healthRegen: 0, speed: 160, baseDamage: 10, cooldown: 300, size: 14, armor: 0 },
  startingWeaponId: 'pistol',
  unlockCondition: { type: 'coins', cost: 100 },
}
```

### Adding a new weapon

Add an entry to `src/data/weapons.js` and reference it from a character's `startingWeaponId`.

### Adding a new upgrade item

Add an entry to `src/data/items.js` with upgrade levels and costs.

### Adding a new level

Add an entry to `src/data/levels.js` with spawn patterns and boss definition.

### Swapping the storage adapter

Replace the import in `src/main.js`:

```js
// import { LocalStorageAdapter } from './storage/localStorageAdapter.js';
import { ApiStorageAdapter } from './storage/apiStorageAdapter.js';

// Then use: new ApiStorageAdapter(baseUrl)
```

The adapter interface is:
- `async get(key)` -- returns parsed JSON or null
- `async set(key, value)` -- stores JSON-serializable value
- `async remove(key)`
- `async clear()`
- `async keys()` -- returns array of keys

### Replacing SFX

```js
import sfx from './audio/sfx.js';
sfx.register('shoot', (ctx) => {
  // Your custom WebAudio code using ctx (AudioContext)
});
```

## Service Worker and Update Flow

1. On first load, the service worker caches the app shell (HTML, JS, CSS, icons)
2. Subsequent loads serve from cache first (cache-first strategy for app shell)
3. Dynamic requests use network-first with cache fallback
4. When a new service worker version is deployed, the browser detects the change
5. The app shows an "Update available -- Tap to refresh" toast
6. Clicking the toast tells the service worker to `skipWaiting` and reloads the page

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

Tests use **Vitest** with **jsdom** for DOM simulation. Test files are in `/tests/`.

See [TEST_PLAN.md](TEST_PLAN.md) for the full manual and automated test plan.

## License

MIT
