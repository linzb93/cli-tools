import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CookieCommand from '../index';
import type { Options } from '../index';

vi.mock('../curl', () => {
    return {
        default: class {
            isCurl(data: string) {
                return data.includes('curl');
            }
            getCookieFromCurl(data: string) {
                return 'curl_cookie=value';
            }
        }
    };
});

describe('Cookie 解析模块', () => {
    let cookieCommand: CookieCommand;
    let consoleLogSpy: any;
    let consoleSuccessSpy: any;

    beforeEach(() => {
        cookieCommand = new CookieCommand();
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleSuccessSpy = vi.spyOn((cookieCommand as any).logger, 'success').mockImplementation(() => {});
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('parseCookie 方法', () => {
        it('应该解析基本的 Cookie 字符串', () => {
            const cookieString = 'name=value; session=abc123; token=xyz789';
            const result = cookieCommand.parseCookie(cookieString);
            
            expect(result).toEqual({
                name: 'value',
                session: 'abc123',
                token: 'xyz789'
            });
        });

        it('应该处理带空格的 Cookie 字符串', () => {
            const cookieString = ' name = value ; session = abc123 ; token = xyz789 ';
            const result = cookieCommand.parseCookie(cookieString);
            
            expect(result).toEqual({
                name: 'value',
                session: 'abc123',
                token: 'xyz789'
            });
        });

        it('应该处理空值和特殊字符', () => {
            const cookieString = 'empty=; special=value-123_test; unicode=测试值';
            const result = cookieCommand.parseCookie(cookieString);
            
            expect(result).toEqual({
                empty: '',
                special: 'value-123_test',
                unicode: '测试值'
            });
        });

        it('应该处理单个 Cookie', () => {
            const cookieString = 'single=value';
            const result = cookieCommand.parseCookie(cookieString);
            
            expect(result).toEqual({
                single: 'value'
            });
        });

        it('应该处理空字符串', () => {
            const cookieString = '';
            const result = cookieCommand.parseCookie(cookieString);
            
            expect(result).toEqual({});
        });

        it('应该处理没有值的 Cookie', () => {
            const cookieString = 'name=value; session; token=xyz789';
            const result = cookieCommand.parseCookie(cookieString);
            
            expect(result).toEqual({
                name: 'value',
                session: undefined,
                token: 'xyz789'
            });
        });
    });

    describe('getValue 方法 (私有方法)', () => {
        it('应该将数组转换为逗号分隔的字符串', () => {
            const testArray = ['key1', 'key2', 'key3'];
            const result = (cookieCommand as any)['getValue'](testArray);
            
            expect(result).toBe('key1,key2,key3');
        });

        it('应该将对象格式化为 JSON 字符串', () => {
            const testObject = { name: 'value', session: 'abc123' };
            const result = (cookieCommand as any)['getValue'](testObject);
            
            expect(result).toContain('name');
            expect(result).toContain('value');
            expect(result).toContain('session');
            expect(result).toContain('abc123');
        });

        it('应该处理空数组', () => {
            const testArray: string[] = [];
            const result = (cookieCommand as any)['getValue'](testArray);
            
            expect(result).toBe('');
        });

        it('应该处理空对象', () => {
            const testObject = {};
            const result = (cookieCommand as any)['getValue'](testObject);
            
            expect(result).toBe('{}');
        });
    });

    describe('main 方法', () => {
        it('应该使用输入数据并返回 JSON 格式', async () => {
            const cookieString = 'name=value; session=abc123';
            const options: Options = { type: 'json' };
            
            await cookieCommand.main(cookieString, options);
            
            expect(consoleLogSpy).toHaveBeenCalledWith({
                name: 'value',
                session: 'abc123'
            });
        });

        it('应该返回键名数组格式', async () => {
            const cookieString = 'name=value; session=abc123; token=xyz789';
            const options: Options = { type: 'key' };
            
            await cookieCommand.main(cookieString, options);
            
            expect(consoleLogSpy).toHaveBeenCalledWith(['name', 'session', 'token']);
        });

        it('应该检测并处理 curl 命令', async () => {
            const curlCommand = 'curl -H "Cookie: curl_session=abc123; curl_token=xyz789" https://example.com';
            const options: Options = { type: 'json' };
            
            await cookieCommand.main(curlCommand, options);
            
            expect(consoleLogSpy).toHaveBeenCalledWith({
                curl_session: 'abc123',
                curl_token: 'xyz789'
            });
        });

        it('应该处理复杂的 Cookie 值', async () => {
            const complexCookie = 'user=%7B%22id%22%3A123%2C%22name%22%3A%22test%22%7D; session=abc123.xyz789; path=/';
            const options: Options = { type: 'json' };
            
            await cookieCommand.main(complexCookie, options);
            
            expect(consoleLogSpy).toHaveBeenCalledWith({
                user: '%7B%22id%22%3A123%2C%22name%22%3A%22test%22%7D',
                session: 'abc123.xyz789',
                path: '/'
            });
        });

        it('应该处理重复的 Cookie 键名', async () => {
            const duplicateCookie = 'key=first; key=second; other=value';
            const options: Options = { type: 'json' };
            
            await cookieCommand.main(duplicateCookie, options);
            
            expect(consoleLogSpy).toHaveBeenCalledWith({
                key: 'second',
                other: 'value'
            });
        });
    });
});