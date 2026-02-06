/**
 * Main app bootstrap.
 * Initializes all systems and manages app-level state transitions.
 */

import { Engine } from './game/engine.js';
import { Renderer } from './game/render.js';
import { InputManager } from './game/input.js';
import { LevelManager } from './game/level.js';
import { Shop } from './game/shop.js';
import { UIManager } from './game/ui.js';
import { LocalStorageAdapter } from './storage/localStorageAdapter.js';
import CONFIG from './config.js';
import sfx from './audio/sfx.js';

class App {
  constructor() {
    this.storage = new LocalStorageAdapter();
    this.shop = new Shop(this.storage);
    this.engine = new Engine();
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new InputManager(this.canvas);
    this.ui = new UIManager();
    this.level = new LevelManager();
    this.currentLevelIndex = 0;
    this.gameActive = false;
  }

  async init() {
    // Load progression
    await this.shop.load();

    // Wire up UI callbacks
    this.ui.onPlay = () => this.startGame(this.currentLevelIndex);
    this.ui.onSelectLevel = () => this.ui.showLevelSelect(this.shop.progression);
    this.ui.onLevelChosen = (i) => this.startGame(i);
    this.ui.onCharacters = () => this.ui.showCharacterSelect(this.shop);
    this.ui.onCharacterSelected = async (id) => {
      await this.shop.selectCharacter(id);
      this.ui.showCharacterSelect(this.shop);
      this.ui.showToast(`Selected ${this.shop.getSelectedCharacter().name}`);
    };
    this.ui.onShop = () => this.ui.showShop(this.shop);
    this.ui.onShopBuy = async (itemId) => {
      const result = await this.shop.buyUpgrade(itemId);
      if (result.success) {
        this.ui.showShop(this.shop);
        this.ui.showToast('Upgrade purchased!');
      } else {
        this.ui.showToast(result.reason === 'insufficient' ? 'Not enough coins!' : 'Already maxed!');
      }
    };
    this.ui.onShopBuyChar = async (charId) => {
      const result = await this.shop.buyCharacter(charId);
      if (result.success) {
        this.ui.showCharacterSelect(this.shop);
        this.ui.showToast('Character unlocked!');
      } else {
        this.ui.showToast('Cannot buy this character.');
      }
    };
    this.ui.onResume = () => {
      this.ui.hidePause();
      this.engine.resume();
    };
    this.ui.onQuit = () => {
      this.engine.stop();
      this.gameActive = false;
      this.showMainMenu();
    };
    this.ui.onRetry = () => this.startGame(this.currentLevelIndex);
    this.ui.onGoMenu = () => {
      this.engine.stop();
      this.gameActive = false;
      this.showMainMenu();
    };
    this.ui.onNextLevel = () => {
      const next = this.currentLevelIndex + 1;
      if (next < 3) {
        this.startGame(next);
      } else {
        this.showMainMenu();
      }
    };

    // Show main menu
    this.showMainMenu();

    // Register service worker
    this._registerSW();

    // Initialize audio on first interaction
    document.addEventListener('click', () => sfx._ensureContext(), { once: true });
    document.addEventListener('touchstart', () => sfx._ensureContext(), { once: true });
  }

  showMainMenu() {
    this.ui.showMenu(this.shop.progression);
  }

  async startGame(levelIndex) {
    this.currentLevelIndex = levelIndex;
    const char = this.shop.getSelectedCharacter();
    const upgrades = this.shop.getUpgradeBonuses();

    const ok = this.level.startLevel(levelIndex, char, upgrades);
    if (!ok) {
      this.ui.showToast('Level not available');
      return;
    }

    this.gameActive = true;
    this.ui.startGame();

    // Update renderer size for level arena
    const arena = this.level.getArenaSize();
    this.renderer.width = arena.width;
    this.renderer.height = arena.height;
    this.renderer._resize();

    this.engine.start(
      (dt) => this._update(dt),
      (alpha) => this._render(alpha)
    );
  }

  _update(dt) {
    // Check for pause
    if (this.input.consumePause()) {
      this.engine.pause();
      this.ui.showPause();
      return;
    }

    this.level.update(dt, this.input);

    // Update HUD
    if (this.level.player) {
      this.ui.updateHUD(
        this.level.player,
        this.level.score,
        this.level.coinsCollected,
        this.level.wave
      );
    }

    // Handle state changes
    if (this.level.state === 'gameover') {
      this.engine.stop();
      this._endGame(false);
    } else if (this.level.state === 'complete') {
      this.engine.stop();
      this._endGame(true);
    }
  }

  async _endGame(completed) {
    this.gameActive = false;
    const score = this.level.score;
    const coins = this.level.coinsCollected;

    await this.shop.addCoins(coins);
    await this.shop.recordPlay(score, this.currentLevelIndex, completed);

    if (completed) {
      this.ui.showLevelComplete(
        score, coins, this.level.wave,
        this.level.levelDef.name
      );
    } else {
      this.ui.showGameOver(score, coins, this.level.wave);
    }
  }

  _render(alpha) {
    if (!this.level.levelDef) return;
    const level = this.level;

    this.renderer.clear(level.levelDef.backgroundColor);
    this.renderer.drawGrid(level.levelDef.gridColor);

    // Draw coins
    this.renderer.drawCoins(level.coins);

    // Draw turrets
    if (level.player) {
      this.renderer.drawTurrets(level.player.turrets);
    }

    // Draw enemies
    this.renderer.drawEnemies(level.enemies);

    // Draw projectiles
    this.renderer.drawProjectiles(level.playerProjectiles);
    this.renderer.drawProjectiles(level.enemyProjectiles);

    // Draw explosions
    this.renderer.drawExplosions(level.explosions);

    // Draw player
    if (level.player) {
      this.renderer.drawPlayer(level.player);
    }

    // Wave transition text
    if (level.state === 'waveTransition') {
      const ctx = this.renderer.ctx;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Wave ${level.wave + 1}`,
        this.renderer.width / 2,
        this.renderer.height / 2
      );
      ctx.textAlign = 'start';
    }
  }

  _registerSW() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('service-worker.js')
      .then((reg) => {
        // Check for updates periodically
        setInterval(() => reg.update(), 60000);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              newWorker.postMessage({ type: 'SKIPWAITING_READY' });
              // Notify clients
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CHECKUPDATE' });
              }
              // Also dispatch directly
              window.dispatchEvent(new CustomEvent('swupdate'));
              // The service worker itself will also postMessage SWUPDATEAVAILABLE
            }
          });
        });
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });

    // Listen for update event
    window.addEventListener('swupdate', () => {
      sfx.play('updateAvailable');
      this.ui._showUpdateToast();
    });
  }
}

// Boot
const app = new App();
app.init();
