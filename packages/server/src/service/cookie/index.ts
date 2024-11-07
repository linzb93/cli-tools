import clipboardy from 'clipboardy';
import { format } from 'prettier';
import BaseCommand from '@/common/BaseCommand';

export interface Options {
    help?: boolean;
    type: 'key' | 'json';
    copy: boolean;
}

export default class extends BaseCommand {
    async main(data: string, options: Options) {
        const list = data.split(';');
        const objs = list.reduce((acc, item) => {
            const seg = item.split('=');
            return {
                ...acc,
                [seg[0].replace(/^\s/, '')]: seg[1],
            };
        }, {});
        let result = options.type === 'key' ? Object.keys(objs) : objs;
        console.log(result);
        if (options.copy) {
            clipboardy.writeSync(this.getValue(result));
            this.logger.success('解析并复制成功');
        }
    }
    private getValue(data: any): string {
        if (Array.isArray(data)) {
            return data.join(',');
        }
        return format(JSON.stringify(data), {
            parser: 'json',
        });
    }
}
