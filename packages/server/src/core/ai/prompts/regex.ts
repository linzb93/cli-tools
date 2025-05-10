import { PromptOptions, printObject } from '../share';

const obj: PromptOptions = {
    title: '正则表达式解析',
    id: 'regex',
    prompt: '你是一个正则表达式解析工具。你需要解析用户输入的正则表达式，并输出解析结果。',
    stream: true,
    async action(obj) {
        // 正则表达式中的反斜杠需要转义
        const input = obj.input.toString().replace(/\\/g, '\\\\');
        const result = await obj.getResult(input);
        printObject(result);
    },
    catchHandler(error) {
        console.log(error.message);
    },
};
export default obj;
