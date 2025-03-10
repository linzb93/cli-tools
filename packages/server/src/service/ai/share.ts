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
    action: (obj: { input?: string; getResult(data: string): Promise<string | any> }) => Promise<void>;
    catchHandler(error: Error): void;
}
