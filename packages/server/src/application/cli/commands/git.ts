import Clone, { type Options as CloneOptions } from '@/service/git/clone';
import Deploy, { type Options as DeployOptions } from '@/service/git/deploy';
import Tag, { type Options as TagOptions } from '@/service/git/tag';
import Branch, { type Options as BranchOptions } from '@/service/git/branch';

import Push from '@/service/git/push';

import { subCommandCompiler } from '@/common/helper';
import Rename from '@/service/git/rename';
import Scan from '@/service/git/scan';
import Pull from '@/service/git/pull';

const clone = () => {
    subCommandCompiler((program) => {
        program
            .command('clone')
            .option('--dir <dir>', '选择安装的目录')
            .option('--from <src>', '来源')
            .option('--open', '在VSCode中打开项目')
            .action((options: CloneOptions) => {
                new Clone().main([], options);
            });
    });
};
const pull = () => {
    new Pull().main();
};
const push = () => {
    new Push().main();
};
const rename = () => {
    new Rename().main();
};
const tag = () => {
    subCommandCompiler((program) => {
        program
            .command('tag [tagName]')
            .option('--delete', '删除tag')
            .option('--sync', '同步tag')
            .option('--last <len>', '最近几次')
            .option('--head <len>', '前面几个')
            .option('-g, --get', '获取')
            .action((datas, options: TagOptions) => {
                new Tag().main(datas, options);
            });
    });
};
const deploy = () => {
    subCommandCompiler((program) => {
        program
            .command('deploy')
            .option('--commit <msg>', '提交信息')
            .option('--tag <name>', 'tag名称')
            .option('-c, --current', '当前的')
            .option('--help', '显示帮助文档')
            .option('--prod', '生产分支')
            .option('--open', '打开页面')
            .option('--type <typename>', '部署应用类型')
            .action((options: DeployOptions) => {
                new Deploy().main(options);
            });
    });
};
const scan = () => {
    new Scan().main();
};
const branch = () => {
    subCommandCompiler((program) => {
        program
            .command('branch')
            .option('--type <type>', '类型')
            .option('-d, --delete', '删除')
            .option('--key <keyword>', '关键字')
            .action((options: BranchOptions) => {
                new Branch().main(options);
            });
    });
};

export default function (subCommand: string, data: string[], options: any) {
    const commandMap = {
        clone,
        deploy,
        pull,
        push,
        scan,
        branch,
        rename,
        tag,
    };
    if (commandMap[subCommand]) {
        commandMap[subCommand]();
    }
}
