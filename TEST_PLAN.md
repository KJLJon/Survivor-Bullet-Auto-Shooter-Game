# Test Plan

## Automated Tests

Run all automated tests with `npm test`. Tests use Vitest with jsdom.

### storage.test.js
- `get()` returns null for missing keys
- `set()` and `get()` round-trip JSON values (objects, primitives, arrays)
- `set()` overwrites existing values
- `remove()` deletes a key
- `clear()` removes only prefixed keys, leaving others untouched
- `keys()` returns all stored keys
- Empty storage returns empty keys array
- Prefix isolation between adapter instances
- Corrupted JSON returns null gracefully

### engine.test.js
- Engine initializes with correct defaults (not running, no accumulator)
- `start()` sets running state and stores callbacks
- `stop()` sets running to false and cancels animation frame
- `pause()` and `resume()` toggle paused state
- Max accumulator clamp is configured correctly
- Tick count tracking

### player.test.js
- Initializes with character base stats
- Takes damage correctly (reduces health)
- Applies armor damage reduction (Tank character)
- Does not take damage while invulnerable
- Dies when health reaches 0
- Handles overkill damage
- Heals correctly, capped at max health
- Shoot cooldown management (canShoot / onShoot cycle)
- Upgrade application (maxHealth, speed, damage, cooldown, magnetRadius)
- Cooldown clamp to minimum 50ms
- Position updates based on movement direction
- Position clamped to arena bounds
- Health regeneration over time (Medic character)
- Berserker bonus damage at low health
- Shield absorption before health damage

### collision.test.js
- AABB collision: overlapping boxes detected
- AABB collision: non-overlapping boxes not detected
- AABB collision: touching edges (boundary case)
- AABB collision: same position
- AABB collision: different sizes
- Circle collision: overlapping and non-overlapping
- Distance calculation between points
- Vector normalization
- Vector from angle with magnitude

## Manual Test Plan

### 1. Install and Offline Support
- [ ] Clone repo and run `npm install` -- verify no errors
- [ ] Run `npm run dev` -- verify app loads at localhost
- [ ] Open DevTools > Application > Service Workers -- verify SW registered
- [ ] Navigate the app to cache assets, then go offline (DevTools > Network > Offline)
- [ ] Reload -- verify the app loads from cache and is playable offline

### 2. Service Worker Update Flow
- [ ] Build and serve the app
- [ ] Make a change to any source file and rebuild
- [ ] Change the CACHE_NAME in service-worker.js (e.g., `survivors-v2`)
- [ ] Reload the page -- verify "Update available" toast appears
- [ ] Tap/click the toast -- verify the page reloads with the new version

### 3. Gameplay -- Player Movement and Shooting
- [ ] Start a game with Rookie character
- [ ] Verify WASD/Arrow keys move the player on desktop
- [ ] Verify mouse click fires projectiles in the aim direction
- [ ] Verify Space bar fires projectiles in the current aim direction
- [ ] On mobile/touch: verify virtual joystick controls movement
- [ ] On mobile/touch: verify FIRE button shoots
- [ ] Verify player cannot move outside the arena bounds

### 4. Enemy Spawning and Waves
- [ ] Start Level 1 -- verify enemies spawn in waves
- [ ] Verify "Wave X" text appears between waves
- [ ] Verify enemies move toward the player
- [ ] Verify enemies fire bullet patterns (radial, aimed)
- [ ] Survive to wave 5 -- verify boss spawns
- [ ] Verify boss has health bar and multi-bullet patterns

### 5. Collisions and Damage
- [ ] Verify player projectiles damage enemies (health bar decreases)
- [ ] Verify enemy projectiles damage the player (HUD health bar decreases)
- [ ] Verify contact with enemies damages the player
- [ ] Verify player health bar turns red at low health
- [ ] Verify game over screen appears when health reaches 0

### 6. Coins and Collection
- [ ] Kill enemies and verify coins drop (yellow circles)
- [ ] Walk near coins and verify they are pulled toward player (magnet)
- [ ] Verify coin counter increases in HUD when collected
- [ ] Verify coin sound plays on collection

### 7. Shop and Persistence
- [ ] Complete a game run and note coins earned
- [ ] Return to main menu -- verify coin count reflects earned coins
- [ ] Open Shop -- verify items are listed with current levels and costs
- [ ] Purchase an upgrade -- verify coins decrease and level increases
- [ ] Reload the page -- verify purchased upgrade persists
- [ ] Verify upgrade effects apply in next game (e.g., increased health)

### 8. Characters
- [ ] Open Characters menu -- verify 10 characters listed
- [ ] Verify Rookie is unlocked and selected by default
- [ ] Verify locked characters show unlock conditions
- [ ] Play enough games to unlock a progression-based character
- [ ] Verify newly unlocked character can be selected
- [ ] Buy a coin-based character -- verify it unlocks
- [ ] Start game with different character -- verify unique color and stats

### 9. Levels
- [ ] Verify Level 1 is unlocked by default
- [ ] Complete Level 1 -- verify Level 2 unlocks
- [ ] Verify Level 2 has different background, more enemies, spiral bullets
- [ ] Complete Level 2 -- verify Level 3 unlocks
- [ ] Verify Level 3 has largest arena and most intense bullet patterns

### 10. Audio SFX
- [ ] Verify shoot sound plays when firing
- [ ] Verify hit sound plays when projectile hits enemy
- [ ] Verify enemy death sound plays
- [ ] Verify coin collection chime plays
- [ ] Verify wave/level complete sound plays

### 11. UI and Responsiveness
- [ ] Verify HUD elements are positioned correctly (health top-left, score top-right)
- [ ] Resize browser window -- verify canvas scales proportionally
- [ ] Test on mobile viewport (375x667) -- verify touch controls appear
- [ ] Test on tablet viewport -- verify controls still work
- [ ] Desktop (768px+) -- verify touch controls are hidden

### 12. Performance
- [ ] Open DevTools Performance tab
- [ ] Play through several waves with moderate bullet count
- [ ] Verify frame rate stays near 60 FPS
- [ ] Check for memory leaks (heap size shouldn't grow unbounded)

### 13. PWA Installation
- [ ] Open app in Chrome on Android or Safari on iOS
- [ ] Verify "Add to Home Screen" prompt or option is available
- [ ] Install as PWA -- verify it opens in standalone mode
- [ ] Verify the app icon appears on home screen
