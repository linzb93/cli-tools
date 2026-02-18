import fs from 'fs-extra';
import chalk from 'chalk';
import readline from 'node:readline';
import { logger } from '@/utils/logger';

import { filePath } from '../shared/constant';
import type { AwesomeOptions, AwesomeItem } from '../shared/types';

/**
 * 使用 readline 引导用户输入或编辑 Awesome 项
 */
export const awesomeEditService = async (command: string, options?: AwesomeOptions): Promise<void> => {
    try {
        if (!fs.existsSync(filePath)) {
            await fs.ensureFile(filePath);
            await fs.writeJson(filePath, [], { spaces: 2 });
        }
    } catch {
        logger.error(`Error: 初始化文件失败 ${filePath}`);
        return;
    }

    const fields: Array<{ key: keyof AwesomeItem; label: string; prompt: string }> = [
        { key: 'title', label: '名称', prompt: '请输入名称 (title): ' },
        { key: 'description', label: '描述', prompt: '请输入描述 (description): ' },
        { key: 'tag', label: '标签', prompt: '请输入标签 (tag): ' },
        { key: 'url', label: '地址', prompt: '请输入地址 (url): ' },
    ];

    if (command === 'edit') {
        const name = (options?.name || '').trim();
        if (!name) {
            logger.error('编辑模式需要传入选项 --name');
            return;
        }
        const list: AwesomeItem[] = await fs.readJSON(filePath).catch(() => []);
        const idx = list.findIndex((item) => item.title.trim().toLowerCase() === name.toLowerCase());
        if (idx < 0) {
            logger.warn(`未找到名称为 "${name}" 的项`);
            return;
        }
        await runEditFlow(list, idx, fields);
        return;
    }

    await runAddFlow(fields);
};

/**
 * 运行新增模式，逐项录入并保存
 */
async function runAddFlow(fields: Array<{ key: keyof AwesomeItem; label: string; prompt: string }>): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });
    let index = 0;
    const record: Partial<AwesomeItem> = {};
    console.log(chalk.green('开始录入 Awesome 项：'));
    console.log(chalk.yellow('快捷方式: .resume(上一项重新输入) | .clear(清空并重新开始) | .exit(退出)'));

    const setNextPrompt = () => {
        rl.setPrompt(fields[index].prompt);
        rl.prompt();
    };

    setNextPrompt();

    rl.on('line', async (inputRaw) => {
        const input = inputRaw.trim();

        if (input === '.exit') {
            console.log(chalk.cyan('退出进程'));
            rl.close();
            return;
        }

        if (input === '.clear') {
            Object.keys(record).forEach((k) => delete (record as any)[k]);
            index = 0;
            console.log(chalk.cyan('已清空输入，重新开始'));
            setNextPrompt();
            return;
        }

        if (input === '.resume') {
            if (index > 0) {
                index = index - 1;
                const prev = (record as any)[fields[index].key] || '';
                movePrevLine(rl, fields[index].prompt, String(prev));
                return;
            } else {
                logger.info('当前为第一项，无法回退');
                setNextPrompt();
            }
            return;
        }

        const current = fields[index];
        if (current.key !== 'tag' && current.key !== 'url' && !input) {
            logger.error(`${current.label} 不能为空，请重新输入`);
            setNextPrompt();
            return;
        }
        if (current.key === 'url') {
            const urlReg = /^(https?:\/\/)[^\s]+$/i;
            if (!urlReg.test(input)) {
                logger.error('地址格式不合法，需要以 http/https 开头');
                setNextPrompt();
                return;
            }
        }
        (record as any)[current.key] = input;
        logger.info(`已输入 ${current.label}: ${input}`);
        index += 1;

        if (index < fields.length) {
            setNextPrompt();
            return;
        }

        rl.pause();

        const item: AwesomeItem = {
            title: (record.title as string) || '',
            description: (record.description as string) || '',
            url: (record.url as string) || '',
            tag: (record.tag as string) || '',
        };

        try {
            const data = await fs.readJSON(filePath).catch(() => []);
            const list: AwesomeItem[] = Array.isArray(data) ? data : [];
            list.push(item);
            await fs.writeJson(filePath, list, { spaces: 2 });
            logger.info(chalk.green('保存成功'));
        } catch (error) {
            logger.error(`写入失败: ${error}`);
        } finally {
            rl.close();
        }
    });
}

/**
 * 运行编辑模式，按项询问是否修改并保存
 */
async function runEditFlow(
    list: AwesomeItem[],
    idx: number,
    fields: Array<{ key: keyof AwesomeItem; label: string; prompt: string }>,
): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });
    const ask = (q: string): Promise<string> => new Promise((resolve) => rl.question(q, (ans) => resolve(ans.trim())));

    const item = { ...list[idx] };
    console.log(chalk.green(`进入编辑模式：${item.title}`));

    for (const f of fields) {
        const currentVal = (item[f.key] as string) || '';
        console.log(chalk.gray(`${f.label} 当前值: ${currentVal}`));
        const yn = (await ask(`是否修改 ${f.label}?默认不修改，直接回车 (y/N): `)).toLowerCase();
        if (yn === 'y' || yn === 'yes') {
            const newVal = await new Promise<string>((resolve) => {
                movePrevLine(rl, f.prompt, currentVal);
                rl.once('line', (ans) => resolve(ans.trim()));
            });
            (item as any)[f.key] = newVal;
            console.log(chalk.gray(`已修改 ${f.label}: ${newVal}`));
        } else {
            logger.info(chalk.gray(`保持不变 ${f.label}`));
        }
    }

    list[idx] = item;
    try {
        await fs.writeJson(filePath, list, { spaces: 2 });
        logger.info(chalk.green('保存成功'));
    } catch (error) {
        logger.error(chalk.red('写入失败'), error);
    } finally {
        rl.close();
    }
}

/**
 * 将光标移动到上一行并在该行重新提示输入，可选预填
 */
function movePrevLine(rl: readline.Interface, prompt: string, prefill?: string): void {
    readline.moveCursor(process.stdout, 0, -1);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    rl.setPrompt(prompt);
    rl.prompt();
    if (prefill) {
        rl.write(prefill);
    }
}