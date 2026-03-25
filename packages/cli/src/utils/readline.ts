import readline from 'node:readline';
import chalk from 'chalk';

export interface ReadlineCommandContext {
    rl: readline.Interface;
    line: string;
}

export interface ReadlineCommand {
    name: string;
    description?: string;
    usage?: string;
    handler: (args: string[], ctx: ReadlineCommandContext) => void | Promise<void>;
}

export interface CommandReadlineOptions {
    prompt?: string;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    terminal?: boolean;
    exitCommand?: string;
}

export interface ParsedSlashCommand {
    command: string;
    args: string[];
}

/** 指令联想项 */
export interface AutocompleteItem {
    command: string;
    description?: string;
    usage?: string;
}

/** 联想菜单状态 */
interface AutocompleteMenuState {
    active: boolean;
    items: AutocompleteItem[];
    selected: number;
    startIndex: number;
    filter: string;
    cursorPos: number;
    lineBuffer: string;
    output: NodeJS.WritableStream;
}

const MENU_HEIGHT = 10; // 菜单最大可见项数

/**
 * 解析形如 `/diff 1` 的命令行输入
 * @param line - 用户输入的一行文本
 * @returns 解析结果；非 slash 命令返回 null
 * @example
 * const out = parseSlashCommand('/diff 1');
 * // out?.command === 'diff'
 * // out?.args[0] === '1'
 */
