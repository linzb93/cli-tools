import fs from 'fs-extra';
import { logger } from '@/utils/logger';
import { Command } from 'commander';
import { isWin, tempPath } from '@cli-tools/shared';

export default async (command: Command) => {
    if (!isWin) {
        // 家里电脑不需要执行下面这段代码
        return;
    }
    // 记录每次使用的命令
    logger.cli(command.args.join(' '));

    // 清空缓存目录
    await fs.emptyDir(tempPath);
};
