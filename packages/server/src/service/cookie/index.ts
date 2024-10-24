import clipboardy from 'clipboardy';
import BaseCommand from '@/common/BaseCommand';
export interface Options {
    help?: boolean;
}

export default class extends BaseCommand {
    async main(data: string, options: Options) {
        const list = data.split(';');
        const keys = [];
        list.forEach((item) => {
            const key = item.split('=')[0];
            keys.push(key);
        });
        clipboardy.writeSync(
            Array.from(new Set(keys))
                .map((key) => `'${key}'`)
                .join(',')
        );
        this.logger.success('解析并复制成功');
    }
}
