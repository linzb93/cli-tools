import BaseManager from '../BaseManager';
import CodeAnalyse from './code';
import CliAnalyse from './cli';

/**
 * 分析命令选项接口
 */
export interface Options {
    // 命令选项
}

/**
 * 分析命令类
 */
export default class extends BaseManager {
    /**
     * 主方法
     * @param subCommand 子命令
     * @param options 选项
     */
    async main(subCommand: string, options: Options) {
        if (subCommand === 'cli') {
            await new CliAnalyse().main();
            return;
        }

        await new CodeAnalyse().main();
    }
}
