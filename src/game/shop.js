/**
 * Shop and upgrade logic.
 * Manages purchases, upgrade levels, and progression tracking.
 */

import ITEMS from '../data/items.js';
import CHARACTERS from '../data/characters.js';
import sfx from '../audio/sfx.js';

export class Shop {
  constructor(storage) {
    this.storage = storage;
    this.progression = null;
  }

  /** Load progression data from storage */
  async load() {
    this.progression = (await this.storage.get('progression')) || {
      coins: 0,
      playCount: 0,
      totalCoinsCollected: 0,
      levelsCompleted: 0,
      highScore: 0,
      levelScores: {},
      unlockedCharacters: ['rookie'],
      selectedCharacter: 'rookie',
      upgradeLevels: {},
      purchasedCharacters: ['rookie'],
    };
    return this.progression;
  }

  /** Save progression */
  async save() {
    await this.storage.set('progression', this.progression);
  }

  /** Add coins from a game run */
  async addCoins(amount) {
    this.progression.coins += amount;
    this.progression.totalCoinsCollected += amount;
    await this.save();
  }

  /** Record a play session */
  async recordPlay(score, levelIndex, completed) {
    this.progression.playCount++;
    if (score > this.progression.highScore) {
      this.progression.highScore = score;
    }
    const levelId = `level${levelIndex + 1}`;
    if (!this.progression.levelScores[levelId] || score > this.progression.levelScores[levelId]) {
      this.progression.levelScores[levelId] = score;
    }
    if (completed) {
      this.progression.levelsCompleted = Math.max(
        this.progression.levelsCompleted,
        levelIndex + 1
      );
    }

    // Check for character unlocks based on progression
    this._checkUnlocks();
    await this.save();
  }

  /** Get current upgrade level for an item */
  getUpgradeLevel(itemId) {
    return this.progression.upgradeLevels[itemId] || 0;
  }

  /** Get the cost for the next upgrade level */
  getNextUpgradeCost(itemId) {
    const item = ITEMS.find((i) => i.id === itemId);
    if (!item) return null;
    const currentLevel = this.getUpgradeLevel(itemId);
    if (currentLevel >= item.levels.length) return null;
    return item.levels[currentLevel].cost;
  }

  /** Purchase an upgrade */
  async buyUpgrade(itemId) {
    const cost = this.getNextUpgradeCost(itemId);
    if (cost === null) return { success: false, reason: 'maxed' };
    if (this.progression.coins < cost) return { success: false, reason: 'insufficient' };

    this.progression.coins -= cost;
    this.progression.upgradeLevels[itemId] = (this.progression.upgradeLevels[itemId] || 0) + 1;
    await this.save();
    sfx.play('shopBuy');
    return { success: true };
  }

  /** Purchase a character */
  async buyCharacter(charId) {
    const char = CHARACTERS.find((c) => c.id === charId);
    if (!char) return { success: false, reason: 'notfound' };
    if (this.progression.purchasedCharacters.includes(charId)) {
      return { success: false, reason: 'owned' };
    }
    const cond = char.unlockCondition;
    if (cond.type === 'coins') {
      if (this.progression.coins < cond.cost) {
        return { success: false, reason: 'insufficient' };
      }
      this.progression.coins -= cond.cost;
    }
    this.progression.purchasedCharacters.push(charId);
    this.progression.unlockedCharacters.push(charId);
    await this.save();
    sfx.play('shopBuy');
    return { success: true };
  }

  /** Select a character */
  async selectCharacter(charId) {
    if (!this.progression.unlockedCharacters.includes(charId)) return false;
    this.progression.selectedCharacter = charId;
    await this.save();
    return true;
  }

  /** Check if a character is unlocked (via purchase or progression) */
  isCharacterUnlocked(charId) {
    return this.progression.unlockedCharacters.includes(charId);
  }

  /** Check if character can be purchased */
  canBuyCharacter(charId) {
    const char = CHARACTERS.find((c) => c.id === charId);
    if (!char) return false;
    if (this.isCharacterUnlocked(charId)) return false;
    const cond = char.unlockCondition;
    if (cond.type === 'default') return false; // Already unlocked
    if (cond.type === 'coins') return this.progression.coins >= cond.cost;
    if (cond.type === 'plays') return this.progression.playCount >= cond.count;
    if (cond.type === 'score') return this.progression.highScore >= cond.threshold;
    if (cond.type === 'levelsCompleted') return this.progression.levelsCompleted >= cond.count;
    return false;
  }

  /** Get all computed upgrade bonuses as a flat object */
  getUpgradeBonuses() {
    const bonuses = {};
    for (const item of ITEMS) {
      const level = this.getUpgradeLevel(item.id);
      if (level > 0) {
        let total = 0;
        for (let i = 0; i < level; i++) {
          total += item.levels[i].delta;
        }
        bonuses[item.stat] = (bonuses[item.stat] || 0) + total;
      }
    }
    return bonuses;
  }

  /** Get selected character definition */
  getSelectedCharacter() {
    return CHARACTERS.find((c) => c.id === this.progression.selectedCharacter) || CHARACTERS[0];
  }

  /** Check and apply progression-based unlocks */
  _checkUnlocks() {
    for (const char of CHARACTERS) {
      if (this.progression.unlockedCharacters.includes(char.id)) continue;
      const cond = char.unlockCondition;
      let unlocked = false;
      if (cond.type === 'plays' && this.progression.playCount >= cond.count) unlocked = true;
      if (cond.type === 'score' && this.progression.highScore >= cond.threshold) unlocked = true;
      if (cond.type === 'levelsCompleted' && this.progression.levelsCompleted >= cond.count) unlocked = true;
      if (unlocked) {
        this.progression.unlockedCharacters.push(char.id);
      }
    }
  }
}

export default Shop;
