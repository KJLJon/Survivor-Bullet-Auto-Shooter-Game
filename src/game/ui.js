/**
 * UI Manager - handles all DOM-based UI overlays, HUD updates,
 * service worker update notifications, and toast messages.
 */

import CONFIG from '../config.js';
import LEVELS from '../data/levels.js';
import CHARACTERS from '../data/characters.js';
import ITEMS from '../data/items.js';
import { isLevelUnlocked } from './level.js';
import sfx from '../audio/sfx.js';

export class UIManager {
  constructor() {
    // Overlay references
    this.menuOverlay = document.getElementById('menu-overlay');
    this.levelSelectOverlay = document.getElementById('level-select-overlay');
    this.charSelectOverlay = document.getElementById('char-select-overlay');
    this.shopOverlay = document.getElementById('shop-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.levelCompleteOverlay = document.getElementById('levelcomplete-overlay');
    this.toastContainer = document.getElementById('toast-container');

    // HUD refs
    this.playerNameEl = document.getElementById('player-name');
    this.healthBar = document.getElementById('health-bar');
    this.healthText = document.getElementById('health-text');
    this.coinDisplay = document.getElementById('coin-display');
    this.scoreDisplay = document.getElementById('score-display');
    this.waveDisplay = document.getElementById('wave-display');

    // Menu stats
    this.menuPlays = document.getElementById('menu-plays');
    this.menuHighscore = document.getElementById('menu-highscore');
    this.menuCoins = document.getElementById('menu-coins');

    // All overlays for hiding
    this.allOverlays = [
      this.menuOverlay, this.levelSelectOverlay, this.charSelectOverlay,
      this.shopOverlay, this.pauseOverlay, this.gameoverOverlay,
      this.levelCompleteOverlay,
    ];

    // Callbacks
    this.onPlay = null;
    this.onSelectLevel = null;
    this.onLevelChosen = null;
    this.onCharacters = null;
    this.onCharacterSelected = null;
    this.onShop = null;
    this.onShopBuy = null;
    this.onShopBuyChar = null;
    this.onResume = null;
    this.onQuit = null;
    this.onRetry = null;
    this.onGoMenu = null;
    this.onNextLevel = null;

    this._setupButtons();
    this._setupServiceWorker();
  }

  _setupButtons() {
    document.getElementById('btn-play').addEventListener('click', () => this.onPlay?.());
    document.getElementById('btn-select-level').addEventListener('click', () => this.onSelectLevel?.());
    document.getElementById('btn-characters').addEventListener('click', () => this.onCharacters?.());
    document.getElementById('btn-shop').addEventListener('click', () => this.onShop?.());
    document.getElementById('btn-level-back').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-char-back').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-shop-back').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-resume').addEventListener('click', () => this.onResume?.());
    document.getElementById('btn-quit').addEventListener('click', () => this.onQuit?.());
    document.getElementById('btn-retry').addEventListener('click', () => this.onRetry?.());
    document.getElementById('btn-go-menu').addEventListener('click', () => this.onGoMenu?.());
    document.getElementById('btn-next-level').addEventListener('click', () => this.onNextLevel?.());
    document.getElementById('btn-lc-shop').addEventListener('click', () => this.onShop?.());
    document.getElementById('btn-lc-menu').addEventListener('click', () => this.onGoMenu?.());
  }

