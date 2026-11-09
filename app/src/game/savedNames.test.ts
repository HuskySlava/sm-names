import { describe, expect, it } from 'vitest';
import { MAX_SAVED, addIfRoom, replaceName } from './savedNames';

const full = Array.from({ length: MAX_SAVED }, (_, i) => `name${i}`);

describe('saved names', () => {
  it('adds winners until the list is full, without duplicates', () => {
    expect(addIfRoom([], 'דוד')).toEqual(['דוד']);
    expect(addIfRoom(['דוד'], 'דוד')).toEqual(['דוד']);
    expect(addIfRoom(full, 'new')).toBe(full);
  });

  it('replaces a saved name in the same place', () => {
    expect(replaceName(full, 'name3', 'new')[3]).toBe('new');
    expect(replaceName(full, 'name3', 'new')).toHaveLength(MAX_SAVED);
    expect(replaceName(full, 'missing', 'new')).toBe(full);
    expect(replaceName(full, 'name3', 'name4')).toBe(full);
  });
});
