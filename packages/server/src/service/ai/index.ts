import BaseCommand from '@/common/BaseCommand';
import OpenAI from 'openai';
import sql from '@/common/sql';
export default class Ai extends BaseCommand {
    /**
     * 主函数，用于处理用户输入并调用OpenAI API获取回答
     * @param moduleName - 模块名称
     */
    async main(moduleName: string) {
        // 从本地数据库获取OpenAI API密钥
        const apiKey = await sql((db) => db.ai.apiKey);
        // 创建OpenAI实例，设置API密钥和基础URL
        const openai = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey,
        });
        const messages = [];
        while (true) {
            // 使用inquirer库提示用户输入问题
            const answer = await this.inquirer.prompt({
                message: `请输入内容`,
                name: 'question',
                type: 'input',
            });
            messages.push({ role: 'user', content: answer.question });
            this.spinner.text = '正在获取内容';
            const completion = await openai.chat.completions.create({
                messages,
                model: 'deepseek-chat',
            });
            const { content } = completion.choices[0].message;
            // 打印回答内容
            this.spinner.succeed(content);
            messages.push({ role: 'assistant', content });
        }
    }
}
