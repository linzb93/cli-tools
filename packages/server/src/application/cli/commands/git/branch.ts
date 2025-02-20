import Branch, { type Options } from '@/service/git/branch';
import { subCommandCompiler } from '@/common/helper';
export default async (options: Options) => {
    subCommandCompiler((program) => {
        program
            .command('branch')
            .option('--type <type>', '类型')
            .action((options: Options) => {
                new Branch().main(options);
            });
    });
};
