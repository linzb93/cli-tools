import { DeployService, type Options as DeployOptions } from '@cli-tools/shared/business/git/deploy';
import { subCommandCompiler } from '@/utils';

/**
 * git deploy 子命令的实现
 */
export const deployCommand = () => {
    subCommandCompiler((program) => {
        program
            .command('deploy')
            .description('一次性完成git代码提交、拉取、推送等功能')
            .option('--prod', '是否发布到master或main分支')
            .option('--type <type>', '项目类型，用于标记tag')
            .option('--version <version>', '项目版本号，用于标记tag')
            .option('--open', '是否打开对应的jenkins主页')
            .option('-c, --current', '仅完成基础命令后结束任务')
            .option('--msg', '是否复制提交消息到剪贴板')
            .option('--commit [message]', 'git commit提交信息')
            .action((options: DeployOptions) => {
                new DeployService().main(options);
            });
    });
};
