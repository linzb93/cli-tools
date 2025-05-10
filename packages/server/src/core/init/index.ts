// import dayjs from 'dayjs';
import fs from 'fs-extra';
import { logger } from '@/utils/logger';
import { Command } from 'commander';
// import Server from "@/service/server";
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
    await sleep(100);
    // const lastModifiedTime = await sql((db) => db.lastModifiedTime);
    // if (Math.abs(dayjs().diff(lastModifiedTime, 'd')) < 1) {
    //     return;
    // }
    // await sql((db) => {
    //     db.lastModifiedTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    // });
    // 清空缓存目录
    await fs.emptyDir(tempPath);

    // new Server().main();
};
