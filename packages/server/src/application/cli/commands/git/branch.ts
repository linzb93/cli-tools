import Branch, { type Options } from '@/service/git/branch';
import { subCommandCompiler } from '@/common/helper';
export default async () => {
    subCommandCompiler((program) => {
        program
            .command('branch')
            .option('--type <type>', '类型')
            .option('-d, --delete', '删除')
            .option('--key <keyword>', '关键字')
            .action((options: Options) => {
                new Branch().main(options);
            });
    });
};
