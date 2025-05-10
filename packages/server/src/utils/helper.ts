import { Command } from 'commander';
/**
 * 注册子命令
 * @param fn
 * @param options
 */
export const subCommandCompiler = (fn: (cmd: Command) => void) => {
    const program = new Command();
    fn(program);
    program.parse(process.argv.filter((item, index) => index !== 2 && item !== '--debug'));
};
