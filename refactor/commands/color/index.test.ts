import { describe, it, expect } from 'vitest';
import color from '.';

describe('color', () => {
  it('rgb to hex', () => {
    expect(color('#fff', { get: false })).toBe('255, 255, 255');
  });
  it('hex to rgb', () => {
    expect(color('33, 33, 33', { get: false })).toBe('#212121');
  });
});
