import readline from 'node:readline';
import chalk from 'chalk';
import editor from './editor';

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
 * 是否在VSCode编辑器环境中
 */
const isInEditor = editor.isIn;

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
    // VSCode 环境使用原有的 readline 实现
    // if (isInEditor) {
    //     return createCommandReadlineOrigin(commands, options);
    // }
    // // 非 VSCode 环境使用新的交互式命令选择器
    // return createInteractiveSelector(commands, options);
    return createCommandReadlineOrigin(commands, options);
}

/**
 * 原有 readline 实现（VSCode 环境）
 */
function createCommandReadlineOrigin(commands: ReadlineCommand[], options: CommandReadlineOptions = {}): Promise<void> {
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

/**
 * 新的交互式命令选择器（非 VSCode 环境）
 */
function createInteractiveSelector(commands: ReadlineCommand[], options: CommandReadlineOptions = {}): Promise<void> {
    const prompt = options.prompt ?? '> ';
    const exitCommand = options.exitCommand ?? 'exit';

    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    const commandMap = new Map<string, ReadlineCommand>();
    for (const cmd of commands) {
        commandMap.set(cmd.name, cmd);
    }

    let input = '';
    let selectedIndex = 0;
    let prevLastLine = 1;

    const display = () => {
        const filtered = filterCommands(input, commandMap);

        // 清除画布区域（从第1行到上次最后一行），然后重绘
        // \x1b[1;1H 移动到第1行第1列，\x1b[J 清除到屏幕结尾
        process.stdout.write('\x1b[1;1H\x1b[J');

        // 输出所有内容
        process.stdout.write('=== 命令选择器 ===\n\n');
        process.stdout.write(prompt + input);

        // 匹配命令区域
        if (input.startsWith('/')) {
            process.stdout.write('\n\n匹配命令:\n');
            if (filtered.length === 0) {
                process.stdout.write('  (无匹配)\n');
            } else {
                filtered.forEach((cmd, index) => {
                    if (index === selectedIndex) {
                        process.stdout.write(`  ${chalk.bgCyan.black('▶ ' + cmd.name)} - ${cmd.description}\n`);
                    } else {
                        process.stdout.write(`    ${cmd.name} - ${cmd.description}\n`);
                    }
                });
            }
        }

        process.stdout.write('\n按 Enter 执行，↑↓ 切换，Ctrl+C 退出');

        // 计算本次画布内容的最后一行行号，用于下次清除
        // 画布结构：标题2行 + 空行1行 + 输入行1行 + 匹配区(0-5行) + 空行1行 + 提示1行
        const matchLines = input.startsWith('/') ? (filtered.length > 0 ? filtered.length + 2 : 1) : 0;
        prevLastLine = 2 + 1 + 1 + matchLines + 1; // = 5 + matchLines

        // 将光标移动到输入行的末尾（第3行）
        process.stdout.write(`\x1b[3;${prompt.length + input.length + 3}H`);
    };

    display();

    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            console.log('\n退出命令选择器');
            process.exit(0);
        }

        if (key.name === 'return') {
            const filtered = filterCommands(input, commandMap);
            if (filtered.length > 0 && selectedIndex < filtered.length) {
                const selected = filtered[selectedIndex];
                process.stdout.write('\x1b[2J\x1b[H');
                const parsed = parseSlashCommand('/' + selected.name);
                if (parsed) {
                    void selected.handler(parsed.args, {
                        rl: null as unknown as readline.Interface,
                        line: '/' + selected.name,
                    });
                }
                process.exit(0);
            } else if (input.startsWith('/')) {
                console.log('未找到匹配命令，请重试');
                setTimeout(() => display(), 500);
            }
            return;
        }

        // 上下箭头切换选中项
        const filtered = filterCommands(input, commandMap);
        if (key.name === 'up') {
            if (filtered.length > 0) {
                selectedIndex = selectedIndex <= 0 ? filtered.length - 1 : selectedIndex - 1;
                display();
            }
            return;
        }
        if (key.name === 'down') {
            if (filtered.length > 0) {
                selectedIndex = selectedIndex >= filtered.length - 1 ? 0 : selectedIndex + 1;
                display();
            }
            return;
        }

        if (key.name === 'backspace') {
            input = input.slice(0, -1);
            selectedIndex = 0;
            display();
            return;
        }

        if (str) {
            input += str;
            selectedIndex = 0;
            display();
        }
    });

    return new Promise((resolve) => {
        // 该实现使用 process.exit 退出，此 Promise 不会 resolve
    });
}

/**
 * 根据输入过滤命令
 * @param input - 用户输入
 * @param commandMap - 命令映射表
 * @returns 匹配的命令列表
 */
function filterCommands(input: string, commandMap: Map<string, ReadlineCommand>): ReadlineCommand[] {
    if (!input.startsWith('/')) {
        return [];
    }
    const query = input.slice(1).toLowerCase();
    if (!query) {
        return Array.from(commandMap.values());
    }
    return Array.from(commandMap.values()).filter((cmd) => cmd.name.toLowerCase().includes(query));
}
