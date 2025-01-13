import Push from '@/service/git/push';
import { subCommandCompiler } from '@/common/helper';
export default async () => {
    subCommandCompiler((program) => {
        program
            .command('push')
            .option('--force', '远端没有分支的时候首次强行推送')
            .action(() => {
                new Push().main();
            });
    });
};