  /** Listen for service worker update messages */
  _setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SWUPDATEAVAILABLE') {
          sfx.play('updateAvailable');
          this._showUpdateToast();
        }
      });
    }
  }

  _showUpdateToast() {
    const toast = document.createElement('div');
    toast.className = 'toast update-toast';
    toast.textContent = 'Update available — Tap to refresh';
    toast.addEventListener('click', () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIPWAITING' });
      }
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    });
    this.toastContainer.appendChild(toast);
  }

  /** Show a temporary toast message */
  showToast(message, duration = CONFIG.UI.TOAST_DURATION) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    if (duration > 0) {
      setTimeout(() => toast.remove(), duration);
    }
  }

  /** Hide all overlays */
  hideAll() {
    this.allOverlays.forEach((o) => o?.classList.add('hidden'));
  }

  /** Show main menu */
  showMenu(progression) {
    this.hideAll();
    this.menuOverlay?.classList.remove('hidden');
    if (progression) {
      this.menuPlays.textContent = `Plays: ${progression.playCount}`;
      this.menuHighscore.textContent = `Best: ${progression.highScore}`;
      this.menuCoins.textContent = `Coins: ${progression.coins}`;
    }
  }

  /** Show level select */
  showLevelSelect(progression) {
    this.hideAll();
    this.levelSelectOverlay?.classList.remove('hidden');
    const list = document.getElementById('level-list');
    list.innerHTML = '';
    LEVELS.forEach((level, i) => {
      const unlocked = isLevelUnlocked(level, progression);
      const btn = document.createElement('button');
      btn.className = 'menu-btn';
      btn.textContent = `${level.name}${unlocked ? '' : ' (Locked)'}`;
      btn.disabled = !unlocked;
      const bestScore = progression.levelScores?.[level.id] || 0;
      if (unlocked && bestScore > 0) {
        btn.textContent += ` — Best: ${bestScore}`;
      }
      btn.addEventListener('click', () => this.onLevelChosen?.(i));
      list.appendChild(btn);
    });
  }

  /** Show character select */
  showCharacterSelect(shop) {
    this.hideAll();
    this.charSelectOverlay?.classList.remove('hidden');
    const grid = document.getElementById('char-grid');
    grid.innerHTML = '';
    CHARACTERS.forEach((char) => {
      const unlocked = shop.isCharacterUnlocked(char.id);
      const canBuy = shop.canBuyCharacter(char.id);
      const selected = shop.progression.selectedCharacter === char.id;

      const card = document.createElement('div');
      card.className = 'char-card' + (selected ? ' selected' : '') + (!unlocked && !canBuy ? ' locked' : '');

      let statusText = '';
      if (!unlocked) {
        const cond = char.unlockCondition;
        if (cond.type === 'coins') statusText = `Cost: ${cond.cost} coins`;
        else if (cond.type === 'plays') statusText = `Need ${cond.count} plays`;
        else if (cond.type === 'score') statusText = `Need ${cond.threshold} score`;
        else if (cond.type === 'levelsCompleted') statusText = `Complete ${cond.count} levels`;
      }

      card.innerHTML = `
        <div style="width:30px;height:30px;border-radius:50%;background:${char.color};margin:0 auto 6px;"></div>
        <div class="char-name">${char.name}</div>
        <div class="char-desc">${char.description}</div>
        ${!unlocked ? `<div style="color:#f1c40f;font-size:11px;margin-top:4px;">${statusText}</div>` : ''}
        ${selected ? '<div style="color:#2ecc71;font-size:11px;margin-top:4px;">Selected</div>' : ''}
        ${unlocked && !selected ? '<div style="color:#3498db;font-size:11px;margin-top:4px;">Click to select</div>' : ''}
        ${!unlocked && canBuy ? '<button style="margin-top:4px;padding:2px 8px;background:#27ae60;border:none;color:#fff;border-radius:4px;cursor:pointer;font-size:11px;">Buy</button>' : ''}
      `;

      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && canBuy) {
          this.onShopBuyChar?.(char.id);
        } else if (unlocked) {
          this.onCharacterSelected?.(char.id);
        }
      });

      grid.appendChild(card);
    });
  }

  /** Show shop overlay */
  showShop(shop) {
    this.hideAll();
    this.shopOverlay?.classList.remove('hidden');
    document.getElementById('shop-coins').textContent = `Coins: ${shop.progression.coins}`;

    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    ITEMS.forEach((item) => {
      const currentLevel = shop.getUpgradeLevel(item.id);
      const maxed = currentLevel >= item.levels.length;
      const nextCost = shop.getNextUpgradeCost(item.id);
      const canAfford = nextCost !== null && shop.progression.coins >= nextCost;

      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.description}</div>
        <div>Level: ${currentLevel}/${item.levels.length}</div>
        ${maxed
          ? '<div style="color:#2ecc71;">MAX</div>'
          : `<div class="item-cost">Cost: ${nextCost} coins</div>
             <button ${canAfford ? '' : 'disabled'}>Upgrade</button>`
        }
      `;

      if (!maxed) {
        const btn = div.querySelector('button');
        btn?.addEventListener('click', () => this.onShopBuy?.(item.id));
      }

      grid.appendChild(div);
    });
  }

  /** Show pause overlay */
  showPause() {
    this.pauseOverlay?.classList.remove('hidden');
  }

  hidePause() {
    this.pauseOverlay?.classList.add('hidden');
  }

  /** Show game over overlay */
  showGameOver(score, coinsCollected, wave) {
    this.hideAll();
    this.gameoverOverlay?.classList.remove('hidden');
    document.getElementById('gameover-stats').innerHTML = `
      Score: ${score}<br>
      Coins earned: ${coinsCollected}<br>
      Waves survived: ${wave}
    `;
  }

  /** Show level complete overlay */
  showLevelComplete(score, coinsCollected, wave, levelName) {
    this.hideAll();
    this.levelCompleteOverlay?.classList.remove('hidden');
    document.getElementById('levelcomplete-stats').innerHTML = `
      ${levelName} complete!<br>
      Score: ${score}<br>
      Coins earned: ${coinsCollected}<br>
      Total waves: ${wave}
    `;
  }

  /** Update HUD during gameplay */
  updateHUD(player, score, coinsCollected, wave) {
    if (this.playerNameEl) this.playerNameEl.textContent = player.name;
    if (this.healthBar) {
      this.healthBar.style.width = (player.health / player.maxHealth * 100) + '%';
    }
    if (this.healthText) {
      this.healthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;
    }
    if (this.coinDisplay) this.coinDisplay.textContent = `Coins: ${coinsCollected}`;
    if (this.scoreDisplay) this.scoreDisplay.textContent = `Score: ${score}`;
    if (this.waveDisplay) this.waveDisplay.textContent = `Wave: ${wave}`;
  }

  /** Show gameplay UI (hide menu) */
  startGame() {
    this.hideAll();
  }
}

export default UIManager;
