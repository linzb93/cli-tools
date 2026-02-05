import open from 'open';
import chalk from 'chalk';
import Table from 'cli-table3';
import { AxiosError } from 'axios';
import { BaseService } from '@cli-tools/shared/base/BaseService';
import npm from '../shared';

export interface Options {
    open?: boolean;
    full?: boolean;
    help?: boolean;
}
interface OutputPkgItem {
    name: string;
    description: string;
    weeklyDl: string;
    lastPb: string;
    version: string;
}

/**
 * 查询npm模块信息，支持单包查询和多包查询
 * 单包查询的可以访问npm主页
 */
export class SearchService extends BaseService {
    private options: Options;
    async main(packages: string[], options: Options) {
        this.options = options;
        if (packages.length === 1) {
            return this.fetchNpmPackage(packages[0], false, options);
        } else if (packages.length > 1) {
            return this.fetchMulNpmPackage(packages);
        } else {
            this.logger.error('未检测到依赖名称。');
        }
    }
    // 获取单个包信息
    private async fetchNpmPackage(
        packageName: string,
        isMultiple: boolean,
        options: Options = {},
    ): Promise<OutputPkgItem> {
        const { spinner } = this;
        if (!isMultiple) {
            spinner.text = `正在查找${chalk.cyan(packageName)}模块`;
        }
        const page = await npm.getPage(packageName);
        const data = {
            name: packageName,
            description: page.get('description'),
            weeklyDl: page.get('weeklyDl'),
            lastPb: page.get('lastPb'),
            version: page.get('version'),
        };
        data.weeklyDl = this.transformNumberCn(data.weeklyDl).toString();
        if (isMultiple || process.env.VITEST) {
            return data;
        }
        spinner.stop();
        console.log(`${chalk.bold(`关于${packageName}`)}:
        ${data.description}
      周下载量：${chalk.green(data.weeklyDl)}
      上次更新：${chalk.green(data.lastPb)}
      最新版本：${chalk.green(data.version)}`);
        if (options.open) {
            await open(`https://npmjs.com/package/${packageName}`);
        }
        return data;
    }
    // 获取多个包信息并比较
    private async fetchMulNpmPackage(packages: string[]) {
        const { spinner, options } = this;
        const head = [
            chalk.green('名称'),
            chalk.green('简介'),
            chalk.green('周下载量'),
            chalk.green('上次更新'),
            chalk.green('最新版本'),
        ];
        if (!options.full) {
            head.splice(1, 1);
        }
        const table = new Table({
            head,
            colAligns: options.full
                ? ['center', 'center', 'center', 'center', 'center']
                : ['center', 'center', 'center', 'center'],
        });
        spinner.text = `正在查找 ${packages.join(' ')} 这些模块`;
        let resList: OutputPkgItem[];
        try {
            resList = await Promise.all(packages.map((pkg) => this.fetchNpmPackage(pkg, true)));
        } catch (error) {
            const err = error as AxiosError;
            if (err.response && err.response.statusText === 'Not Found') {
                spinner.fail(`没有 ${(err.response.config.url as string).split('/').pop()} 这个模块`);
            } else {
                spinner.fail('无法访问');
            }
            process.exit(0);
        }
        spinner.stop();
        table.push(
            ...resList.map((item) => {
                const output = [item.name, this.lineFeed(item.description), item.weeklyDl, item.lastPb, item.version];
                if (!options.full) {
                    output.splice(1, 1);
                }
                return output;
            }),
        );
        console.log(table.toString());
    }
    // 12,345,678 => 1234万
    private transformNumberCn(val: string): string {
        const value = Number(val.replace(/,/g, ''));
        if (value > 10000) {
            return `${parseInt((value / 10000).toString())}万`;
        }
        return val;
    }
    private lineFeed(str: string, perLineLength = 30): string {
        const strList = str.split(' ');
        let tempArr: string[] = [];
        const lines = [];
        strList.forEach((s) => {
            tempArr.push(s);
            if (tempArr.reduce((sum, item) => sum + item + ' ', '').length > perLineLength) {
                lines.push(tempArr.join(' '));
                tempArr = [];
            }
        });
        if (tempArr.length) {
            lines.push(tempArr.join(' '));
        }
        return lines.join('\n');
    }
}
