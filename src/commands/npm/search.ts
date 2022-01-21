import open from 'open';
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import Table, {VerticalTable} from 'cli-table3';
import npmPage from './util/npmPage.js';
import BaseCommand from '../../util/BaseCommand.js';
const table = new Table({
    head: [
        chalk.green('名称'),
        chalk.green('简介'),
        chalk.green('周下载量'),
        chalk.green('上次更新')
    ],
    colAligns: ['center', 'center', 'center', 'center']
}) as VerticalTable;
interface Options {
    open?:boolean
}
interface OutputPkgItem {
    name: string,
    description: string
    weeklyDl: string
    lastPb: string,
}
export default class extends BaseCommand {
    private args: string[];
    private options: Options;
    private spinner: Ora;
    constructor(args:string[], options:Options) {
        super();
        this.args = args;
        this.options = options;
        this.spinner = ora('');
    }
    async run() {
        const { args, options } = this;
        if (args.length === 1) {
            this.fetchNpmPackage(args[0], false, options);
        } else if (args.length > 1) {
            this.fetchMulNpmPackage(args);
        } else {
            this.logger.error('未检测到依赖名称。');
        }
    }
    // 获取单个包信息
    private async fetchNpmPackage(packageName:string, isMultiple:boolean, options: Options = {}):Promise<OutputPkgItem> {
        const {spinner} = this;
        if (!isMultiple) {
            spinner.text = `正在查找 ${packageName} 模块`;
            spinner.start();
        }
        const page = await npmPage(packageName);
        const data = {
            name: packageName,
            description: page.get('description'),
            weeklyDl: page.get('weeklyDl'),
            lastPb: page.get('lastPb')
        };
        data.weeklyDl = this.transformNumberCn(data.weeklyDl).toString();
        if (isMultiple) {
            return data;
        }
        spinner.stop();
        console.log(`${chalk.bold(`关于${packageName}`)}:
        ${data.description}
      周下载量：${chalk.green(data.weeklyDl)}
      上次更新：${chalk.green(data.lastPb)}`);
        if (options.open) {
           await open(`https://npmjs.com/package/${packageName}`);
        }
        return data;
    }
    // 获取多个包信息并比较
    private async fetchMulNpmPackage(args:string[]) {
        const {spinner} = this;
        spinner.text = `正在查找 ${args.join(' ')} 这些模块`;
        spinner.start();
        let resList;
        try {
            resList = await Promise.all(args.map(arg => {
                return this.fetchNpmPackage(arg, true);
            }));
        } catch (e) {
            if (e.response && e.response.statusText === 'Not Found') {
                spinner.fail(`没有 ${e.config.url.split('/').pop()} 这个模块`);
            } else {
                spinner.fail('无法访问');
            }
            process.exit(0);
        }
        spinner.stop();
        table.push(
            ...resList.map(item => [
                item.name,
                this.lineFeed(item.description),
                item.weeklyDl,
                item.lastPb,
            ]));
        console.log(table.toString());
    }
    // 12,345,678 => 1234万
    private transformNumberCn(val:string) {
        const value = Number(val.replace(/,/g, ''));
        if (value > 10000) {
            return `${parseInt((value / 10000).toString())}万`;
        }
        return value;
    }
    private lineFeed(str:string, perLineLength = 30) {
        const strArr = str.split(' ');
        let tempArr = [];
        const retArr = [];
        strArr.forEach(s => {
            tempArr.push(s);
            if (tempArr.reduce((sum, item) => sum + item + ' ', '').length > perLineLength) {
                retArr.push(tempArr.join(' '));
                tempArr = [];
            }
        });
        if (tempArr.length) {
            retArr.push(tempArr.join(' '));
        }
        return retArr.join('\n');
    }
}
