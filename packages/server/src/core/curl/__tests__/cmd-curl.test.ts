import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseCurlParser } from '../BaseCurlParser';
import { CmdCurlParser } from '../CmdCurlParser';
import CurlCommand from '../index';
import clipboardy from 'clipboardy';

/**
 * CMD类型curl命令测试用例
 * 测试范围包括：CmdCurlParser、BaseCurlParser基础功能、CurlCommand CMD模式
 */

// 模拟剪贴板模块
vi.mock('clipboardy', () => ({
    default: {
        readSync: vi.fn(),
        writeSync: vi.fn(),
    },
}));

// 模拟prettier模块
vi.mock('prettier', () => ({
    format: vi.fn((code) => code),
}));

// 模拟BaseCommand
vi.mock('../BaseCommand', () => ({
    default: class {
        logger = {
            info: vi.fn(),
            error: vi.fn(),
            success: vi.fn(),
        };
    },
}));

// 测试用的TestCurlParserFactory类
class TestCurlParserFactory {
    static detectCurlMode(curlText: string): 'cmd' | 'bash' {
        // 检查是否包含cmd模式特有的^符号
        if (curlText.includes('^"')) {
            return 'cmd';
        }
        return 'bash';
    }

    static createParser(mode: 'cmd' | 'bash', options: any): BaseCurlParser {
        switch (mode) {
            case 'cmd':
                return new CmdCurlParser(options);
            case 'bash':
                return new BashCurlParser(options);
            default:
                throw new Error(`不支持的curl模式: ${mode}`);
        }
    }
}

describe('BaseCurlParser - CMD模式基础功能', () => {
    let parser: TestableBaseCurlParser;

    class TestableBaseCurlParser extends BaseCurlParser {
        parseUrl(line: string): string {
            return line;
        }
        parseHeaders(lines: string[]): Record<string, string> {
            return {};
        }
        parseData(lines: string[], contentType: string): string {
            return '';
        }
        getCookieFromCurl(curlText: string): string {
            return '';
        }
    }

    beforeEach(() => {
        parser = new TestableBaseCurlParser({});
    });

    describe('parseMethod', () => {
        it('应该正确解析CMD模式下的GET方法', () => {
            const lines = ['curl -X GET ^"https://example.com^"'];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('get');
        });

        it('应该正确解析CMD模式下的POST方法', () => {
            const lines = ['curl -X POST ^"https://example.com^"'];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('post');
        });

        it('应该根据数据体推断CMD模式下的POST方法', () => {
            const lines = ['curl ^"https://example.com^"', '--data ^"test data^"'];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('post');
        });

        it('应该在CMD模式下没有明确方法和数据体时返回get', () => {
            const lines = ['curl ^"https://example.com^"'];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('get');
        });
    });
});

