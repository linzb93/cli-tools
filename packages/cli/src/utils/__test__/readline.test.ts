import { describe, it, expect, vi, afterEach } from 'vitest';
import { PassThrough } from 'node:stream';
import { createCommandReadline, parseSlashCommand } from '../readline';

describe('parseSlashCommand', () => {
    it('应该正确解析 /diff 1', () => {
        const out = parseSlashCommand('/diff 1');
        expect(out).toEqual({ command: 'diff', args: ['1'] });
    });

    it('应该忽略非 slash 命令', () => {
        expect(parseSlashCommand('diff 1')).toBeNull();
    });

    it('应该忽略空命令', () => {
        expect(parseSlashCommand('/')).toBeNull();
        expect(parseSlashCommand('/   ')).toBeNull();
    });
});

describe('createCommandReadline', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('应该在进入 readline 前展示命令，并按参数分发执行', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        const input = new PassThrough();
        const output = new PassThrough();
        const handler = vi.fn(async () => undefined);

        const done = createCommandReadline(
            [
                {
                    name: 'diff',
                    description: 'test',
                    handler: async (args) => {
                        await handler(args);
                    },
                },
            ],
            { input, output, terminal: false },
        );

        expect(logSpy).toHaveBeenCalled();
        expect(String(logSpy.mock.calls[0]?.[0] ?? '')).toContain('/diff');
        expect(String(logSpy.mock.calls[0]?.[0] ?? '')).toContain('/exit');

        input.write('/diff 1\n');
        input.write('/exit\n');
        input.end();

        await done;

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(['1']);
    });
});

