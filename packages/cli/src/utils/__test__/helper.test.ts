import { describe, it, expect } from 'vitest';
import { splitByLine, emptyWritableStream } from '../stream';
import { isUrl } from '../web';
import { objectToCmdOptions } from '../command';

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

describe('isUrl', () => {
    it('应该正确识别HTTP URL', () => {
        expect(isUrl('http://example.com')).toBe(true);
        expect(isUrl('http://www.example.com')).toBe(true);
    });

    it('应该正确识别HTTPS URL', () => {
        expect(isUrl('https://example.com')).toBe(true);
        expect(isUrl('https://www.example.com')).toBe(true);
    });

    it('应该正确识别带路径的URL', () => {
        expect(isUrl('https://example.com/path/to/resource')).toBe(true);
        expect(isUrl('http://example.com/api/v1/users')).toBe(true);
    });

    it('应该正确识别带查询参数的URL', () => {
        expect(isUrl('https://example.com/search?q=test')).toBe(true);
        expect(isUrl('http://example.com/page?id=123&name=test')).toBe(true);
    });

    it('应该正确拒绝非URL字符串', () => {
        expect(isUrl('not a url')).toBe(false);
        expect(isUrl('www.example.com')).toBe(false);
        expect(isUrl('example.com')).toBe(false);
        expect(isUrl('ftp://example.com')).toBe(false);
        expect(isUrl('')).toBe(false);
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
