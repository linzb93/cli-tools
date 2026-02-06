import Table from 'cli-table3';
import fs from 'fs-extra';
import pMap from 'p-map';
import { globby } from 'globby';
import chalk from 'chalk';
import spinner from '@cli-tools/shared/utils/spinner';
import { splitByLine } from '@cli-tools/shared/utils/helper';
import Module, { IFileAnalysis } from './Module';
import { vueModule } from './VueModule';
import { javascriptModule } from './JavascriptModule';

/**
 * 寻找所有需要检测的文件，例如vue项目就只找.vue后缀的文件，其他前端项目就找.js和.ts后缀的文件。
 */
const getMatchFiles = async (
    modules: Module[],
): Promise<
    | {
          files: string[];
          max: Module['maxLength'];
          module: Module;
      }
    | undefined
> => {
    for (const m of modules) {
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
};

/**
 * 运行分析
 */
const run = async (modules: Module[]) => {
    spinner.text = '正在分析';
    const match = await getMatchFiles(modules);
    
    if (!match) {
         // Should we handle no match? The original code didn't return anything if no module accessed.
         // But here it returns undefined.
         // Original: 
         // for (const m of this.modules) { if (await m.access()) { ... return ... } }
         // The return type was Promise<{...} | undefined> implicitly (though strictly typed as Promise<{...}> but undefined if loop finishes)
         // Assuming at least one module matches or we just handle it gracefully.
         // If no files found, maybe just return?
         spinner.fail('未找到支持的项目类型');
         return;
    }

    const { files, max, module } = match;
    
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
        spinner.succeed('分析完成，代码行数正常');
        return;
    }
    spinner.succeed('分析完成');

    // 在表格上方显示行数警告和危险级别
    console.log(`${chalk.yellow('警告行数')}：${max.warning}行，${chalk.red('危险行数')}：${max.danger}行`);

    // 根据模块类型选择不同的表头
    const headers = ['', chalk.green('文件地址'), chalk.green('行数')];
    if (module === vueModule) {
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
                    module === vueModule &&
                    item.templateLength !== undefined &&
                    item.scriptLength !== undefined &&
                    item.styleLength !== undefined
                ) {
                    row.push(
                        chalk.cyan(
                            `template:${item.templateLength}行;script:${item.scriptLength}行;style:${item.styleLength}行`,
                        ),
                    );
                }

                return row;
            }),
    );
    console.log(table.toString());
};

/**
 * 代码分析服务
 */
export const codeAnalyseService = async () => {
    const modules = [vueModule, javascriptModule];
    await run(modules);
};
