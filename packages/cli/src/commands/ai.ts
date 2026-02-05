import { isOldNode } from '@cli-tools/shared/utils/helper';
import { logger } from '@cli-tools/shared/utils/logger';
import { subCommandCompiler } from '@/utils';
import { OCRService, OCROptions, RegexService } from '@cli-tools/shared/business/ai/index';
/**
 * OCR子命令
 */
const ocr = () => {
    subCommandCompiler((program) => {
        program
            .command('ocr')
            .description('图像识别工具')
            .option('--url <url>', '图片线上地址')
            .action((options: OCROptions) => {
                if (isOldNode) {
                    logger.error('请使用node18+版本');
                    return;
                }
                new OCRService().main(options);
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
            .action((pattern: string) => {
                if (isOldNode) {
                    logger.error('请使用node18+版本');
                    return;
                }
                new RegexService().main(pattern);
            });
    });
};

/**
 * AI命令入口函数
 * @param subCommand 子命令名称
 * @param rest 其余参数
 * @param options 命令选项
 */
export function aiCommand(subCommand: string, rest: string[], options: any): void {
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
