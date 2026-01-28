import { VersionService } from '@cli-tools/shared/src/business/git/version';
import { subCommandCompiler } from '@/utils';

/**
 * git version 子命令的实现
 */
export const versionCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('version [newVersion]')
            .description('创建新版本分支并更新版本号')
            .action((newVersion: string) => {
                new VersionService().main(newVersion);
            });
    });
};
