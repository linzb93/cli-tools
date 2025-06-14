import fs from 'fs-extra';
import { logger } from '@/utils/logger';
import { Command } from 'commander';
import Server from '@/core/server';
import dayjs from 'dayjs';
import sql from '@/utils/sql';
import { isWin, tempPath } from '@/utils/constant';
import { sleep } from '@linzb93/utils';

export default async (command: Command) => {
    if (!isWin) {
        // 家里电脑不需要执行下面这段代码
        return;
    }
    // 记录每次使用的命令
    logger.cli(command.args.join(' '));
    // 获取上次启动服务器的日期
    const lastServerStartDate = await sql((db) => db.lastServerStartDate);
    const today = dayjs().format('YYYY-MM-DD');

    // 检查今天是否已经启动过服务器
    if (lastServerStartDate !== today) {
        // 更新最后启动日期
        await sql((db) => {
            db.lastServerStartDate = today;
        });

        // 启动服务器
        console.log('今日首次运行命令，正在启动服务器...');
        const serverInstance = new Server();
        await serverInstance.main();

        // 等待服务器启动完成
        await sleep(1000);
    }

    // 清空缓存目录
    await fs.emptyDir(tempPath);
};
