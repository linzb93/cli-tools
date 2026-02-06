/**
 * 翻译模块测试
 * 测试工厂模式和翻译器功能
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translateService, translateByAI, Options } from '../index';
import { getTranslator, createDefaultTranslators, TranslatorType, getAvailableTypes } from '../core/Factory';
import { youdaoTranslator } from '../implementations/YoudaoTranslator';
import { aiTranslator } from '../implementations/AiTranslator';
import { getHtml } from '../../../utils/http/spider';
import spinner from '../../../utils/spinner';
import { logger } from '../../../utils/logger';

// Mock dependencies
vi.mock('../../../utils/http/spider', () => ({
    getHtml: vi.fn(),
}));

vi.mock('../../../utils/spinner', () => ({
    default: {
        start: vi.fn(),
        text: '',
        succeed: vi.fn(),
        stop: vi.fn(),
        isSpinning: false,
    },
}));

vi.mock('../../../utils/logger', () => ({
    logger: {
        box: vi.fn(),
    },
}));

vi.mock('../../ai/common/implementation/index', () => ({
    useAI: async (messages: any[]): Promise<string> => {
        return JSON.stringify({
            items: [
                { type: 'n', content: 'test' },
                { type: 'v', content: 'testing' },
            ],
        });
    },
    useAIStream: vi.fn(),
}));

describe('翻译模块测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Factory 工厂测试', () => {
        it('应该获取有道翻译器', () => {
            const translator = getTranslator(TranslatorType.YOUDAO);
            expect(translator).toBe(youdaoTranslator);
            expect(translator.name).toBe('有道词典');
        });

        it('应该获取AI翻译器', () => {
            const translator = getTranslator(TranslatorType.AI);
            expect(translator).toBe(aiTranslator);
            expect(translator.name).toBe('AI翻译');
        });

        it('应该抛出错误当传入不支持的翻译器类型', () => {
            expect(() => {
                getTranslator('unsupported' as TranslatorType);
            }).toThrow('不支持的翻译器类型: unsupported');
        });

        it('应该获取所有可用的翻译器类型', () => {
            const types = getAvailableTypes();
            expect(types).toEqual([TranslatorType.YOUDAO, TranslatorType.AI]);
        });

        it('应该创建默认的翻译器组合（非AI优先）', () => {
            const translators = createDefaultTranslators(false);
            expect(translators).toHaveLength(2);
            expect(translators[0]).toBe(youdaoTranslator);
            expect(translators[1]).toBe(aiTranslator);
        });

        it('应该创建默认的翻译器组合（AI优先）', () => {
            const translators = createDefaultTranslators(true);
            expect(translators).toHaveLength(2);
            expect(translators[0]).toBe(aiTranslator);
            expect(translators[1]).toBe(youdaoTranslator);
        });
    });

    describe('AiTranslator AI翻译器测试', () => {
        it('应该正确翻译文本', async () => {
            const result = await aiTranslator.translate('test');

            expect(result).toEqual([
                { type: 'n', content: 'test' },
                { type: 'v', content: 'testing' },
            ]);
            expect(spinner.start).toHaveBeenCalled();
            expect(spinner.text).toBe('使用AI翻译中...');
        });

        it('应该处理 JSON 解析错误', async () => {
            // Mock AI implementation to return invalid JSON
            vi.doMock('../../ai/common/implementation/index', () => ({
                useAI: async () => 'invalid json',
            }));

            // Re-import to apply mock
            const { aiTranslator: reimportedAiTranslator } = await import('../implementations/AiTranslator');
            const result = await reimportedAiTranslator.translate('test');

            expect(result).toEqual([]);
        });
    });

    describe('YoudaoTranslator 有道翻译器测试', () => {
        it('应该正确解析有道词典 HTML', async () => {
            const mockCheerio = {
                '.trans-container': () => ({
                    first: () => ({
                        children: (selector: string) => {
                            if (selector === 'ul') {
                                return {
                                    children: () => [
                                        {
                                            text: () => 'n. test',
                                        },
                                        {
                                            text: () => 'v. testing',
                                        },
                                    ],
                                };
                            }
                            return { children: () => [] };
                        },
                    }),
                }),
            };

            (getHtml as any).mockResolvedValue(mockCheerio);

            const result = await youdaoTranslator.translate('test');

            expect(result).toEqual([
                { type: 'n', content: 'test' },
                { type: 'v', content: 'testing' },
            ]);
            expect(spinner.start).toHaveBeenCalled();
            expect(spinner.text).toBe('使用有道词典翻译中...');
        });

        it('应该处理没有找到翻译结果的情况', async () => {
            const mockCheerio = {
                '.trans-container': () => ({
                    first: () => ({
                        children: () => ({
                            children: () => [],
                        }),
                    }),
                }),
            };

            (getHtml as any).mockResolvedValue(mockCheerio);

            await expect(youdaoTranslator.translate('test')).rejects.toThrow('没有找到翻译结果');
        });
    });

    describe('translateService 翻译服务测试', () => {
        it('应该优先使用有道翻译器（默认模式）', async () => {
            const mockCheerio = {
                '.trans-container': () => ({
                    first: () => ({
                        children: () => ({
                            children: () => [
                                {
                                    text: () => 'n. 测试',
                                },
                            ],
                        }),
                    }),
                }),
            };
            (getHtml as any).mockResolvedValue(mockCheerio);

            await translateService('test', { ai: false });

            expect(spinner.succeed).toHaveBeenCalledWith('翻译完成');
            expect(logger.box).toHaveBeenCalled();
        });

        it('应该优先使用AI翻译器（AI模式）', async () => {
            // Mock AI translation to succeed
            vi.doMock('../../ai/common/implementation/index', () => ({
                useAI: async () =>
                    JSON.stringify({
                        items: [{ type: 'n', content: '测试' }],
                    }),
            }));

            // Re-import module to ensure mock is used
            const { translateService: reimportedService } = await import('../index');
            await reimportedService('test', { ai: true });

            expect(spinner.succeed).toHaveBeenCalledWith('翻译完成');
            expect(logger.box).toHaveBeenCalled();
        });

        it('应该处理所有翻译器都失败的情况', async () => {
            // Mock both translators to fail
            (getHtml as any).mockRejectedValue(new Error('Network error'));

            vi.doMock('../../ai/common/implementation/index', () => ({
                useAI: async () => {
                    throw new Error('AI error');
                },
            }));

            // Re-import module
            const { translateService: reimportedService } = await import('../index');
            await reimportedService('test', { ai: false });

            expect(spinner.succeed).toHaveBeenCalledWith('翻译完成');
            expect(logger.box).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: '英文 => 中文',
                    content: expect.stringContaining('无法翻译，请检查输入内容或网络连接'),
                }),
            );
        });

        it('应该正确处理 translateByAI 方法', async () => {
            vi.doMock('../../ai/common/implementation/index', () => ({
                useAI: async () =>
                    JSON.stringify({
                        items: [{ type: 'n', content: '测试' }],
                    }),
            }));

            const { translateByAI: reimportedTranslateByAI } = await import('../index');
            const result = await reimportedTranslateByAI('test');

            expect(result).toBe('测试');
            expect(spinner.succeed).toHaveBeenCalledWith('翻译完成');
        });

        it('应该处理 translateByAI 失败的情况', async () => {
            vi.doMock('../../ai/common/implementation/index', () => ({
                useAI: async () => {
                    throw new Error('AI error');
                },
            }));

            const { translateByAI: reimportedTranslateByAI } = await import('../index');
            const result = await reimportedTranslateByAI('test');

            expect(result).toBe('');
            expect(spinner.succeed).toHaveBeenCalledWith('翻译完成');
        });
    });
});
