import { describe, it, expect, vi } from 'vitest';
import { splitByLine, isURL, objectToCmdOptions, defaultBrowserHeaders, emptyWritableStream } from '../helper';

describe('splitByLine', () => {
    it('应该正确分割Unix换行符', () => {
        const content = 'line1\nline2\nline3';
        const result = splitByLine(content);
        expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('应该正确分割Windows换行符', () => {
        const content = 'line1\r\nline2\r\nline3';
        const result = splitByLine(content);
        expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('应该正确处理空字符串', () => {
        const result = splitByLine('');
        expect(result).toEqual([]);
    });

    it('应该正确处理单行文本', () => {
        const result = splitByLine('single line');
        expect(result).toEqual(['single line']);
    });

    it('应该正确处理混合换行符', () => {
        const content = 'line1\nline2\r\nline3';
        const result = splitByLine(content);
        expect(result).toEqual(['line1\nline2', 'line3']);
    });
});

describe('isURL', () => {
    it('应该正确识别HTTP URL', () => {
        expect(isURL('http://example.com')).toBe(true);
        expect(isURL('http://www.example.com')).toBe(true);
    });

    it('应该正确识别HTTPS URL', () => {
        expect(isURL('https://example.com')).toBe(true);
        expect(isURL('https://www.example.com')).toBe(true);
    });

    it('应该正确识别带路径的URL', () => {
        expect(isURL('https://example.com/path/to/resource')).toBe(true);
        expect(isURL('http://example.com/api/v1/users')).toBe(true);
    });

    it('应该正确识别带查询参数的URL', () => {
        expect(isURL('https://example.com/search?q=test')).toBe(true);
        expect(isURL('http://example.com/page?id=123&name=test')).toBe(true);
    });

    it('应该正确拒绝非URL字符串', () => {
        expect(isURL('not a url')).toBe(false);
        expect(isURL('www.example.com')).toBe(false);
        expect(isURL('example.com')).toBe(false);
        expect(isURL('ftp://example.com')).toBe(false);
        expect(isURL('')).toBe(false);
    });
});

describe('objectToCmdOptions', () => {
    it('应该正确处理布尔值为true的选项', () => {
        const obj = { verbose: true, help: true };
        const result = objectToCmdOptions(obj);
        expect(result).toEqual(['--verbose', '--help']);
    });

    it('应该正确处理字符串值选项', () => {
        const obj = { name: 'test', port: '3000' };
        const result = objectToCmdOptions(obj);
        expect(result).toEqual(['--name=test', '--port=3000']);
    });

    it('应该正确处理数字值选项', () => {
        const obj = { count: 5, timeout: 30 };
        const result = objectToCmdOptions(obj);
        expect(result).toEqual(['--count=5', '--timeout=30']);
    });

    it('应该正确处理布尔值为false的选项', () => {
        const obj = { verbose: false, debug: false };
        const result = objectToCmdOptions(obj);
        expect(result).toEqual([]);
    });

    it('应该正确处理undefined和null值', () => {
        const obj = { undefined: undefined, null: null, value: 'test' };
        const result = objectToCmdOptions(obj);
        expect(result).toEqual(['--value=test']);
    });

    it('应该正确处理混合类型的选项', () => {
        const obj = {
            verbose: true,
            name: 'test',
            port: 3000,
            silent: false,
            config: undefined,
            output: null,
        };
        const result = objectToCmdOptions(obj);
        expect(result).toEqual(['--verbose', '--name=test', '--port=3000']);
    });

    it('应该正确处理空对象', () => {
        const obj = {};
        const result = objectToCmdOptions(obj);
        expect(result).toEqual([]);
    });
});

describe('defaultBrowserHeaders', () => {
    it('应该包含所有必需的请求头', () => {
        expect(defaultBrowserHeaders).toHaveProperty('User-Agent');
        expect(defaultBrowserHeaders).toHaveProperty('Accept');
        expect(defaultBrowserHeaders).toHaveProperty('Accept-Language');
        expect(defaultBrowserHeaders).toHaveProperty('Cache-Control');
        expect(defaultBrowserHeaders).toHaveProperty('Connection');
    });

    it('应该具有正确的User-Agent格式', () => {
        expect(defaultBrowserHeaders['User-Agent']).toMatch(/^Mozilla\/5\.0/);
        expect(defaultBrowserHeaders['User-Agent']).toContain('AppleWebKit');
        expect(defaultBrowserHeaders['User-Agent']).toContain('Chrome');
        expect(defaultBrowserHeaders['User-Agent']).toContain('Safari');
    });

    it('应该具有正确的Accept头', () => {
        expect(defaultBrowserHeaders['Accept']).toContain('text/html');
        expect(defaultBrowserHeaders['Accept']).toContain('application/xhtml+xml');
        expect(defaultBrowserHeaders['Accept']).toContain('application/xml');
    });

    it('应该具有正确的Accept-Language头', () => {
        expect(defaultBrowserHeaders['Accept-Language']).toContain('zh-CN');
        expect(defaultBrowserHeaders['Accept-Language']).toContain('zh');
        expect(defaultBrowserHeaders['Accept-Language']).toContain('en');
    });

    it('应该具有正确的Cache-Control头', () => {
        expect(defaultBrowserHeaders['Cache-Control']).toBe('no-cache');
    });

    it('应该具有正确的Connection头', () => {
        expect(defaultBrowserHeaders['Connection']).toBe('keep-alive');
    });
});

describe('emptyWritableStream', () => {
    it('应该成功创建可写流', () => {
        expect(emptyWritableStream).toBeDefined();
        expect(typeof emptyWritableStream.write).toBe('function');
    });

    // it('应该能够写入数据而不抛出错误', (done) => {
    //     const writeCallback = vi.fn();

    //     emptyWritableStream.write('test data', 'utf8', (error) => {
    //         writeCallback(error);
    //         expect(writeCallback).toHaveBeenCalledWith(undefined);
    //         done();
    //     });
    // });

    // it('应该能够处理多次写入', (done) => {
    //     let callbackCount = 0;
    //     const totalCallbacks = 3;

    //     const checkDone = () => {
    //         callbackCount++;
    //         if (callbackCount === totalCallbacks) {
    //             done();
    //         }
    //     };

    //     emptyWritableStream.write('data1', 'utf8', checkDone);
    //     emptyWritableStream.write('data2', 'utf8', checkDone);
    //     emptyWritableStream.write('data3', 'utf8', checkDone);
    // });
});
