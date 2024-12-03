import JSONClass, { type Options } from '@/service/json';
import { generateHelpDoc } from '@/common/helper';

function generateHelp() {
    generateHelpDoc({
        title: 'json',
        content: `暂无数据`,
    });
}

export default (data: string[], options: Options) => {
    if (options.help) {
        generateHelp();
        return;
    }
    new JSONClass().main(data, options);
};
