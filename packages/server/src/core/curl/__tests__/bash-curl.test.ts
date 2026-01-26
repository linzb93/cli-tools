import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseCurlParser } from '../BaseCurlParser';
import { BashCurlParser } from '../BashCurlParser';
import CurlCommand from '../index';
import clipboardy from 'clipboardy';

/**
 * Bash类型curl命令测试用例
 * 测试范围包括：BashCurlParser、BaseCurlParser基础功能、CurlCommand Bash模式
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

// 模拟BaseManager
vi.mock('../BaseManager', () => ({
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
        // 检查是否包含bash模式特有的特征
        if (curlText.includes('\\\n') || curlText.includes("$'")) {
            return 'bash';
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

describe('BaseCurlParser - Bash模式基础功能', () => {
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
        it('应该正确解析Bash模式下的GET方法', () => {
            const lines = ['curl -X GET https://example.com'];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('get');
        });

        it('应该正确解析Bash模式下的POST方法', () => {
            const lines = ['curl -X POST https://example.com'];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('post');
        });

        it('应该正确解析Bash模式下的--request格式的方法', () => {
            const lines = ['curl --request PUT https://example.com'];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('put');
        });

        it('应该根据数据体推断Bash模式下的POST方法', () => {
            const lines = ['curl https://example.com', '--data \'{"key": "value"}\''];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('post');
        });

        it('应该在Bash模式下没有明确方法和数据体时返回get', () => {
            const lines = ['curl https://example.com'];
            const method = (parser as any).parseMethod(lines);
            expect(method).toBe('get');
        });

        it('应该处理Bash模式下各种数据参数格式', () => {
            const lines1 = ['curl https://example.com', "--data-raw 'test'"];
            const lines2 = ['curl https://example.com', "-d 'test'"];

            expect((parser as any).parseMethod(lines1)).toBe('post');
            expect((parser as any).parseMethod(lines2)).toBe('post');
        });
    });
});

describe('BashCurlParser', () => {
    let parser: BashCurlParser;

    beforeEach(() => {
        parser = new BashCurlParser({});
    });

    describe('parseUrl', () => {
        it('应该正确解析单引号格式的URL', () => {
            const line = "curl 'https://api.example.com/users'";
            const url = parser.parseUrl(line);
            expect(url).toBe('https://api.example.com/users');
        });

        it('应该返回空字符串当Bash模式下没有匹配到URL', () => {
            const line = 'curl';
            const url = parser.parseUrl(line);
            expect(url).toBe('');
        });

        it('应该处理Bash模式下包含参数的URL', () => {
            const line = "curl 'https://api.example.com/users?id=123&name=test'";
            const url = parser.parseUrl(line);
            expect(url).toBe('https://api.example.com/users?id=123&name=test');
        });
    });

    describe('parseHeaders', () => {
        it('应该正确解析Bash模式下的基本请求头', () => {
            const lines = [
                "curl 'https://api.example.com' \\",
                "-H 'Content-Type: application/json' \\",
                "-H 'Authorization: Bearer token123'",
            ];
            const headers = parser.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['Authorization']).toBe('Bearer token123');
        });

        it('应该只保留Bash模式下允许的请求头（默认过滤）', () => {
            const lines = [
                "curl 'https://api.example.com' \\",
                "-H 'Content-Type: application/json' \\",
                "-H 'X-Custom-Header: custom' \\",
                "-H 'Authorization: Bearer token123'",
            ];
            const headers = parser.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['X-Custom-Header']).toBeUndefined();
            expect(headers['Authorization']).toBeUndefined();
        });

        it('应该在Bash模式下full模式保留所有请求头', () => {
            const parserWithFull = new BashCurlParser({ full: true });
            const lines = [
                "curl 'https://api.example.com' \\",
                "-H 'Content-Type: application/json' \\",
                "-H 'X-Custom-Header: custom'",
            ];
            const headers = parserWithFull.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['X-Custom-Header']).toBe('custom');
        });

        it('应该在Bash模式下支持额外的请求头字段', () => {
            const parserWithExtra = new BashCurlParser({ extra: 'Authorization,X-Custom' });
            const lines = [
                "curl 'https://api.example.com' \\",
                "-H 'Content-Type: application/json' \\",
                "-H 'Authorization: Bearer token123' \\",
                "-H 'X-Custom: value'",
            ];
            const headers = parserWithExtra.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['Authorization']).toBe('Bearer token123');
            expect(headers['X-Custom']).toBe('value');
        });

        it('应该处理Bash模式下的Cookie请求头', () => {
            const lines = ["curl 'https://api.example.com' \\", "-H 'Cookie: session=abc123; user=john'"];
            const headers = parser.parseHeaders(lines);

            expect(headers['Cookie']).toBe('session=abc123; user=john');
        });

        it("应该处理Bash模式下$'转义字符", () => {
            const lines = ["curl 'https://api.example.com' \\", "-H $'Content-Type: application/json'"];
            const headers = parser.parseHeaders(lines);

            expect(headers['Content-Type']).toBe('application/json');
        });
    });

    describe('parseData', () => {
        it('应该正确解析Bash模式下--data-raw格式的数据', () => {
            const lines = ["curl 'https://api.example.com' \\", '--data-raw \'{"name": "John", "age": 30}\''];
            const contentType = 'application/json';
            const data = parser.parseData(lines, contentType);

            expect(data).toBe('{"name": "John", "age": 30}');
        });

        it('应该将Bash模式下application/x-www-form-urlencoded数据转换为JSON', () => {
            const lines = ["curl 'https://api.example.com' \\", "--data-raw 'name=John&age=30&city=New York'"];
            const contentType = 'application/x-www-form-urlencoded';
            const data = parser.parseData(lines, contentType);

            expect(data).toBe('{"name":"John","age":"30","city":"New York"}');
        });

        it('应该在Bash模式下没有数据时返回空字符串', () => {
            const lines = ["curl 'https://api.example.com'"];
            const contentType = 'application/json';
            const data = parser.parseData(lines, contentType);

            expect(data).toBe('');
        });

        it('应该处理Bash模式下--data和-d格式的数据', () => {
            const lines1 = ["curl 'https://api.example.com' \\", "--data 'test data'"];
            const lines2 = ["curl 'https://api.example.com' \\", "-d 'test data'"];
            const contentType = 'text/plain';

            expect(parser.parseData(lines1, contentType)).toBe('test data');
            expect(parser.parseData(lines2, contentType)).toBe('test data');
        });
    });

    describe('getCookieFromCurl', () => {
        it('应该正确解析Bash模式下-b格式的cookie', () => {
            const curlText = `curl 'https://api.example.com' \\
-b 'session=abc123; user=john' \\
-H 'Content-Type: application/json'`;
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123; user=john');
        });

        it('应该正确解析Bash模式下--cookie格式的cookie', () => {
            const curlText = `curl 'https://api.example.com' \\
--cookie 'session=abc123; user=john'`;
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123; user=john');
        });

        it('应该正确解析Bash模式下-H Cookie格式的cookie', () => {
            const curlText = `curl 'https://api.example.com' \\
-H 'Cookie: session=abc123; user=john'`;
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123; user=john');
        });

        it('应该在Bash模式下没有cookie时返回空字符串', () => {
            const curlText = "curl 'https://api.example.com'";
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('');
        });

        it("应该处理Bash模式下$'转义字符的cookie", () => {
            const curlText = `curl 'https://api.example.com' \\
-b $'session=abc123'`;
            const cookie = parser.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123');
        });
    });
});

describe('CurlCommand - Bash模式', () => {
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

    describe('isCurl', () => {
        it('应该正确识别Bash模式的curl命令', () => {
            expect(command.isCurl("curl 'https://example.com'")).toBe(true);
            expect(command.isCurl("  curl 'https://example.com'")).toBe(true);
            expect(command.isCurl('CURL https://example.com')).toBe(false);
            expect(command.isCurl('not a curl command')).toBe(false);
            expect(command.isCurl('')).toBe(false);
        });
    });

    describe('getCookieFromCurl - Bash模式', () => {
        it('应该处理Bash模式的cookie', () => {
            const curlText = `curl 'https://api.example.com' \\
-b 'session=abc123'`;
            const cookie = command.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123');
        });

        it('应该处理Bash模式下-H Cookie格式的cookie', () => {
            const curlText = `curl 'https://api.example.com' \\
-H 'Cookie: session=abc123; user=john'`;
            const cookie = command.getCookieFromCurl(curlText);

            expect(cookie).toBe('session=abc123; user=john');
        });

        it('应该在Bash模式下没有cookie时返回空字符串', () => {
            const curlText = "curl 'https://api.example.com'";
            const cookie = command.getCookieFromCurl(curlText);

            expect(cookie).toBe('');
        });
    });

    describe('getBodyFromCurl - Bash模式', () => {
        it('应该正确提取Bash模式的请求体', () => {
            const curlText = `curl 'https://api.example.com' \\
--data-raw '{"name": "John"}'`;
            const body = command.getBodyFromCurl(curlText);

            expect(body).toBe('{"name": "John"}');
        });

        it('应该处理Bash模式下form-urlencoded数据', () => {
            const curlText = `curl 'https://api.example.com' \\
-H 'Content-Type: application/x-www-form-urlencoded' \\
--data-raw 'name=John&age=30'`;
            const body = command.getBodyFromCurl(curlText);

            expect(body).toBe('{"name":"John","age":"30"}');
        });

        it('应该在Bash模式下没有请求体时返回空字符串', () => {
            const curlText = "curl 'https://api.example.com'";
            const body = command.getBodyFromCurl(curlText);

            expect(body).toBe('');
        });

        it('应该处理Bash模式下无效的curl命令', () => {
            const body = command.getBodyFromCurl('not a curl command');

            expect(body).toBe('');
        });
    });

    describe('main - Bash模式', () => {
        it('应该处理空的剪贴板', () => {
            mockClipboardy.readSync.mockReturnValue('');

            command.main({});

            expect((command as any).logger.error).toHaveBeenCalledWith('剪贴板为空');
        });

        it('应该处理非curl内容', () => {
            mockClipboardy.readSync.mockReturnValue('not a curl command');

            command.main({});

            expect((command as any).logger.error).toHaveBeenCalledWith('可能剪贴板里的不是curl代码，退出进程');
        });

        it('应该成功处理Bash模式的curl命令', () => {
            const curlText = `curl 'https://api.example.com/users' \\
-H 'Content-Type: application/json' \\
--data-raw '{"name": "John"}'`;

            mockClipboardy.readSync.mockReturnValue(curlText);

            command.main({});

            expect((command as any).logger.info).toHaveBeenCalledWith('检测到curl模式: bash');
            expect((command as any).logger.success).toHaveBeenCalledWith('生成成功');
            expect(mockClipboardy.writeSync).toHaveBeenCalled();

            const generatedCode = mockClipboardy.writeSync.mock.calls[0][0];
            expect(generatedCode).toContain("import axios from 'axios'");
            expect(generatedCode).toContain("method: 'post'");
            expect(generatedCode).toContain("url: 'https://api.example.com/users'");
            expect(generatedCode).toContain('Content-Type: application/json');
        });

        it('应该处理Bash模式下form-urlencoded格式的请求', () => {
            const curlText = `curl 'https://api.example.com/login' \\
-H 'Content-Type: application/x-www-form-urlencoded' \\
--data-raw 'username=john&password=secret'`;

            mockClipboardy.readSync.mockReturnValue(curlText);

            command.main({});

            expect((command as any).logger.success).toHaveBeenCalledWith('生成成功');

            const generatedCode = mockClipboardy.writeSync.mock.calls[0][0];
            expect(generatedCode).toContain("import FormData from 'form-data'");
            expect(generatedCode).toContain("fd.append('username', 'john')");
            expect(generatedCode).toContain("fd.append('password', 'secret')");
        });

        it('应该处理无法解析URL的情况', () => {
            const curlText = 'curl';

            mockClipboardy.readSync.mockReturnValue(curlText);

            command.main({});

            expect((command as any).logger.error).toHaveBeenCalledWith('无法解析URL');
        });

        it('应该处理Bash模式下带选项的请求', () => {
            const curlText = `curl 'https://api.example.com/users' \\
-H 'Content-Type: application/json' \\
-H 'Authorization: Bearer token123' \\
--data-raw '{"name": "John"}'`;

            mockClipboardy.readSync.mockReturnValue(curlText);

            command.main({ extra: 'Authorization', full: false });

            expect((command as any).logger.success).toHaveBeenCalledWith('生成成功');

            const generatedCode = mockClipboardy.writeSync.mock.calls[0][0];
            expect(generatedCode).toContain('Authorization: Bearer token123');
        });
    });
});

describe('Bash模式集成测试', () => {
    it('应该处理复杂的Bash curl命令', () => {
        const curlText = `curl 'https://api.example.com/api/v1/users' \\
-X POST \\
-H 'Content-Type: application/json' \\
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' \\
-H 'User-Agent: Mozilla/5.0' \\
-H 'Cookie: session=abc123; user=john' \\
--data-raw '{"name":"John Doe","email":"john@example.com","age":30}'`;

        const mode = TestCurlParserFactory.detectCurlMode(curlText);
        expect(mode).toBe('bash');

        const parser = TestCurlParserFactory.createParser(mode, {});
        const url = parser.parseUrl(curlText.split('\\\n')[0]);
        const headers = parser.parseHeaders(curlText.split('\\\n'));
        const method = (parser as any).parseMethod(curlText.split('\\\n'));
        const data = parser.parseData(curlText.split('\\\n'), headers['Content-Type']);

        expect(url).toBe('https://api.example.com/api/v1/users');
        expect(method).toBe('post');
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Authorization']).toBe('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        expect(headers['User-Agent']).toBe('Mozilla/5.0');
        expect(headers['Cookie']).toBe('session=abc123; user=john');
        expect(data).toBe('{"name":"John Doe","email":"john@example.com","age":30}');
    });

    it('应该处理Bash模式下form-urlencoded格式的复杂请求', () => {
        const curlText = `curl 'https://api.example.com/login' \\
-H 'Content-Type: application/x-www-form-urlencoded' \\
--data-raw 'username=john.doe@example.com&password=secret123&remember_me=true'`;

        const mode = TestCurlParserFactory.detectCurlMode(curlText);
        const parser = TestCurlParserFactory.createParser(mode, {});
        const headers = parser.parseHeaders(curlText.split('\\\n'));
        const data = parser.parseData(curlText.split('\\\n'), headers['Content-Type']);

        expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        expect(data).toBe('{"username":"john.doe@example.com","password":"secret123","remember_me":"true"}');
    });

    it('应该处理Bash模式下带特殊字符的URL', () => {
        const curlText = `curl 'https://api.example.com/search?q=hello world&filter=name:asc&special=!@#$%^&*()'`;

        const mode = TestCurlParserFactory.detectCurlMode(curlText);
        const parser = TestCurlParserFactory.createParser(mode, {});
        const url = parser.parseUrl(curlText.split('\\\n')[0]);

        expect(url).toBe('https://api.example.com/search?q=hello world&filter=name:asc&special=!@#$%^&*()');
    });

    it('应该处理Bash模式下GET请求带查询参数', () => {
        const curlText = `curl 'https://api.example.com/users?page=1&limit=10&sort=name' \\
-H 'Authorization: Bearer token123'`;

        const mode = TestCurlParserFactory.detectCurlMode(curlText);
        const parser = TestCurlParserFactory.createParser(mode, {});
        const url = parser.parseUrl(curlText.split('\\\n')[0]);
        const method = (parser as any).parseMethod(curlText.split('\\\n'));
        const data = parser.parseData(curlText.split('\\\n'), '');

        expect(url).toBe('https://api.example.com/users?page=1&limit=10&sort=name');
        expect(method).toBe('get');
        expect(data).toBe('');
    });
});
