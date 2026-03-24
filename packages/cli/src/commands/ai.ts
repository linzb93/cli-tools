import { logger } from '@/utils/logger';

/**
 * AI命令入口函数
 * @param subCommand 子命令名称
 * @param rest 其余参数
 * @param options 命令选项
 */
export function aiCommand(subCommand: string, rest: string[], options: any): void {
    logger.error(`未知的 ai 子命令: ${subCommand}`);
    logger.info('可用的子命令: ocr');
}
