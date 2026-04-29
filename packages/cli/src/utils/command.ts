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
    const commands = process.argv.filter((item, index) => {
        if (options.level === 2) {
            return index !== 2;
        }
        return index < 2 || (index > 3 && index <= options.level + 1);
    });
    program.parse(commands);
};
/**
 * 将对象转换为命令行选项字符串数组
 * @param obj 一个键值对对象，键为选项名称，值为选项的值
 * @returns 返回一个字符串数组，每个元素代表一个命令行选项
 *
 * 此函数遍历对象的键，将键和值转换为命令行参数的形式
 * 如果值为布尔类型且为true，则只返回键名；否则返回键名加等号加值的形式
 * 这是为了适应某些命令行工具对参数的特定格式要求
 */
export const objectToCmdOptions = (obj: Record<string, any>) => {
    return Object.keys(obj)
        .map((key) => {
            // 当值为true时，生成只带选项名称的命令行参数
            if (obj[key] === true) {
                return `--${key}`;
            }
            if (obj[key] === false || obj[key] === undefined || obj[key] === null) {
                return '';
            }
            // 当值不为true时，生成带选项名称和值的命令行参数
            return `--${key}=${obj[key]}`;
        })
        .filter(Boolean);
};
