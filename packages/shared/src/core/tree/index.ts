import { resolve } from 'node:path';
import fs from 'fs-extra';
import clipboardy from 'clipboardy';
import BaseManager from '../BaseManager';
import { levelCharacters } from '../../utils/constant';
export interface Options {
    /**
     * 遍历的层数，不填为遍历全部
     */
    level: number;
    /**
     * 忽视的目录
     */
    ignore: string;
    /**
     * 是否复制生成的树文本进剪贴板
     */
    copy: boolean;
}

const defaultIgnoreDirs = ['node_modules', '.git', '.DS_Store'];

export class TreeManager extends BaseManager {
    private outputList: string[];
    private ignoreDirs: string[];
    private options: Options;
    async main(dir: string, options: Options) {
        this.init(dir, options);
        const root = process.cwd();
        await this.readdir(root);
        if (this.options.copy) {
            clipboardy.writeSync(this.outputList.join('\n'));
            this.logger.success('复制成功');
        } else {
            for (const line of this.outputList) {
                console.log(line);
            }
        }
    }
    /**
     * 初始化命令参数和配置
     * @param {string} dir - 目标目录路径
     * @param {Options} options - 命令选项
     * @returns {void}
     */
    private init(dir: string = '.', options: Options): void {
        const defaultOptions = {
            level: 1,
        };
        this.options = {
            ...defaultOptions,
            ...options,
        };
        if (this.options.ignore) {
            this.ignoreDirs = defaultIgnoreDirs.concat(this.options.ignore.split(','));
        } else {
            this.ignoreDirs = defaultIgnoreDirs;
        }
        this.outputList = [];
    }
    /**
     * 递归读取目录并生成树形结构
     * @param {string} root - 当前读取的根目录路径
     * @param {number} level - 当前遍历的层级
     * @param {number[]} paddings - 用于格式化树形结构的填充数组
     * @returns {Promise<void>}
     */
    private async readdir(root: string, level: number = 0, paddings: number[] = []): Promise<void> {
        const dirs = (await fs.readdir(root)).filter((dir) => !this.ignoreDirs.includes(dir));
        for (let i = 0; i < dirs.length; i++) {
            const dir = dirs[i];
            const stat = await fs.stat(resolve(root, dir));
            const preText = paddings.map((count) => `${levelCharacters.border} ${' '.repeat(count)}`).join('');
            const filePreText = level ? preText : '';
            if (stat.isDirectory()) {
                this.outputList.push(`${filePreText}${levelCharacters.contain} ${dir}`);
                if (level < this.options.level) {
                    await this.readdir(resolve(root, dir), level + 1, [...paddings, Math.ceil(dir.length / 2)]);
                }
            } else {
                if (i === dirs.length - 1) {
                    this.outputList.push(`${filePreText}${levelCharacters.last} ${dir}`);
                } else {
                    this.outputList.push(`${filePreText}${levelCharacters.contain} ${dir}`);
                }
            }
        }
    }
}
