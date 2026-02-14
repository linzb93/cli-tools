import fs from 'fs-extra';
import chalk from 'chalk';
import inquirer from '@cli-tools/shared/utils/inquirer';
import { filePath } from '../shared/constant';
import type { AwesomeOptions, AwesomeItem } from '../shared/types';

/**
 * 根据命令行 --name 选项删除 awesome.json 中 title 完全相同的项，删除前进行二次确认
 * @param options 传入的命令行选项
 */
export const awesomeDeleteService = async (options?: AwesomeOptions): Promise<void> => {
    const name = (options?.name || '').trim();
    if (!name) {
        console.log(chalk.red('删除模式需要传入选项 --name'));
        return;
    }

    if (!fs.existsSync(filePath)) {
        console.log(chalk.red(`Error: File not found at ${filePath}`));
        return;
    }

    let list: AwesomeItem[] = [];
    try {
        const data = await fs.readJSON(filePath);
        list = Array.isArray(data) ? (data as AwesomeItem[]) : [];
    } catch (error) {
        console.error(chalk.red('读取 awesome.json 失败'), error);
        return;
    }

    const matches = list.filter((item) => (item.title || '').trim() === name);
    if (matches.length === 0) {
        console.log(chalk.yellow(`未找到名称完全等于 "${name}" 的项`));
        return;
    }

    console.log(chalk.green(`检测到 ${matches.length} 个待删除项：`));
    matches.forEach((m, idx) => {
        console.log(`${idx + 1}. ${chalk.cyan(m.title)} ${chalk.gray(m.tag || '')} ${chalk.blue(m.url || '')}`);
    });

    try {
        const { confirm } = await inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            message: `确认删除以上 ${matches.length} 项?`,
            default: false,
        });
        if (!confirm) {
            console.log(chalk.gray('已取消删除'));
            return;
        }

        const remain = list.filter((item) => (item.title || '').trim() !== name);
        await fs.writeJson(filePath, remain, { spaces: 2 });
        console.log(chalk.green(`删除成功，已更新 awesome.json，删除 ${matches.length} 项`));
    } catch (error) {
        console.error(chalk.red('写入 awesome.json 失败'), error);
    }
};
