/**
 * Tests for LocalStorageAdapter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from '../src/storage/localStorageAdapter.js';

describe('LocalStorageAdapter', () => {
  let adapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter('test_');
  });

  it('should return null for missing keys', async () => {
    const result = await adapter.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should set and get a value', async () => {
    await adapter.set('key1', { foo: 'bar', num: 42 });
    const result = await adapter.get('key1');
    expect(result).toEqual({ foo: 'bar', num: 42 });
  });

  it('should set and get primitive values', async () => {
    await adapter.set('str', 'hello');
    await adapter.set('num', 123);
    await adapter.set('bool', true);
    await adapter.set('arr', [1, 2, 3]);

    expect(await adapter.get('str')).toBe('hello');
    expect(await adapter.get('num')).toBe(123);
    expect(await adapter.get('bool')).toBe(true);
    expect(await adapter.get('arr')).toEqual([1, 2, 3]);
  });

  it('should overwrite existing values', async () => {
    await adapter.set('key', 'first');
    await adapter.set('key', 'second');
    expect(await adapter.get('key')).toBe('second');
  });

  it('should remove a key', async () => {
    await adapter.set('key', 'value');
    await adapter.remove('key');
    expect(await adapter.get('key')).toBeNull();
  });

  it('should clear all prefixed keys', async () => {
    await adapter.set('a', 1);
    await adapter.set('b', 2);
    await adapter.set('c', 3);

    // Add non-prefixed key
    localStorage.setItem('other_key', 'keep');

    await adapter.clear();

    expect(await adapter.get('a')).toBeNull();
    expect(await adapter.get('b')).toBeNull();
    expect(await adapter.get('c')).toBeNull();
    expect(localStorage.getItem('other_key')).toBe('keep');
  });

  it('should return all keys', async () => {
    await adapter.set('alpha', 1);
    await adapter.set('beta', 2);
    await adapter.set('gamma', 3);

    const keys = await adapter.keys();
    expect(keys).toHaveLength(3);
    expect(keys.sort()).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('should handle empty storage', async () => {
    const keys = await adapter.keys();
    expect(keys).toHaveLength(0);
  });

  it('should use prefix isolation', async () => {
    const adapter2 = new LocalStorageAdapter('other_');
    await adapter.set('shared', 'from-test');
    await adapter2.set('shared', 'from-other');

    expect(await adapter.get('shared')).toBe('from-test');
    expect(await adapter2.get('shared')).toBe('from-other');
  });

  it('should handle corrupted JSON gracefully', async () => {
    localStorage.setItem('test_broken', '{invalid json');
    const result = await adapter.get('broken');
    expect(result).toBeNull();
  });
});
