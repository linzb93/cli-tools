import type { Interface } from 'node:readline';

export interface ReadlineCommandContext {
    rl: Interface;
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
    handler: (
        args: string[],
        item: any,
        utils: {
            close: Function;
            displayCommands: Function;
        },
    ) => void | Promise<boolean | void>;
}

export interface CommandCompleteContext {
    rl: Interface;
    command: string;
}

export type CommandCompleteCallback = (ctx: CommandCompleteContext) => void | Promise<void>;

export interface CommandReadlineOptions {
    prompt?: string;
    exitCommand?: string;
    /** 项目列表（可选），传入后命令上下文中会自动包含 getItem 方法 */
    items?: unknown[];
    /** 命令执行完成后的回调（除 exit 外） */
    onComplete?: CommandCompleteCallback;
}

export interface ParsedSlashCommand {
    command: string;
    args: string[];
}
