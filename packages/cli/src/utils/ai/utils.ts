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
