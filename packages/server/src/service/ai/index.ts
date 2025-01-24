import fs from 'fs-extra';
import { join, dirname } from 'node:path';
import { root } from '@/common/constant';
import BaseCommand from '@/common/BaseCommand';
import sql from '@/common/sql';
import * as semver from 'semver';
import chalk from 'chalk';

export interface Options {
    short: boolean;
    clear: boolean;
}

export default class Ai extends BaseCommand {
    private contextFilePath = '';
    /**
     * 主函数，用于处理用户输入并调用OpenAI API获取回答
     * @param moduleName - 模块名称
     */
    async main(moduleName: string, options: Options) {
        this.contextFilePath = join(root, `cache/ai/${name}.json`);
        if (options.clear) {
            this.clearContext(moduleName);
            return;
        }
        if (semver.lt(process.version, '18.0.0')) {
            this.logger.error('请在NodeJS v18+环境使用');
            return;
        }
        const OpenAI = (await import('openai')).default;
        // 从本地数据库获取OpenAI API密钥
        const apiKey = await sql((db) => db.ai.apiKey);
        // 创建OpenAI实例，设置API密钥和基础URL
        const openai = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey,
        });
        const messages = await this.checkDialogueExists(moduleName);
        if (options.short) {
            messages.push({ role: 'system', content: '用户将提供一系列问题，你的回答应当简明扼要' });
        }
        while (true) {
            // 使用inquirer库提示用户输入问题
            const answer = await this.inquirer.prompt({
                message: `请输入内容(输入":quit"结束)`,
                name: 'question',
                type: 'input',
            });
            if (answer.question === ':quit') {
                await fs.writeJSON(this.contextFilePath, messages);
                break;
            }
            messages.push({ role: 'user', content: answer.question });

            const stream = await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages,
                stream: true,
            });
            let contents = '';
            // 打印回答内容
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                process.stdout.write(content); // 将内容输出到控制台
                contents += content;
            }
            process.stdout.write('\n');
            messages.push({ role: 'assistant', content: contents });
        }
    }
    private async checkDialogueExists(name: string): Promise<
        {
            role: 'user' | 'assistant' | 'system';
            content: string;
        }[]
    > {
        const dir = dirname(this.contextFilePath);
        try {
            await fs.access(dir);
        } catch (error) {
            await fs.mkdir(dir);
        }
        try {
            return await fs.readJSON(this.contextFilePath);
        } catch (error) {
            await fs.writeJSON(this.contextFilePath, []);
            return [];
        }
    }
    private async clearContext(name: string) {
        const contexts = await this.checkDialogueExists(name);
        const { index } = await this.inquirer.prompt({
            type: 'list',
            message: '请选择要开始清理的对话',
            name: 'index',
            choices: [{ name: chalk.red('【全部对话】'), value: 0 }].concat(
                contexts
                    .filter((ctx) => ctx.role === 'user')
                    .map((item, idx) => ({
                        name: item.content,
                        value: idx,
                    }))
            ),
        });
        let restContext = [];
        if (index) {
            restContext = contexts.slice(0, index * 2 + (contexts[0].role === 'system' ? 1 : 0));
        }
        await fs.writeJSON(this.contextFilePath, restContext);
        this.logger.success('清除成功');
    }
}
