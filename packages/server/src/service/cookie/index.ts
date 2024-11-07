import clipboardy from 'clipboardy';
import BaseCommand from '@/common/BaseCommand';
export interface Options {
    help?: boolean;
    type: 'key' | 'json';
    copy: boolean;
}

export default class extends BaseCommand {
    async main(data: string, options: Options) {
        const list = data.split(';');
        const keys = [];
        const objs = [];
        list.forEach((item) => {
            const seg = item.split('=');
            const key = seg[0].replace(/^ /, '');
            objs.push({
                key,
                value: seg[1],
            });
        });
        let result = '';
        if (options.type === 'key') {
            result = Array.from(new Set(objs.map((item) => item.key))).join(',');
        } else if (options.type === 'json') {
            // result = JSON.stringify(Array.from(new Set(keys)).reduce((acc, key) => {
            //     return {
            //         ...acc,
            //         [key]:
            //     };
            // }, {}));
        }
        if (options.copy) {
            clipboardy.writeSync(result);
        }
        this.logger.success('解析并复制成功');
    }
}
