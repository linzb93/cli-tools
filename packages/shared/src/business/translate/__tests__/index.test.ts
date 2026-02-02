/**
 * 翻译模块测试
 * 测试工厂模式和翻译器功能
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranslateService, Options } from '../index';
import { TranslatorFactory, TranslatorType } from '../core/Factory';
import { BaseTranslator, TranslateResultItem } from '../core/BaseTranslator';
import { YoudaoTranslator } from '../implementations/YoudaoTranslator';
import { AiTranslator } from '../implementations/AiTranslator';
import { getHtml } from '../../../utils/http/spider';

// Mock dependencies
vi.mock('../../../utils/http/spider', () => ({
    getHtml: vi.fn(),
}));

vi.mock('../../ai/common/implementation/index', () => ({
    AiImplementation: class {
        async use(messages: any[]): Promise<string> {
            return JSON.stringify({
                items: [
                    { type: 'n', content: 'test' },
                    { type: 'v', content: 'testing' },
                ],
            });
        }
    },
}));

describe('翻译模块工厂模式测试', () => {
    let translateService: TranslateService;
    let mockSpinner: any;
    let mockLogger: any;

    beforeEach(() => {
        // Create mock spinner
        mockSpinner = {
            start: vi.fn(),
            text: '',
            succeed: vi.fn(),
        };

        // Create mock logger
        mockLogger = {
            box: vi.fn(),
        };

        // Create translate service instance
        translateService = new TranslateService();
        // Set up mocks
        (translateService as any).spinner = mockSpinner;
        (translateService as any).logger = mockLogger;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('TranslatorFactory 工厂测试', () => {
        it('应该创建有道翻译器实例', () => {
            const factory = new TranslatorFactory();
            const translator = factory.create(TranslatorType.YOUDAO);

            expect(translator).toBeInstanceOf(YoudaoTranslator);
            expect(translator.name).toBe('有道词典');
        });

        it('应该创建AI翻译器实例', () => {
            const factory = new TranslatorFactory();
            const translator = factory.create(TranslatorType.AI);

            expect(translator).toBeInstanceOf(AiTranslator);
            expect(translator.name).toBe('AI翻译');
        });

        it('应该抛出错误当传入不支持的翻译器类型', () => {
            const factory = new TranslatorFactory();

            expect(() => {
                factory.create('unsupported' as TranslatorType);
            }).toThrow('不支持的翻译器类型: unsupported');
        });

        it('应该获取所有可用的翻译器类型', () => {
            const types = TranslatorFactory.getAvailableTypes();

            expect(types).toEqual([TranslatorType.YOUDAO, TranslatorType.AI]);
        });

        it('应该创建默认的翻译器组合（非AI优先）', () => {
            const translators = TranslatorFactory.createDefaultTranslators(false);

            expect(translators).toHaveLength(2);
            expect(translators[0]).toBeInstanceOf(YoudaoTranslator);
            expect(translators[1]).toBeInstanceOf(AiTranslator);
        });

        it('应该创建默认的翻译器组合（AI优先）', () => {
            const translators = TranslatorFactory.createDefaultTranslators(true);

            expect(translators).toHaveLength(2);
            expect(translators[0]).toBeInstanceOf(AiTranslator);
            expect(translators[1]).toBeInstanceOf(YoudaoTranslator);
        });
    });

    describe('BaseTranslator 基础翻译器测试', () => {
        it('应该正确设置 spinner', () => {
            const translator = new AiTranslator();
            translator.setSpinner(mockSpinner);
            expect((translator as any).spinner).toBe(mockSpinner);
        });

        it('应该正确判断中英文', () => {
            const translator = new AiTranslator();

            // 中文应该返回 true (中文转英文)
            expect((translator as any).isC2E('你好')).toBe(true);
            expect((translator as any).isC2E('测试')).toBe(true);

            // 英文应该返回 false (英文转中文)
            expect((translator as any).isC2E('hello')).toBe(false);
            expect((translator as any).isC2E('test')).toBe(false);

            // 混合文本应该返回 false
            expect((translator as any).isC2E('hello 世界')).toBe(false);
        });
    });

    describe('AiTranslator AI翻译器测试', () => {
        it('应该正确翻译文本', async () => {
            const aiTranslator = new AiTranslator();
            aiTranslator.setSpinner(mockSpinner);

            const result = await aiTranslator.translate('test');

            expect(result).toEqual([
                { type: 'n', content: 'test' },
                { type: 'v', content: 'testing' },
            ]);
            expect(mockSpinner.start).toHaveBeenCalled();
            expect(mockSpinner.text).toBe('使用AI翻译中...');
        });

        it('应该处理 JSON 解析错误', async () => {
            // Mock AI implementation to return invalid JSON
            const AiImpl = vi.fn().mockImplementation(() => ({
                use: async () => 'invalid json',
            }));

            vi.doMock('../../ai/common/implementation/index', () => ({
                AiImplementation: AiImpl,
            }));

            const aiTranslator = new AiTranslator();
            const result = await aiTranslator.translate('test');

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

            const youdaoTranslator = new YoudaoTranslator();
            youdaoTranslator.setSpinner(mockSpinner);

            const result = await youdaoTranslator.translate('test');

            expect(result).toEqual([
                { type: 'n', content: 'test' },
                { type: 'v', content: 'testing' },
            ]);
            expect(mockSpinner.start).toHaveBeenCalled();
            expect(mockSpinner.text).toBe('使用有道词典翻译中...');
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

            const youdaoTranslator = new YoudaoTranslator();
            youdaoTranslator.setSpinner(mockSpinner);

            await expect(youdaoTranslator.translate('test')).rejects.toThrow('没有找到翻译结果');
        });

        it('应该正确生成有道词典 URL', () => {
            const youdaoTranslator = new YoudaoTranslator();
            youdaoTranslator.getYoudaoHTML('hello world');

            expect(getHtml).toHaveBeenCalledWith('https://youdao.com/w/eng', '/hello%20world');
        });
    });

    describe('TranslateService 翻译服务测试', () => {
        it('应该正确判断中英文并设置 isC2E', async () => {
            // Mock successful translation
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

            await translateService.main('hello', { ai: false });

            // isC2E should be false for English text
            expect((translateService as any).isC2E).toBe(false);
        });

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

            await translateService.main('test', { ai: false });

            expect(mockSpinner.succeed).toHaveBeenCalledWith('翻译完成');
            expect(mockLogger.box).toHaveBeenCalled();
        });

        it('应该优先使用AI翻译器（AI模式）', async () => {
            // Mock AI translation to succeed
            const AiImpl = vi.fn().mockImplementation(() => ({
                use: async () =>
                    JSON.stringify({
                        items: [{ type: 'n', content: '测试' }],
                    }),
            }));

            vi.doMock('../../ai/common/implementation/index', () => ({
                AiImplementation: AiImpl,
            }));

            await translateService.main('test', { ai: true });

            expect(mockSpinner.succeed).toHaveBeenCalledWith('翻译完成');
            expect(mockLogger.box).toHaveBeenCalled();
        });

        it('应该处理所有翻译器都失败的情况', async () => {
            // Mock both translators to fail
            (getHtml as any).mockRejectedValue(new Error('Network error'));

            const AiImpl = vi.fn().mockImplementation(() => ({
                use: async () => {
                    throw new Error('AI error');
                },
            }));

            vi.doMock('../../ai/common/implementation/index', () => ({
                AiImplementation: AiImpl,
            }));

            await translateService.main('test', { ai: false });

            expect(mockSpinner.succeed).toHaveBeenCalledWith('翻译完成');
            expect(mockLogger.box).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: '英文 => 中文',
                    content: expect.stringContaining('无法翻译，请检查输入内容或网络连接'),
                }),
            );
        });

        it('应该正确处理 translateByAI 方法', async () => {
            const AiImpl = vi.fn().mockImplementation(() => ({
                use: async () =>
                    JSON.stringify({
                        items: [{ type: 'n', content: '测试' }],
                    }),
            }));

            vi.doMock('../../ai/common/implementation/index', () => ({
                AiImplementation: AiImpl,
            }));

            const result = await translateService.translateByAI('test');

            expect(result).toBe('测试');
            expect(mockSpinner.succeed).toHaveBeenCalledWith('翻译完成');
        });

        it('应该处理 translateByAI 失败的情况', async () => {
            const AiImpl = vi.fn().mockImplementation(() => ({
                use: async () => {
                    throw new Error('AI error');
                },
            }));

            vi.doMock('../../ai/common/implementation/index', () => ({
                AiImplementation: AiImpl,
            }));

            const result = await translateService.translateByAI('test');

            expect(result).toBe('');
            expect(mockSpinner.succeed).toHaveBeenCalledWith('翻译完成');
        });

        it('应该正确显示翻译结果', () => {
            const result: TranslateResultItem[] = [
                { type: 'n', content: '测试1' },
                { type: 'v', content: '测试2' },
            ];

            (translateService as any).isC2E = true;
            translateService.logTranslateResult('test', '有道词典', result);

            expect(mockLogger.box).toHaveBeenCalledWith({
                title: '中文 => 英文',
                borderColor: 'red',
                content: expect.stringContaining('test') && expect.stringContaining('有道词典'),
            });
        });
    });

    describe('模块导出测试', () => {
        it('应该正确导出所有翻译器类和工厂', async () => {
            const module = await import('../index');

            expect(module.TranslateService).toBeDefined();
            expect(module.TranslatorFactory).toBeDefined();
            expect(module.TranslatorType).toBeDefined();
            expect(module.BaseTranslator).toBeDefined();
            expect(module.YoudaoTranslator).toBeDefined();
            expect(module.AiTranslator).toBeDefined();
            expect(module.TranslateResultItem).toBeDefined();
        });

        it('应该正确导出工厂相关类型', async () => {
            const factoryModule = await import('../core/Factory');

            expect(factoryModule.TranslatorFactory).toBeDefined();
            expect(factoryModule.TranslatorType).toBeDefined();
            expect(factoryModule.TranslatorType.YOUDAO).toBe('youdao');
            expect(factoryModule.TranslatorType.AI).toBe('ai');
        });
    });
});
