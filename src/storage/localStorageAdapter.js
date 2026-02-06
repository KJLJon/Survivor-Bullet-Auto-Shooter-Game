/**
 * LocalStorageAdapter - localStorage-backed implementation of StorageAdapter.
 * All methods return Promises for interface compatibility with future remote adapters.
 */

import { StorageAdapter } from './storageAdapter.js';

const PREFIX = 'sbh_';

export class LocalStorageAdapter extends StorageAdapter {
  constructor(prefix = PREFIX) {
    super();
    this.prefix = prefix;
  }

  _key(key) {
    return this.prefix + key;
  }

  async get(key) {
    try {
      const raw = localStorage.getItem(this._key(key));
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async set(key, value) {
    localStorage.setItem(this._key(key), JSON.stringify(value));
  }

  async remove(key) {
    localStorage.removeItem(this._key(key));
  }

  async clear() {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }

  async keys() {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        result.push(k.slice(this.prefix.length));
      }
    }
    return result;
  }
}

export default LocalStorageAdapter;