describe('CmdCurlParser', () => {
    let parser: CmdCurlParser;

    beforeEach(() => {
        parser = new CmdCurlParser({});
    });

    describe('parseUrl', () => {
        it('应该正确解析CMD格式的URL', () => {
            const line = 'curl ^"https://api.example.com/users^"';
            const url = parser.parseUrl(line);
            expect(url).toBe('https://api.example.com/users');
        });

        it('应该处理CMD模式下的URL参数', () => {
            const line = 'curl ^"https://api.example.com/users?id=123^&name=test^"';
            const url = parser.parseUrl(line);
            expect(url).toBe('https://api.example.com/users?id=123&name=test');
        });

        it('应该返回空字符串当CMD模式下没有匹配到URL', () => {
            const line = 'curl';
            const url = parser.parseUrl(line);
            expect(url).toBe('');
        });

        it('应该处理CMD模式下包含空格的URL', () => {
            const line = 'curl ^"https://api.example.com/path with spaces^"';
            const url = parser.parseUrl(line);
            expect(url).toBe('https://api.example.com/path with spaces');
        });
    });

    describe('parseHeaders', () => {
        it('应该正确解析CMD格式的请求头', () => {
            const lines = [
                'curl ^"https://api.example.com^" ^',
                '-H ^"Content-Type: application/json^" ^',
                '-H ^"Authorization: Bearer token123^"',
            ];
            const headers = parser.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['Authorization']).toBe('Bearer token123');
        });

        it('应该处理CMD特有的转义字符', () => {
            const lines = ['curl ^"https://api.example.com^" ^', '-H ^"X-Custom: value^^ with special chars^"'];
            const headers = parser.parseHeaders(lines);

            expect(headers['X-Custom']).toBe('value^ with special chars');
        });

        it('应该处理CMD模式下大括号的转义', () => {
            const lines = ['curl ^"https://api.example.com^" ^', '-H ^"X-Data: ^{test: value^}^"'];
            const headers = parser.parseHeaders(lines);

            expect(headers['X-Data']).toBe('{test: value}');
        });

        it('应该在CMD模式下应用过滤规则', () => {
            const lines = [
                'curl ^"https://api.example.com^" ^',
                '-H ^"Content-Type: application/json^" ^',
                '-H ^"X-Custom-Header: custom^"',
            ];
            const headers = parser.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['X-Custom-Header']).toBeUndefined();
        });

        it('应该在CMD模式下支持full模式', () => {
            const parserWithFull = new CmdCurlParser({ full: true });
            const lines = [
                'curl ^"https://api.example.com^" ^',
                '-H ^"Content-Type: application/json^" ^',
                '-H ^"X-Custom-Header: custom^"',
            ];
            const headers = parserWithFull.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['X-Custom-Header']).toBe('custom');
        });

        it('应该在CMD模式下支持额外的请求头字段', () => {
            const parserWithExtra = new CmdCurlParser({ extra: 'Authorization,X-Custom' });
            const lines = [
                'curl ^"https://api.example.com^" ^',
                '-H ^"Content-Type: application/json^" ^',
                '-H ^"Authorization: Bearer token123^" ^',
                '-H ^"X-Custom: value^"',
            ];
            const headers = parserWithExtra.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['Authorization']).toBe('Bearer token123');
            expect(headers['X-Custom']).toBe('value');
        });

        it('应该处理CMD模式下的Cookie请求头', () => {
            const lines = ['curl ^"https://api.example.com^" ^', '-H ^"Cookie: session=abc123; user=john^"'];
            const headers = parser.parseHeaders(lines);

            expect(headers['Cookie']).toBe('session=abc123; user=john');
        });
    });

    describe('parseData', () => {
        it('应该正确解析CMD格式的数据', () => {
            const lines = [
                'curl ^"https://api.example.com^" ^',
                '--data-raw ^"{\\"name\\": \\"John\\", \\"age\\": 30}^"',
            ];
            const contentType = 'application/json';
            const data = parser.parseData(lines, contentType);

            expect(data).toBe('{"name": "John", "age": 30}');
        });

        it('应该处理CMD数据中的转义字符', () => {
            const lines = ['curl ^"https://api.example.com^" ^', '--data-raw ^"test^^ data^"'];
            const contentType = 'text/plain';
            const data = parser.parseData(lines, contentType);

            expect(data).toBe('test^^ data');
        });

        it('应该将CMD模式下的application/x-www-form-urlencoded数据转换为JSON', () => {
            const lines = ['curl ^"https://api.example.com^" ^', '--data-raw ^"name=John^&age=30^&city=New York^"'];
            const contentType = 'application/x-www-form-urlencoded';
            const data = parser.parseData(lines, contentType);

            expect(data).toBe('{"name":"John","age":"30","city":"New York"}');
        });

        it('应该在没有CMD模式数据时返回空字符串', () => {
            const lines = ['curl ^"https://api.example.com^"'];
            const contentType = 'application/json';
            const data = parser.parseData(lines, contentType);

            expect(data).toBe('');
        });

        it('应该处理CMD模式下的--data和-d格式的数据', () => {
            const lines1 = ['curl ^"https://api.example.com^" ^', '--data ^"test data^"'];
            const lines2 = ['curl ^"https://api.example.com^" ^', '-d ^"test data^"'];
            const contentType = 'text/plain';

            expect(parser.parseData(lines1, contentType)).toBe('test data');
            expect(parser.parseData(lines2, contentType)).toBe('test data');
        });
    });

    describe('getCookieFromCurl', () => {
        it('应该正确解析CMD格式的cookie', () => {
            const curlText = `curl ^"https://api.example.com^" ^
-b ^"session=abc123; user=john^"`;
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123; user=john');
        });

        it('应该处理CMD cookie中的特殊转义', () => {
            const curlText = `curl ^"https://api.example.com^" ^
-b ^"session=abc123^%; user=john^!^"`;
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123%; user=john!');
        });

        it('应该正确解析CMD模式下-H Cookie格式的cookie', () => {
            const curlText = `curl ^"https://api.example.com^" ^
-H ^"Cookie: session=abc123; user=john^"`;
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123; user=john');
        });

        it('应该在CMD模式下没有cookie时返回空字符串', () => {
            const curlText = 'curl ^"https://api.example.com^"';
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('');
        });
    });
});

