import { Command } from 'commander';

interface Options {
    level: number;
}
/**
 * 注册子命令
 * @param {Function} fn 子命令函数
 */
export const subCommandCompiler = (fn: (cmd: Command) => void, options: Options = { level: 2 }) => {
    if (options.level < 2) {
        throw new Error('不能设置level小于2');
    }
    const program = new Command();
    fn(program);
    program.parse(
        process.argv.filter((item, index) => {
            if (options.level === 2) {
                return item !== '--debug' && index !== 2;
            }
            return index > 2 && index <= options.level && item !== '--debug';
        }),
    );
};
