import clipboardy from 'clipboardy';
import { format } from 'prettier';
import BaseCommand from '../BaseCommand';

/**
 * Cookie 解析选项接口
 * @interface Options
 */
export interface Options {
    /**
     * 是否显示帮助信息
     * @default false
     */
    help?: boolean;

    /**
     * 解析类型：'key' 返回键名数组，'json' 返回键值对对象
     * @default 'json'
     */
    type: 'key' | 'json';

    /**
     * 是否复制解析结果到剪贴板
     * @default false
     */
    copy: boolean;
}

export default class extends BaseCommand {
    /**
     * 解析 Cookie 字符串
     * @param {string} data Cookie 字符串
     * @param {Options} options 解析选项
     * @returns {Promise<void>}
     */
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

    /**
     * 将解析结果转换为字符串
     * @param {any} data 解析结果数据
     * @returns {string} 格式化后的字符串
     * @private
     */
    private getValue(data: any): string {
        if (Array.isArray(data)) {
            return data.join(',');
        }
        return format(JSON.stringify(data), {
            parser: 'json',
        });
    }
}
