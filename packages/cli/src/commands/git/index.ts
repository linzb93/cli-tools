import { PushService } from '@cli-tools/shared/src/business/git/push';
import { PullService, type Options as PullOptions } from '@cli-tools/shared/src/business/git/pull';
import { TagService, type Options as TagOptions } from '@cli-tools/shared/src/business/git/tag';
import { DeployService, type Options as DeployOptions } from '@cli-tools/shared/src/business/git/deploy';
import { BranchService, type Options as BranchOptions } from '@cli-tools/shared/src/business/git/branch';
import { MergeService, type Options as MergeOptions } from '@cli-tools/shared/src/business/git/merge';
import { LogService, type Options as LogOptions } from '@cli-tools/shared/src/business/git/log';
import { CommitService, type Options as CommitOptions } from '@cli-tools/shared/src/business/git/commit';
import { ScanService, type Options as ScanOptions } from '@cli-tools/shared/src/business/git/scan';
import { CloneService, type Options as CloneOptions } from '@cli-tools/shared/src/business/git/clone';
import { VersionService } from '@cli-tools/shared/src/business/git/version';
import { subCommandCompiler } from '@/utils';

/**
 * git push 子命令的实现
 */
const push = () => {
    subCommandCompiler((program) => {
        program
            .command('push')
            .description('将本地分支推送到远程仓库')
            .action(() => {
                new PushService().main();
            });
    });
};

/**
 * git pull 子命令的实现
 */
const pull = () => {
    subCommandCompiler((program) => {
        program
            .command('pull')
            .description('从远程仓库拉取最新代码')
            .action((options: PullOptions) => {
                new PullService().main(options);
            });
    });
};
const commit = () => {
    subCommandCompiler((program) => {
        program
            .command('commit <data>')
            .description('提交Git代码')
            .option('--path <path>', '指定要提交的文件路径，默认当前目录')
            .action((data: string, options: CommitOptions) => {
                new CommitService().main(data, options);
            });
    });
};

/**
 * git tag 子命令的实现
 */
const tag = () => {
    subCommandCompiler((program) => {
        program
            .command('tag [subCommand]')
            .description('管理Git标签')
            .option('--version <version>', '设置版本号')
            .option('--type <type>', '设置标签类型前缀，默认为v')
            .option('--msg', '是否复制提交消息到剪贴板')
            .action((subCommand: string, options: TagOptions) => {
                new TagService().main(subCommand, options);
            });
    });
};

/**
 * git deploy 子命令的实现
 */
const deploy = () => {
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

/**
 * git branch 子命令的实现
 */
const branch = () => {
    subCommandCompiler((program) => {
        program
            .command('branch')
            .description('管理Git分支')
            .option('-d, --delete', '删除分支')
            .action((options: BranchOptions) => {
                new BranchService().main(options);
            });
    });
};

/**
 * git scan 子命令的实现
 */
const scan = () => {
    subCommandCompiler((program) => {
        program
            .command('scan')
            .description('扫描Git分支')
            .option('--full', '是否全量扫描')
            .action((options: ScanOptions) => {
                new ScanService().main(options);
            });
    });
};

/*
 * git merge 子命令的实现
 */
const merge = () => {
    subCommandCompiler((program) => {
        program
            .command('merge')
            .description('合并最近的提交')
            .option('--head <number>', '合并最近的几个提交，默认合并最近3个')
            .action((options: MergeOptions) => {
                new MergeService().main(options);
            });
    });
};

/**
 * git log 子命令的实现
 */
const log = () => {
    subCommandCompiler((program) => {
        program
            .command('log')
            .description('查看Git提交日志')
            .option('--head <number>', '查看最近的几个提交，默认查看最近3个')
            .option('--path <path>', '指定查看的文件目录')
            .action((options: LogOptions) => {
                new LogService().main(options);
            });
    });
};
/**
 * git clone 子命令的实现
 */
const clone = () => {
    subCommandCompiler((program) => {
        program
            .command('clone <repo>')
            .description('克隆远程仓库')
            .option('--dir <dir>', '指定目标目录')
            .action((repo: string, options: CloneOptions) => {
                new CloneService().main({ repo, dir: options.dir });
            });
    });
};
/**
 * git version 子命令的实现
 */
const version = () => {
    subCommandCompiler((program) => {
        program
            .command('version [newVersion]')
            .description('创建新版本分支并更新版本号')
            .action((newVersion: string) => {
                new VersionService().main(newVersion);
            });
    });
};

/**
 * git 命令入口函数
 * @param {string} subCommand - 子命令名称
 * @param {string[]} data - 子命令参数
 * @param {any} options - 命令选项
 */
export const gitCommand = function (subCommand: string, data: string[], options: any): void {
    // 子命令映射表
    const commandMap: Record<string, () => void> = {
        push,
        pull,
        commit,
        tag,
        deploy,
        branch,
        scan,
        merge,
        log,
        version,
    };

    // 执行对应的子命令
    if (commandMap[subCommand]) {
        commandMap[subCommand]();
    } else {
        console.log(`未知的 git 子命令: ${subCommand}`);
        console.log('可用的子命令: ' + Object.keys(commandMap).join(', '));
    }
};
