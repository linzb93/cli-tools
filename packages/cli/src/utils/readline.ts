import readline from 'node:readline';
import chalk from 'chalk';

export interface ReadlineCommandContext {
    rl: readline.Interface;
    line?: string;
    /** 项目列表（如果传入 items） */
    list?: unknown[];
    /** 通用获取项目方法 */
    getItem: <T>(indexStr: string) => T | null;
}

export interface ReadlineCommand {
    name: string;
    description?: string;
    usage?: string;
    /** 是否需要项目列表上下文（用于命令如 diff/commit/log/push） */
    requireList?: boolean;
    handler: (args: string[], item: any) => void | Promise<void>;
}

interface CommandReadlineOptions {
    prompt?: string;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    terminal?: boolean;
    exitCommand?: string;
    /** 项目列表（可选），传入后命令上下文中会自动包含 getItem 方法 */
    items?: unknown[];
}

interface ParsedSlashCommand {
    command: string;
    args: string[];
}

/**
 * 解析 usage 字符串，返回必需的参数个数
 * @param usage - 用法字符串，如 '<x>' '<x> <message>' '[x]'
 * @returns 必需参数的数量
 * @example
 * countRequiredArgs('<x>') === 1
 * countRequiredArgs('<x> <message>') === 2
 * countRequiredArgs('[x]') === 0
 */
function countRequiredArgs(usage: string): number {
    const matches = usage.match(/<[^>]+>/g) || [];
    return matches.length;
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
 * 原有 readline 实现（VSCode 环境）
 * @param {ReadlineCommand[]} commands - 需要注册的命令列表
 * @param {CommandReadlineOptions} options - readline 选项
 * @returns 当 readline 关闭时 resolve
 */
export function createCommandReadline(
    commands: ReadlineCommand[],
    options: CommandReadlineOptions = {},
): Promise<void> {
    const prompt = `${options.prompt || ''}> `;
    const exitCommand = options.exitCommand || 'exit';
    const { items } = options;

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

    // 通用 getItem 方法
    const getItem = <T>(indexStr: string): T | null => {
        if (!items) return null;
        const index = parseInt(indexStr, 10);
        if (isNaN(index) || index < 1 || index > items.length) {
            return null;
        }
        return items[index - 1] as T;
    };

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

        // 需要列表但没有传入 items
        if (cmd.requireList && !items) {
            console.log(chalk.red(`命令 /${cmd.name} 需要项目列表`));
            rl.prompt();
            return;
        }

        // 根据 usage 校验参数数量
        if (cmd.usage) {
            const requiredCount = countRequiredArgs(cmd.usage);
            if (parsed.args.length < requiredCount) {
                console.log(chalk.red(`参数不足: /${cmd.name} ${cmd.usage}`));
                rl.prompt();
                return;
            }
        }

        // requireList 模式下自动校验 item
        let item: unknown = null;
        if (cmd.requireList) {
            if (!items) {
                console.log(chalk.red(`命令 /${cmd.name} 需要项目列表`));
                rl.prompt();
                return;
            }
            if (parsed.args.length === 0) {
                console.log(chalk.red(`参数不足: /${cmd.name} ${cmd.usage}`));
                rl.prompt();
                return;
            }
            item = getItem(parsed.args[0]);
            if (!item) {
                console.log(chalk.red(`请输入有效的项目编号 (1-${items.length})`));
                rl.prompt();
                return;
            }
        }

        rl.pause();
        try {
            await cmd.handler(parsed.args, item);
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
