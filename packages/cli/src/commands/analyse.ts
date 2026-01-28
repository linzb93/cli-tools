import { CliAnalyseService, CodeAnalyseService } from '@cli-tools/shared/src/business/analyse';
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
        program.command('cli').action(() => {
            new CliAnalyseService().main();
        });
    });
};

/**
 * 代码分析
 */
const code = () => {
    subCommandCompiler((program) => {
        program.command('code').action(() => {
            new CodeAnalyseService().main();
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

    commandMap[subCommand]();
}
