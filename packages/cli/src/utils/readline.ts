import readline from 'node:readline';
import chalk from 'chalk';

interface ReadlineCommandContext {
    rl: readline.Interface;
    line: string;
}

export interface ReadlineCommand {
    name: string;
    description?: string;
    usage?: string;
    handler: (args: string[], ctx: ReadlineCommandContext) => void | Promise<void>;
}

interface CommandReadlineOptions {
    prompt?: string;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    terminal?: boolean;
    exitCommand?: string;
}

interface ParsedSlashCommand {
    command: string;
    args: string[];
}

/**
 * 解析形如 `/diff 1` 的命令行输入
 * @param line - 用户输入的一行文本
 * @returns 解析结果；非 slash 命令返回 null
 * @example
 * const out = parseSlashCommand('/diff 1');
 * // out?.command === 'diff'
 * // out?.args[0] === '1'
 */
function parseSlashCommand(line: string): ParsedSlashCommand | null {
    const trimmed = line.trim();
    if (!trimmed.startsWith('/')) {
        return null;
    }
    const content = trimmed.slice(1).trim();
    if (!content) {
        return null;
    }
    const parts = content.split(/\s+/).filter(Boolean);
    const command = parts.shift();
    if (!command) {
        return null;
    }
    return {
        command,
        args: parts,
    };
}

/**
 * 创建一个支持 `/command args...` 的交互式 readline，并在进入前展示已注册命令
 * @param commands - 需要注册的命令列表
 * @param options - readline 选项
 * @returns 当 readline 关闭时 resolve
 */
export function createCommandReadline(
    commands: ReadlineCommand[],
    options: CommandReadlineOptions = {},
): Promise<void> {
    const prompt = options.prompt ?? '> ';
    const exitCommand = options.exitCommand ?? 'exit';

    const commandMap = new Map<string, ReadlineCommand>();
    for (const cmd of commands) {
        commandMap.set(cmd.name, cmd);
    }

    const displayLines: string[] = [];
    for (const cmd of commands) {
        const usage = cmd.usage ? ` ${cmd.usage}` : '';
        const desc = cmd.description ? ` - ${cmd.description}` : '';
        displayLines.push(`/${cmd.name}${usage}${desc}`);
    }
    displayLines.push(`/${exitCommand} - 退出`);
    console.log(chalk.yellow(displayLines.join('\n')));

    const rl = readline.createInterface({
        input: options.input ?? process.stdin,
        output: options.output ?? process.stdout,
        terminal: options.terminal ?? true,
    });

    rl.setPrompt(prompt);
    rl.prompt();

    const ctxBase = { rl } as Pick<ReadlineCommandContext, 'rl'>;

    const handleLine = async (line: string): Promise<void> => {
        const parsed = parseSlashCommand(line);
        if (!parsed) {
            rl.prompt();
            return;
        }

        if (parsed.command === exitCommand) {
            rl.close();
            return;
        }

        const cmd = commandMap.get(parsed.command);
        if (!cmd) {
            console.log(chalk.red(`未知命令: /${parsed.command}`));
            rl.prompt();
            return;
        }

        rl.pause();
        try {
            await cmd.handler(parsed.args, { ...ctxBase, line });
        } catch (err) {
            console.log(chalk.red(`命令执行失败: /${cmd.name}`));
            console.log(String(err));
        } finally {
            rl.resume();
            rl.prompt();
        }
    };

    rl.on('line', (line) => {
        void handleLine(line);
    });

    rl.on('SIGINT', () => {
        rl.close();
    });

    return new Promise((resolve) => {
        rl.on('close', () => {
            resolve();
        });
    });
}
