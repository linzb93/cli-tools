import Table from 'cli-table3';
import fs from 'fs-extra';
import pMap from 'p-map';
import { globby } from 'globby';
import chalk from 'chalk';
import BaseCommand from '../../BaseCommand';
import { splitByLine } from '@/utils/helper';
import Module, { IFileAnalysis } from './Module';
import VueModule from './VueModule';
import JavascriptModule from './JavascriptModule';

/**
 * 代码分析命令类
 */
export default class extends BaseCommand {
    /**
     * 可用的分析模块
     */
    private modules: Module[] = [];

    /**
     * 添加分析模块
     * @param modules 要添加的模块
     */
    addModule(...modules: Module[]) {
        this.modules = modules;
    }

    /**
     * 主方法
     */
    async main() {
        this.addModule(new VueModule(), new JavascriptModule());
        this.run();
    }

    /**
     * 运行分析
     */
    async run() {
        this.spinner.text = '正在分析';
        const { files, max, module } = await this.getMatchFiles();
        const accumulator = await pMap(files, async (file) => {
            const content = await fs.readFile(file, 'utf8');
            const splitLines = splitByLine(content);
            const calcResult = module.calc(splitLines);
            const lineLength = calcResult.lines;
            let type = 'normal';
            if (lineLength > max.danger) {
                type = 'danger';
            } else if (lineLength > max.warning) {
                type = 'warning';
            }
            return {
                file,
                type,
                ...calcResult,
            } as IFileAnalysis;
        });
        const result = accumulator.filter((item) => item.type !== 'normal');
        if (!result.length) {
            this.spinner.succeed('分析完成，代码行数正常');
            return;
        }
        this.spinner.succeed('分析完成');

        // 在表格上方显示行数警告和危险级别
        console.log(`${chalk.yellow('警告行数')}：${max.warning}行，${chalk.red('危险行数')}：${max.danger}行`);

        // 根据模块类型选择不同的表头
        const headers = ['', chalk.green('文件地址'), chalk.green('行数')];
        if (module instanceof VueModule) {
            headers.push(chalk.green('代码分布'));
        }

        const table = new Table({
            head: headers,
            colAligns: ['left', 'left', 'center', 'left'],
        });

        table.push(
            ...result
                .sort((prev, next) => (prev.lines > next.lines ? -1 : 1))
                .map((item, index) => {
                    const row = [
                        (index + 1).toString(),
                        chalk.cyan(item.file),
                        item.type === 'danger' ? chalk.red(item.lines) : chalk.yellow(item.lines),
                    ];

                    // 如果是Vue模块，添加代码分布信息
                    if (
                        module instanceof VueModule &&
                        item.templateLength !== undefined &&
                        item.scriptLength !== undefined &&
                        item.styleLength !== undefined
                    ) {
                        row.push(
                            chalk.cyan(
                                `template:${item.templateLength}行;script:${item.scriptLength}行;style:${item.styleLength}行`
                            )
                        );
                    }

                    return row;
                })
        );
        console.log(table.toString());
    }

    /**
     * 寻找所有需要检测的文件，例如vue项目就只找.vue后缀的文件，其他前端项目就找.js和.ts后缀的文件。
     */
    private async getMatchFiles(): Promise<{
        files: string[];
        max: Module['maxLength'];
        module: Module;
    }> {
        for (const m of this.modules) {
            if (await m.access()) {
                return {
                    files: await globby([m.filePattern(''), '!**/node_modules', '!**/dist'], {
                        cwd: process.cwd(),
                    }),
                    max: m.maxLength,
                    module: m,
                };
            }
        }
    }
}
