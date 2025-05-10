/**
 * 以流的方式输出AI生成的结果
 * @param stream
 */
export const printObject = async (stream: any) => {
    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content);
    }
};

export interface PromptOptions {
    title: string;
    id: string;
    prompt: string;
    type?: string;
    stream?: boolean;
    action: (obj: {
        input?: string;
        getResult(data: string): Promise<string | any>;
        options: Options;
    }) => Promise<void>;
    catchHandler(error: Error): void;
}
export interface Options {
    /**
     * 是否继续提问
     * @type {boolean}
     * @default false
     */
    ask: boolean;
    /**
     * 是否翻译
     * @type {boolean}
     * @default false
     */
    eng: boolean;
}
