import { pushService } from '@/business/git/push';
import { subCommandCompiler } from '@/utils';

/**
 * git push 子命令的实现
 */
export const pushCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('push')
            .description('将本地分支推送到远程仓库')
            .action(() => {
                pushService();
            });
    });
};
