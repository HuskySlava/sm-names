import { describe, expect, it } from 'vitest';
import en from './en.json';
import he from './he.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('translations', () => {
  it('Hebrew and English have the same texts', () => {
    expect(keys(he).sort()).toEqual(keys(en).sort());
  });

  it('no text is empty', () => {
    const values = (obj: object): string[] =>
      Object.values(obj).flatMap((v) => (typeof v === 'object' ? values(v) : [v]));
    expect([...values(en), ...values(he)].every((v) => v.trim().length > 0)).toBe(true);
  });
});
