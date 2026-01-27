import { describe, it, expect } from 'vitest';
import Color from '..';

describe('颜色模块', () => {
    describe('getTranslatedColor', () => {
        it('应该将十六进制颜色转换为RGB', () => {
            const colorInstance = new Color();
            expect(colorInstance.getTranslatedColor('#fff')).toBe('255, 255, 255');
            expect(colorInstance.getTranslatedColor('#ff0000')).toBe('255, 0, 0');
            expect(colorInstance.getTranslatedColor('#00ff00')).toBe('0, 255, 0');
            expect(colorInstance.getTranslatedColor('#0000ff')).toBe('0, 0, 255');
        });

        it('应该将RGB颜色转换为十六进制', () => {
            const colorInstance = new Color();
            expect(colorInstance.getTranslatedColor('255, 255, 255')).toBe('#FFFFFF');
            expect(colorInstance.getTranslatedColor('255, 0, 0')).toBe('#FF0000');
            expect(colorInstance.getTranslatedColor('0, 255, 0')).toBe('#00FF00');
            expect(colorInstance.getTranslatedColor('0, 0, 255')).toBe('#0000FF');
        });

        it('应该处理带空格的RGB值', () => {
            const colorInstance = new Color();
            expect(colorInstance.getTranslatedColor('255,  0,  0')).toBe('#FF0000');
            expect(colorInstance.getTranslatedColor('  255, 0, 0  ')).toBe('#FF0000');
        });

        it('应该处理没有#前缀的十六进制颜色', () => {
            const colorInstance = new Color();
            expect(colorInstance.getTranslatedColor('ff0000')).toBe('255, 0, 0');
            expect(colorInstance.getTranslatedColor('00ff00')).toBe('0, 255, 0');
        });

        it('应该处理边界情况', () => {
            const colorInstance = new Color();
            // 测试3位十六进制
            expect(colorInstance.getTranslatedColor('#abc')).toBe('170, 187, 204');
            expect(colorInstance.getTranslatedColor('abc')).toBe('170, 187, 204');
        });
    });
});