describe('CurlCommand - CMD模式', () => {
    let command: CurlCommand;
    let mockClipboardy: any;

    beforeEach(() => {
        command = new CurlCommand();
        mockClipboardy = {
            readSync: vi.fn(),
            writeSync: vi.fn(),
        };
        (clipboardy as any).default = mockClipboardy;
    });

    describe('getCookieFromCurl - CMD模式', () => {
        it('应该处理CMD模式的cookie', () => {
            const curlText = `curl ^"https://api.example.com^" ^
-b ^"session=abc123^"`;
            const cookie = command.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123');
        });

        it('应该处理CMD模式下-H Cookie格式的cookie', () => {
            const curlText = `curl ^"https://api.example.com^" ^
-H ^"Cookie: session=abc123; user=john^"`;
            const cookie = command.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123; user=john');
        });

        it('应该在CMD模式下没有cookie时返回空字符串', () => {
            const curlText = 'curl ^"https://api.example.com^"';
            const cookie = command.getCookieFromCurl(curlText);

            expect(cookie).toBe('');
        });
    });

    describe('getBodyFromCurl - CMD模式', () => {
        it('应该正确提取CMD模式的请求体', () => {
            const curlText = `curl ^"https://api.example.com^" ^
--data-raw ^"{\\"name\\": \\"John\\"}^"`;
            const body = command.getBodyFromCurl(curlText);

            expect(body).toBe('{"name": "John"}');
        });

        it('应该处理CMD模式下form-urlencoded数据', () => {
            const curlText = `curl ^"https://api.example.com^" ^
-H ^"Content-Type: application/x-www-form-urlencoded^" ^
--data-raw ^"name=John^&age=30^"`;
            const body = command.getBodyFromCurl(curlText);

            expect(body).toBe('{"name":"John","age":"30"}');
        });

        it('应该在CMD模式下没有请求体时返回空字符串', () => {
            const curlText = 'curl ^"https://api.example.com^"';
            const body = command.getBodyFromCurl(curlText);

            expect(body).toBe('');
        });

        it('应该处理CMD模式下无效的curl命令', () => {
            const body = command.getBodyFromCurl('not a curl command');

            expect(body).toBe('');
        });
    });

    describe('main - CMD模式', () => {
        it('应该成功处理CMD模式的curl命令', () => {
            const curlText = `curl ^"https://api.example.com/users^" ^
-H ^"Content-Type: application/json^" ^
--data-raw ^"{\\"name\\": \\"John\\"}^"`;

            mockClipboardy.readSync.mockReturnValue(curlText);

            command.main({});

            expect((command as any).logger.info).toHaveBeenCalledWith('检测到curl模式: cmd');
            expect((command as any).logger.success).toHaveBeenCalledWith('生成成功');
            expect(mockClipboardy.writeSync).toHaveBeenCalled();

            const generatedCode = mockClipboardy.writeSync.mock.calls[0][0];
            expect(generatedCode).toContain("import axios from 'axios'");
            expect(generatedCode).toContain("method: 'post'");
            expect(generatedCode).toContain("url: 'https://api.example.com/users'");
            expect(generatedCode).toContain('Content-Type: application/json');
        });

        it('应该处理CMD模式下form-urlencoded格式的请求', () => {
            const curlText = `curl ^"https://api.example.com/login^" ^
-H ^"Content-Type: application/x-www-form-urlencoded^" ^
--data-raw ^"username=john^&password=secret^"`;

            mockClipboardy.readSync.mockReturnValue(curlText);

            command.main({});

            expect((command as any).logger.success).toHaveBeenCalledWith('生成成功');

            const generatedCode = mockClipboardy.writeSync.mock.calls[0][0];
            expect(generatedCode).toContain("import FormData from 'form-data'");
            expect(generatedCode).toContain("fd.append('username', 'john')");
            expect(generatedCode).toContain("fd.append('password', 'secret')");
        });

        it('应该处理CMD模式下带选项的请求', () => {
            const curlText = `curl ^"https://api.example.com/users^" ^
-H ^"Content-Type: application/json^" ^
-H ^"Authorization: Bearer token123^" ^
--data-raw ^"{\\"name\\": \\"John\\"}^"`;

            mockClipboardy.readSync.mockReturnValue(curlText);

            command.main({ extra: 'Authorization', full: false });

            expect((command as any).logger.success).toHaveBeenCalledWith('生成成功');

            const generatedCode = mockClipboardy.writeSync.mock.calls[0][0];
            expect(generatedCode).toContain('Authorization: Bearer token123');
        });
    });
});

