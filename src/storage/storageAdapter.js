/**
 * StorageAdapter interface.
 * All methods are async so implementations can be swapped
 * for remote API adapters without changing game logic.
 *
 * Methods:
 *  - get(key): returns parsed JSON or null
 *  - set(key, value): stores JSON-serializable value
 *  - remove(key): removes a key
 *  - clear(): removes all keys
 *  - keys(): returns array of keys
 */

export class StorageAdapter {
  async get(key) {
    throw new Error('StorageAdapter.get() not implemented');
  }

  async set(key, value) {
    throw new Error('StorageAdapter.set() not implemented');
  }

  async remove(key) {
    throw new Error('StorageAdapter.remove() not implemented');
  }

  async clear() {
    throw new Error('StorageAdapter.clear() not implemented');
  }

  async keys() {
    throw new Error('StorageAdapter.keys() not implemented');
  }
}

export default StorageAdapter;
