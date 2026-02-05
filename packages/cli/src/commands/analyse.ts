import { CliAnalyseService, CodeAnalyseService, CliAnalyseOptions } from '@cli-tools/shared/business/analyse';
import { subCommandCompiler } from '@/utils';

/**
 * 分析命令选项接口
 */
interface Options {
    period?: 'day' | 'week' | 'month' | 'all';
}

/**
 * 命令行分析
 */
const cli = (options: Options) => {
    subCommandCompiler((program) => {
        program
            .command('cli')
            .option('-p, --period <period>', '时间周期 (day|week|month|all)', 'all')
            .action((cmdOptions) => {
                const cliOptions: CliAnalyseOptions = {
                    period: cmdOptions.period || options.period || 'all',
                };
                new CliAnalyseService(cliOptions).main();
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
export function analyseCommand(subCommand: string, data: string[], options: Options) {
    const commandMap = {
        cli,
        code,
    };

    commandMap[subCommand](options);
}
