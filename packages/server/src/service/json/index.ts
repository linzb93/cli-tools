/**
 * 传入单个json文件的地址，就复制所有的key值
 * 传入两个json文件的地址，根据参数复制
 * --same（默认） 相同的key
 * --diff 不同的key，换行间隔
 * --diff1 第一个json不同的key
 * --diff2 第二个json不同的key
 */
import BaseCommand from '@/common/BaseCommand';
import fs from 'fs-extra';
import clipboardy from 'clipboardy';
import { join } from 'node:path';
import { difference, intersection } from 'lodash-es';
export interface Options {
    same: boolean;
    diff: boolean;
    diff1: boolean;
    diff2: boolean;
}

export default class extends BaseCommand {
    async main(files: string[], options: Options) {
        if (files.length === 1) {
            const data = await fs.readJSON(join(process.cwd(), files[0]));
            clipboardy.writeSync(Object.keys(data).join(','));
            this.logger.success('复制成功');
            return;
        } else if (files.length === 2) {
            const [data1, data2] = await Promise.all(files.map((file) => fs.readJSON(join(process.cwd(), file))));
            let result = [];
            if (options.diff) {
            } else if (options.diff1) {
                result = difference(Object.keys(data1), Object.keys(data2));
            } else if (options.diff2) {
                result = difference(Object.keys(data2), Object.keys(data1));
            } else {
                result = intersection(Object.keys(data1), Object.keys(data2));
            }

            clipboardy.writeSync(result.join(','));
            this.logger.success('复制成功');
            return;
        }
        throw new Error('请输入文件地址');
    }
}
