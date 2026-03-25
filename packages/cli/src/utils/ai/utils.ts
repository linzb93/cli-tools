/**
 * 从包含 markdown 代码块的字符串中提取并解析 JSON
 * @param str 原始字符串
 * @returns 解析后的 JSON 对象，如果未找到或解析失败返回 null
 * @example
 * extractJSONFromMarkdown('```json\n{"key": "value"}\n```') // { key: "value" }
 */
export function extractJSONFromMarkdown(str: string): unknown {
    try {
        return JSON.parse(str);
    } catch (error) {
        const match = str.match(/```json\s*([\s\S]*?)\s*```/);
        if (!match) return null;
        try {
            return JSON.parse(match[1]);
        } catch {
            return null;
        }
    }
}

/**
 * 以流的方式输出AI生成的结果
 * @param stream 数据流
 */
export const printObject = async (stream: any) => {
    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content);
    }
};
