import Tag, { Options } from '@/service/git/tag';
import { subCommandCompiler } from '@/common/helper';

export default function () {
    subCommandCompiler((program) => {
        program
            .command('tag [tagName]')
            .option('--delete', '删除tag')
            .option('--sync', '同步tag')
            .option('--last <len>', '最近几次')
            .option('--head <len>', '前面几个')
            .option('-g, --get', '获取')
            .action((datas, options: Options) => {
                new Tag().main(datas, options);
            });
    });
}
