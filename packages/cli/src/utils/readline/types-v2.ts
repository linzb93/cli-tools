import type { Interface } from 'node:readline';

/**
 * 命令处理器类型
 * @param args - 解析后的命令参数
 */
export type CommandHandlerV2 = (args: string[]) => void | Promise<void | boolean>;

/**
 * Readline 工具方法
 */
export interface ReadlineUtils {
    /** 关闭 readline 界面 */
    close: () => void;
    /** 重新显示命令列表 */
    displayCommands: () => void;
}

/**
 * 已解析的命令模式
 */
export interface ParsedPattern {
    /** 命令名称 */
    name: string;
    /** 必需参数列表 */
    requiredArgs: string[];
    /** 可选参数列表 */
    optionalArgs: string[];
}

/**
 * 已注册的命令
 */
export interface RegisteredCommand {
    /** 解析后的模式 */
    pattern: ParsedPattern;
    /** 命令描述 */
    description?: string;
    /** 命令处理器 */
    handler: CommandHandlerV2;
}

/**
 * 命令构建器接口（链式 API）
 */
export interface CommandBuilder {
    /** 设置命令描述 */
    description(desc: string): CommandBuilder;
    /** 设置命令处理器并完成注册 */
    action(handler: CommandHandlerV2): void;
}

/**
 * Readline 程序接口
 */
export interface ReadlineProgram {
    /**
     * 注册命令
     * @param usage - 命令用法，如 '/diff <x> <message>' 或 '/commit <message>'
     */
    command(usage: string): CommandBuilder;
    /** 工具方法（从 start() 返回后可用） */
    utils: ReadlineUtils;
    /** 启动 readline 界面 */
    start(): Promise<void>;
}

/**
 * CreateReadline 选项
 */
export interface CreateReadlineOptions {
    /** 提示符 */
    prompt?: string;
    /** 退出命令名 */
    exitCommand?: string;
    /** 项目列表（可选） */
    items?: unknown[];
    /** 命令执行完成后的回调 */
    onComplete?: (ctx: { rl: Interface; command: string }) => void | Promise<void>;
}
