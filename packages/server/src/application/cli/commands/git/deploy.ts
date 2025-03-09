import Deploy, { Options } from '@/service/git/deploy';
import { subCommandCompiler } from '@/common/helper';

export default () => {
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
            .action((options: Options) => {
                new Deploy().main(options);
            });
    });
};
