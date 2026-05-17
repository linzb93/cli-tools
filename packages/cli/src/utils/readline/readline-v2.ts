import readline from 'node:readline';
import chalk from 'chalk';
import type {
    CommandHandlerV2,
    ParsedPattern,
    RegisteredCommand,
    ReadlineProgram,
    CreateReadlineOptions,
    ReadlineUtils,
    CommandBuilder,
} from './types-v2';

/**
 * 解析命令用法字符串
 * @param usage - 用法字符串，如 '/diff <x> <message>' 或 '/commit <message>'
 * @returns 解析后的模式
 */
function parseUsage(usage: string): ParsedPattern {
    const trimmed = usage.trim();
    if (!trimmed.startsWith('/')) {
        throw new Error(`命令用法必须以 / 开头: ${usage}`);
    }
    const content = trimmed.slice(1).trim();
    const parts = content.split(/\s+/).filter(Boolean);
    const name = parts[0];
    const argsStr = parts.slice(1).join(' ');

    // 解析参数: <x> 表示必需参数, [x] 表示可选参数
    const requiredArgs: string[] = [];
    const optionalArgs: string[] = [];
    const argMatches = argsStr.match(/<[^>]+>|\[[^\]]+\]/g) || [];

    for (const match of argMatches) {
        if (match.startsWith('<')) {
            requiredArgs.push(match.slice(1, -1));
        } else {
            optionalArgs.push(match.slice(1, -1));
        }
    }

    return { name, requiredArgs, optionalArgs };
}

/**
 * 解析用户输入的行
 * @param line - 用户输入
 * @returns 解析结果，非 slash 命令返回 null
 */
function parseInput(line: string): { command: string; args: string[] } | null {
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
    return { command, args: parts };
}

/**
 * 显示已注册的命令列表
 */
function displayCommands(commands: RegisteredCommand[], exitCommand: string): void {
    const lines: string[] = [];
    for (const cmd of commands) {
        const argsStr =
            cmd.pattern.requiredArgs.length > 0
                ? ' ' + cmd.pattern.requiredArgs.map((a) => `<${a}>`).join(' ')
                : '';
        const optStr =
            cmd.pattern.optionalArgs.length > 0
                ? cmd.pattern.optionalArgs.map((a) => ` [<${a}>]`).join('')
                : '';
        const desc = cmd.description ? ` - ${cmd.description}` : '';
        lines.push(`/${cmd.pattern.name}${argsStr}${optStr}${desc}`);
    }
    lines.push(`/${exitCommand} - 退出`);
    console.log(chalk.yellow(lines.join('\n')));
}

/**
 * 创建 ReadlineProgram 实例
 * @param options - 选项
 */
export function createReadline(options: CreateReadlineOptions = {}): ReadlineProgram {
    const registeredCommands: RegisteredCommand[] = [];
    const prompt = options.prompt ?? '';
    const exitCommand = options.exitCommand ?? 'exit';
    const items = options.items;

    // utils 在 start() 时初始化
    let utils: ReadlineUtils = {
        close: () => {},
        displayCommands: () => {},
    };

    const program: ReadlineProgram = {
        utils,

        command(usage: string): CommandBuilder {
            const pattern = parseUsage(usage);
            let description: string | undefined;

            return {
                description(desc: string): CommandBuilder {
                    description = desc;
                    return this;
                },
                action(handler: CommandHandlerV2): void {
                    registeredCommands.push({ pattern, handler, description });
                },
            };
        },

        start(): Promise<void> {
            const commandMap = new Map<string, RegisteredCommand>();
            for (const cmd of registeredCommands) {
                commandMap.set(cmd.pattern.name, cmd);
            }

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: true,
            });

            // 初始化 utils
            utils = {
                close: () => rl.close(),
                displayCommands: () => displayCommands(registeredCommands, exitCommand),
            };

            const displayHelp = () => displayCommands(registeredCommands, exitCommand);
            commandMap.set('help', {
                pattern: { name: 'help', requiredArgs: [], optionalArgs: [] },
                handler: displayHelp,
                description: '显示所有可用命令',
            });

            rl.setPrompt(`${prompt}> `);
            rl.prompt();

            const handleLine = async (line: string): Promise<void> => {
                const parsed = parseInput(line);
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

                // 检查必需参数数量
                if (parsed.args.length < cmd.pattern.requiredArgs.length) {
                    const usage =
                        cmd.pattern.requiredArgs.length > 0
                            ? ' ' + cmd.pattern.requiredArgs.map((a) => `<${a}>`).join(' ')
                            : '';
                    console.log(chalk.red(`参数不足: /${cmd.pattern.name}${usage}`));
                    rl.prompt();
                    return;
                }

                rl.pause();
                try {
                    const result = await cmd.handler(parsed.args);
                    if (result === false) {
                        rl.close();
                        return;
                    }
                } catch (err) {
                    console.log(chalk.red(`命令执行失败: /${cmd.pattern.name}`));
                    console.log(String(err));
                } finally {
                    rl.resume();
                    rl.prompt();
                    await options.onComplete?.({ rl, command: cmd.pattern.name });
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
        },
    };

    return program;
}
