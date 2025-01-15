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
        messages.push({ role: 'system', content: '用户将提供一系列问题，你的回答应当简明扼要' });
        while (true) {
            // 使用inquirer库提示用户输入问题
            const answer = await this.inquirer.prompt({
                message: `请输入内容(输入":quit"结束)`,
                name: 'question',
                type: 'input',
            });
            if (answer.question === ':quit') {
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
}
