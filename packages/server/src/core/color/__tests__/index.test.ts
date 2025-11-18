import { describe, it, expect } from 'vitest';
import Color from '..';

describe('color', () => {
    it('rgb to hex', () => {
        expect(new Color().getTranslatedColor('#fff')).toBe('255, 255, 255');
    });
    it('hex to rgb', () => {
        expect(new Color().getTranslatedColor('33, 33, 33')).toBe('#212121');
    });
});
