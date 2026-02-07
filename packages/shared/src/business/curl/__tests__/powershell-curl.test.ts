import { describe, it, expect } from 'vitest';
import { createPowerShellCurlParser } from '../implementations/PowerShellCurlParser';

describe('PowerShellCurlParser', () => {
    const parser = createPowerShellCurlParser({});

    it('should parse standard URL', () => {
        const line = 'Invoke-WebRequest -Uri "https://example.com"';
        expect(parser.parseUrl(line)).toBe('https://example.com');
    });

    it('should parse body with escaped quotes', () => {
        const lines = ['-ContentType "application/json" `', '-Body "{`"pageIndex`":1,`"pageSize`":5}"'];
        const data = parser.parseData(lines, 'application/json');
        expect(data).toBe('{"pageIndex":1,"pageSize":5}');
    });

    it('should parse method', () => {
        const lines = ['-Method "POST" `'];
        expect(parser.parseMethod(lines)).toBe('post');
    });

    it('should default method to get if not found', () => {
        const lines = ['Invoke-WebRequest ...'];
        expect(parser.parseMethod(lines)).toBe('get');
    });
});
