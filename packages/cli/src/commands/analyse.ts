import Analyse from '@cli-tools/shared/src/core/analyse';
import { subCommandCompiler } from '@/utils';

/**
 * 分析命令选项接口
 */
interface Options {
    // 命令选项
}

/**
 * 命令行分析
 */
const cli = () => {
    subCommandCompiler((program) => {
        program.command('cli').action((options: Options) => {
            new Analyse().main('cli', options);
        });
    });
};

/**
 * 代码分析
 */
const code = () => {
    subCommandCompiler((program) => {
        program.command('code').action((options: Options) => {
            new Analyse().main('code', options);
        });
    });
};

/**
 * 分析命令入口
 * @param subCommand 子命令
 * @param data 数据
 * @param options 选项
 */
export function analyseCommand(subCommand: string, data: string[], options: any) {
    const commandMap = {
        cli,
        code,
    };

    // 如果没有指定子命令或者子命令不存在，默认执行code命令
    if (!subCommand || !commandMap[subCommand]) {
        new Analyse().main('', options);
        return;
    }

    commandMap[subCommand]();
}