describe('CMD模式集成测试', () => {
    it('应该处理复杂的CMD curl命令', () => {
        const curlText = `curl ^"https://api.example.com/api/v1/users^" ^
-X POST ^
-H ^"Content-Type: application/json^" ^
-H ^"Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9^" ^
-H ^"User-Agent: Mozilla/5.0^" ^
-H ^"Cookie: session=abc123; user=john^" ^
--data-raw ^"{\\"name\\":\\"John Doe\\",\\"email\\":\\"john@example.com\\",\\"age\\":30}^"`;

        const mode = TestCurlParserFactory.detectCurlMode(curlText);
        expect(mode).toBe('cmd');

        const parser = TestCurlParserFactory.createParser(mode, {});
        const url = parser.parseUrl(curlText.split('^')[0]);
        const headers = parser.parseHeaders(curlText.split('^'));
        const method = (parser as any).parseMethod(curlText.split('^'));
        const data = parser.parseData(curlText.split('^'), headers['Content-Type']);

        expect(url).toBe('https://api.example.com/api/v1/users');
        expect(method).toBe('post');
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Authorization']).toBe('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        expect(headers['User-Agent']).toBe('Mozilla/5.0');
        expect(headers['Cookie']).toBe('session=abc123; user=john');
        expect(data).toBe('{"name":"John Doe","email":"john@example.com","age":30}');
    });

    it('应该处理CMD模式下form-urlencoded格式的复杂请求', () => {
        const curlText = `curl ^"https://api.example.com/login^" ^
-H ^"Content-Type: application/x-www-form-urlencoded^" ^
--data-raw ^"username=john.doe@example.com^&password=secret123^&remember_me=true^"`;

        const mode = TestCurlParserFactory.detectCurlMode(curlText);
        const parser = TestCurlParserFactory.createParser(mode, {});
        const headers = parser.parseHeaders(curlText.split('^'));
        const data = parser.parseData(curlText.split('^'), headers['Content-Type']);

        expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        expect(data).toBe('{"username":"john.doe@example.com","password":"secret123","remember_me":"true"}');
    });

    it('应该处理CMD模式下带特殊字符的URL', () => {
        const curlText = `curl ^"https://api.example.com/search?q=hello world^&filter=name:asc^&special=!@#$%^%^&*()^"`;

        const mode = TestCurlParserFactory.detectCurlMode(curlText);
        const parser = TestCurlParserFactory.createParser(mode, {});
        const url = parser.parseUrl(curlText.split('^')[0]);

        expect(url).toBe('https://api.example.com/search?q=hello world&filter=name:asc&special=!@#$%^&*()');
    });

    it('应该处理CMD模式下GET请求带查询参数', () => {
        const curlText = `curl ^"https://api.example.com/users?page=1^&limit=10^&sort=name^" ^
-H ^"Authorization: Bearer token123^"`;

        const mode = TestCurlParserFactory.detectCurlMode(curlText);
        const parser = TestCurlParserFactory.createParser(mode, {});
        const url = parser.parseUrl(curlText.split('^')[0]);
        const method = (parser as any).parseMethod(curlText.split('^'));
        const data = parser.parseData(curlText.split('^'), '');

        expect(url).toBe('https://api.example.com/users?page=1&limit=10&sort=name');
        expect(method).toBe('get');
        expect(data).toBe('');
    });
});