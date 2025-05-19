import { type Options } from '@/core/ai/shared/types';
import { isOldNode } from '@/utils/helper';
import { logger } from '@/utils/logger';
import { subCommandCompiler } from '@/utils/helper';
import OCR from '@/core/ai/ocr/index';
import Regex from '@/core/ai/regex';
/**
 * OCR子命令
 */
const ocr = () => {
    subCommandCompiler((program) => {
        program
            .command('ocr')
            .description('图像识别工具')
            .option('--ask', '是否继续提问')
            .option('--eng', '是否翻译')
            .action((options: Options) => {
                if (isOldNode) {
                    logger.error('请使用node18+版本');
                    return;
                }
                new OCR().main(options);
            });
    });
};

/**
 * 正则表达式解析子命令
 */
const regex = () => {
    subCommandCompiler((program) => {
        program
            .command('regex <pattern>')
            .description('正则表达式解析工具')
            .action((pattern: string, options: Options) => {
                if (isOldNode) {
                    logger.error('请使用node18+版本');
                    return;
                }
                new Regex().main(pattern, options);
            });
    });
};

/**
 * AI命令入口函数
 * @param subCommand 子命令名称
 * @param rest 其余参数
 * @param options 命令选项
 */
export default function (subCommand: string, rest: string[], options: any): void {
    // 子命令映射表
    const commandMap: Record<string, () => void> = {
        ocr,
        regex,
    };

    // 执行对应的子命令
    if (commandMap[subCommand]) {
        commandMap[subCommand]();
    } else {
        logger.error(`未知的 ai 子命令: ${subCommand}`);
        logger.info('可用的子命令: ' + Object.keys(commandMap).join(', '));
    }
}