export function parseSlashCommand(line: string): ParsedSlashCommand | null {
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

/**
 * 根据过滤字符串从命令列表中筛选匹配项
 * @param commands - 全部命令列表
 * @param filter - 过滤字符串（不含 /）
 */
function filterCommands(commands: ReadlineCommand[], filter: string): AutocompleteItem[] {
    if (!filter) {
        return commands.map((cmd) => ({
            command: cmd.name,
            description: cmd.description,
            usage: cmd.usage,
        }));
    }
    const lowerFilter = filter.toLowerCase();
    return commands
        .filter((cmd) => cmd.name.toLowerCase().startsWith(lowerFilter))
        .map((cmd) => ({
            command: cmd.name,
            description: cmd.description,
            usage: cmd.usage,
        }));
}

/** 清除菜单显示区域（多行清除） */
function clearMenu(state: AutocompleteMenuState): void {
    const { output, items } = state;
    const lineCount = Math.min(items.length, MENU_HEIGHT) + 1; // 1行提示 + 菜单项

    for (let i = 0; i < lineCount; i++) {
        output.write('\r'); // 回车到行首
        output.write('\x1b[K'); // 清除到行尾
        if (i < lineCount - 1) {
            output.write('\x1b[B'); // 下移一行
        }
    }
    // 移回起点
    output.write('\x1b[' + lineCount + 'A');
}

/** 绘制菜单 */
function drawMenu(state: AutocompleteMenuState): void {
    const { output, items, selected, startIndex } = state;
    const visibleItems = items.slice(startIndex, startIndex + MENU_HEIGHT);

    // 绘制提示行
    output.write('\r');
    output.write('\x1b[K');
    output.write(chalk.gray('  （↑↓选择，Enter执行，Tab补全，ESC取消）'));

    // 绘制每个菜单项
    for (let i = 0; i < MENU_HEIGHT; i++) {
        output.write('\x1b[B'); // 下移一行
        output.write('\r'); // 回车到行首
        output.write('\x1b[K'); // 清除行尾

        const item = visibleItems[i];
        if (item) {
            const idx = startIndex + i;
            const isSelected = idx === selected;
            const prefix = isSelected ? chalk.green('▶ ') : '  ';
            const usage = item.usage ? ` ${item.usage}` : '';
            const desc = item.description ? ` - ${item.description}` : '';
            output.write(prefix + chalk.yellow(`/${item.command}${usage}`) + chalk.gray(desc));
        }
    }

    // 将光标移回输入行（向上移动 MENU_HEIGHT + 1 行）
    output.write('\x1b[' + (MENU_HEIGHT + 1) + 'A');
}

/** 初始化菜单状态 */
function createMenuState(commands: ReadlineCommand[], output: NodeJS.WritableStream): AutocompleteMenuState {
    return {
        active: false,
        items: filterCommands(commands, ''),
        selected: 0,
        startIndex: 0,
        filter: '',
        cursorPos: 0,
        lineBuffer: '',
        output,
    };
}

/**
 * 创建支持指令联想的交互式 readline
 * - 输入 / 弹出命令下拉菜单
 * - 输入字母实时过滤
 * - 方向键选择，Enter 执行，Tab 补全，ESC 取消
 * @param commands - 需要注册的命令列表
 * @param options - readline 选项
 * @returns 当 readline 关闭时 resolve
 */
export async function createAutocompleteReadline(
    commands: ReadlineCommand[],
    options: CommandReadlineOptions = {},
): Promise<void> {
    const prompt = options.prompt ?? '> ';
    const exitCommand = options.exitCommand ?? 'exit';
    const output = options.output ?? process.stdout;

    const commandMap = new Map<string, ReadlineCommand>();
    for (const cmd of commands) {
        commandMap.set(cmd.name, cmd);
    }

    // 显示帮助信息
    console.log(chalk.gray('输入 / 触发指令联想...'));

    const rl = readline.createInterface({
        input: options.input ?? process.stdin,
        output,
        terminal: false, // 使用非终端模式，自己控制所有输出
    });

    const ctxBase = { rl } as Pick<ReadlineCommandContext, 'rl'>;

    // 当前输入缓冲
    let lineBuffer = '';
    let menuActive = false;
    let menuSelected = 0;
    let menuStartIndex = 0;
    let menuFilter = '';
    const menuItems = filterCommands(commands, '');

    // 显示输入行
    const showInputLine = (): void => {
        output.write('\r'); // 回车到行首
        output.write('\x1b[K'); // 清除到行尾
        output.write(chalk.cyan(prompt) + lineBuffer);
    };

    // 绘制菜单
    const drawCurrentMenu = (): void => {
        if (!menuActive || menuItems.length === 0) return;

        // 先显示输入行
        showInputLine();

        // 换行后绘制菜单
        output.write('\n');

        // 绘制提示行
        output.write('\r');
        output.write('\x1b[K');
        output.write(chalk.gray('  （↑↓选择，Enter执行，Tab补全，ESC取消）'));

        // 绘制每个菜单项
        for (let i = 0; i < MENU_HEIGHT; i++) {
            output.write('\n');
            output.write('\r');
            output.write('\x1b[K');

            const item = menuItems[menuStartIndex + i];
            if (item) {
                const isSelected = menuStartIndex + i === menuSelected;
                const prefix = isSelected ? chalk.green('▶ ') : '  ';
                const usage = item.usage ? ` ${item.usage}` : '';
                const desc = item.description ? ` - ${item.description}` : '';
                output.write(prefix + chalk.yellow(`/${item.command}${usage}`) + chalk.gray(desc));
            }
        }

        // 将光标移回输入行位置
        // 向上移动 (MENU_HEIGHT + 1) 行回到输入行
        for (let i = 0; i < MENU_HEIGHT + 1; i++) {
            output.write('\x1b[A');
        }
        // 移到行首
        output.write('\r');
        // 清除已显示的输入行内容（准备重新显示）
        output.write('\x1b[K');
    };

    // 清除菜单
    const clearCurrentMenu = (): void => {
        if (!menuActive) return;

        // 移动到菜单区域，清除所有行
        // 先回到行首
        output.write('\r');
        for (let i = 0; i < MENU_HEIGHT + 1; i++) {
            output.write('\x1b[B'); // 下移一行
        }
        // 现在在菜单底部下方，开始清除
        for (let i = 0; i < MENU_HEIGHT + 1; i++) {
            output.write('\r');
            output.write('\x1b[K');
            if (i < MENU_HEIGHT) {
                output.write('\x1b[A'); // 上移一行
            }
        }
        // 回到输入行
        output.write('\r');
    };

    // 关闭菜单并刷新输入行
    const closeMenu = (): void => {
        if (menuActive) {
            menuActive = false;
            clearCurrentMenu();
            showInputLine();
        }
    };

    // 打开菜单
    const openMenu = (): void => {
        menuActive = true;
        menuSelected = 0;
        menuStartIndex = 0;
        menuItems.length = 0;
        menuItems.push(...filterCommands(commands, menuFilter));
        if (menuSelected >= menuItems.length) {
            menuSelected = Math.max(0, menuItems.length - 1);
        }
        showInputLine();
        drawCurrentMenu();
    };

    // 刷新菜单（不清除屏幕）
    const refreshMenu = (): void => {
        if (menuActive) {
            menuItems.length = 0;
            menuItems.push(...filterCommands(commands, menuFilter));
            if (menuSelected >= menuItems.length) {
                menuSelected = Math.max(0, menuItems.length - 1);
            }
            clearCurrentMenu();
            showInputLine();
            drawCurrentMenu();
        }
    };

    // 移动选择
    const moveSelection = (delta: number): void => {
        if (!menuActive || menuItems.length === 0) return;
        const newSelected = menuSelected + delta;
        if (newSelected < 0 || newSelected >= menuItems.length) return;

        menuSelected = newSelected;
        if (menuSelected < menuStartIndex) {
            menuStartIndex = menuSelected;
        } else if (menuSelected >= menuStartIndex + MENU_HEIGHT) {
            menuStartIndex = menuSelected - MENU_HEIGHT + 1;
        }
        clearCurrentMenu();
        showInputLine();
        drawCurrentMenu();
    };

    // 补全命令
    const completeCommand = (): void => {
        if (!menuActive || menuItems.length === 0) return;
        const selectedItem = menuItems[menuSelected];
        if (selectedItem) {
            lineBuffer = '/' + selectedItem.command + ' ';
            menuActive = false;
            clearCurrentMenu();
            showInputLine();
        }
    };

    // 执行命令
    const executeCommand = async (line: string): Promise<void> => {
        const parsed = parseSlashCommand(line);
        if (!parsed) {
            showInputLine();
            return;
        }

        if (parsed.command === exitCommand) {
            if (menuActive) {
                closeMenu();
            }
            rl.close();
            return;
        }

        const cmd = commandMap.get(parsed.command);
        if (!cmd) {
            if (menuActive) {
                closeMenu();
            }
            console.log(chalk.red(`未知命令: /${parsed.command}`));
            showInputLine();
            return;
        }

        if (menuActive) {
            closeMenu();
        }
        try {
            await cmd.handler(parsed.args, { ...ctxBase, line });
        } catch (err) {
            console.log(chalk.red(`命令执行失败: /${cmd.name}`));
            console.log(String(err));
        }
        showInputLine();
    };

    // 初始显示
    showInputLine();

    // 监听所有按键
    rl.on('keypress', (chunk: string, key: readline.Key) => {
        if (!key) return;

        // ESC 键
        if (key.name === 'escape') {
            if (menuActive) {
                closeMenu();
            }
            return;
        }

        // Tab 键 - 补全
        if (key.name === 'tab') {
            if (menuActive) {
                completeCommand();
            }
            return;
        }

        // 方向键
        if (key.name === 'up') {
            moveSelection(-1);
            return;
        }
        if (key.name === 'down') {
            moveSelection(1);
            return;
        }

        // Enter 键
        if (key.name === 'enter') {
            if (menuActive && menuItems.length > 0) {
                const selectedItem = menuItems[menuSelected];
                if (selectedItem) {
                    lineBuffer = '/' + selectedItem.command + ' ';
                    menuActive = false;
                    clearCurrentMenu();
                    showInputLine();
                    return;
                }
            }
            // 实际执行命令
            const line = lineBuffer;
            lineBuffer = '';
            // 换行，执行命令
            output.write('\n');
            void executeCommand(line);
            return;
        }

        // 退格键
        if (key.name === 'backspace') {
            if (lineBuffer.length > 0) {
                lineBuffer = lineBuffer.slice(0, -1);
                // 更新过滤条件
                if (lineBuffer.startsWith('/')) {
                    menuFilter = lineBuffer.slice(1);
                    if (menuActive) {
                        refreshMenu();
                    }
                } else if (menuActive) {
                    closeMenu();
                }
                showInputLine();
            }
            return;
        }

        // Ctrl+C
        if (key.name === 'c' && key.ctrl) {
            if (menuActive) {
                closeMenu();
            }
            lineBuffer = '';
            output.write('\n');
            showInputLine();
            return;
        }

        // 其他可见字符
        if (chunk && chunk.length === 1 && !key.ctrl && !key.meta) {
            const char = chunk;
            lineBuffer += char;

            // 检查是否触发联想
            if (lineBuffer === '/') {
                menuFilter = '';
                openMenu();
            } else if (lineBuffer.startsWith('/')) {
                menuFilter = lineBuffer.slice(1);
                if (menuActive) {
                    refreshMenu();
                } else {
                    openMenu();
                }
            } else {
                showInputLine();
            }
        }
    });

    return new Promise((resolve) => {
        rl.on('close', () => {
            resolve();
        });
    });
}
