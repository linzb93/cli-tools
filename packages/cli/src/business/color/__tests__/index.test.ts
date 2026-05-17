import { describe, it, expect } from 'vitest';
import { getTranslatedColor, sassLighten, sassDarken } from '..';

describe('颜色模块', () => {
    describe('getTranslatedColor', () => {
        it('应该将十六进制颜色转换为RGB', () => {
            expect(getTranslatedColor('#fff')).toBe('255, 255, 255');
            expect(getTranslatedColor('#ff0000')).toBe('255, 0, 0');
            expect(getTranslatedColor('#00ff00')).toBe('0, 255, 0');
            expect(getTranslatedColor('#0000ff')).toBe('0, 0, 255');
        });

        it('应该将RGB颜色转换为十六进制', () => {
            expect(getTranslatedColor('255, 255, 255')).toBe('#FFFFFF');
            expect(getTranslatedColor('255, 0, 0')).toBe('#FF0000');
            expect(getTranslatedColor('0, 255, 0')).toBe('#00FF00');
            expect(getTranslatedColor('0, 0, 255')).toBe('#0000FF');
        });

        it('应该处理带空格的RGB值', () => {
            expect(getTranslatedColor('255,  0,  0')).toBe('#FF0000');
            expect(getTranslatedColor('  255, 0, 0  ')).toBe('#FF0000');
        });

        it('应该处理没有#前缀的十六进制颜色', () => {
            expect(getTranslatedColor('ff0000')).toBe('255, 0, 0');
            expect(getTranslatedColor('00ff00')).toBe('0, 255, 0');
        });

        it('应该处理边界情况', () => {
            // 测试3位十六进制
            expect(getTranslatedColor('#abc')).toBe('170, 187, 204');
            expect(getTranslatedColor('abc')).toBe('170, 187, 204');
        });
    });

    describe('sassLighten', () => {
        it('应该正确提亮黄色', () => {
            // #ff0 = HSL(60,100%,50%), L+20% = 70% -> #ffff66
            expect(sassLighten('#ff0', '20')).toBe('#FFFF66');
            expect(sassLighten('#ff0', '20%')).toBe('#FFFF66');
        });

        it('应该支持不带百分号的数字', () => {
            // #ff0 = HSL(60,100%,50%), L+10% = 60% -> HSL(60,100%,60%) = RGB(255,255,51) = #FFFF33
            expect(sassLighten('#ff0', '10')).toBe('#FFFF33');
        });

        it('应该处理黑色', () => {
            // #000 = HSL(0,0%,0%), L+50% = 50% -> #808080
            expect(sassLighten('#000', '50')).toBe('#808080');
        });

        it('应该处理白色', () => {
            // #fff 已经是最亮的
            expect(sassLighten('#fff', '20')).toBe('#FFFFFF');
        });
    });

    describe('sassDarken', () => {
        it('应该正确变暗黄色', () => {
            // #ff0 = HSL(60,100%,50%), L-20% = 30% -> #999900
            expect(sassDarken('#ff0', '20')).toBe('#999900');
            expect(sassDarken('#ff0', '20%')).toBe('#999900');
        });

        it('应该支持不带百分号的数字', () => {
            // delta=10 -> L = 40%
            expect(sassDarken('#ff0', '10')).toBe('#CCCC00');
        });

        it('应该处理黑色', () => {
            // #000 已经是最暗的
            expect(sassDarken('#000', '50')).toBe('#000000');
        });

        it('应该处理白色', () => {
            // #fff = HSL(0,0%,100%), L-20% = 80% -> #CCCCCC
            expect(sassDarken('#fff', '20')).toBe('#CCCCCC');
        });
    });
});
