import * as fs from 'fs-extra';
import bytes from 'bytes';
import axios, { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import BaseCommand from '@/util/BaseCommand.js';

export default class extends BaseCommand {
    private filePath: string;
    constructor(filePath: string) {
        super();
        this.filePath = filePath;
        this.helper.validate({
            file: filePath
        }, {
            file: {
                validator: (_, value) => this.helper.isURL(value) || this.helper.isPath(value),
                message: '请输入图片网址，或本地地址'
            }
        });
    }
    async run() {
        let { filePath } = this;
        if (this.helper.isURL(filePath)) {
            let res: AxiosResponse;
            // 当filePath外面不加引号时，地址里面的逗号会被解析成空格，所以下面这段代码是要把地址还原回去
            filePath = filePath.replace(/\s/g, ',');
            try {
                res = await axios.get(filePath, {
                    responseType: 'stream'
                });
            } catch (e) {
                this.logger.error('文件地址不存在或无法正常下载');
                return;
            }
            this.logger.success(bytes((await this.getSize(res.data))));
            return;
        }
        let fileData;
        try {
            fileData = await fs.stat(filePath);
        } catch (error) {
            this.logger.error(`文件${filePath}不存在或无法读取`);
            return;
        }
        console.log(bytes(fileData.size));
    }
    async getSize(inputStream: Readable): Promise<number> {
        let len = 0;
        return new Promise(resolve => {
            inputStream.on('data', str => {
                len += str.length;
            });
            inputStream.on('end', () => {
                resolve(len);
            });
        });
    }
};
