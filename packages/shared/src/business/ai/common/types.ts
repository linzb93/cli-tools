/**
 * 消息选项类型
 */
export type MessageOptions =
    | {
          role: 'system' | 'assistant';
          content: string;
          name?: string;
      }
    | {
          role: 'user';
          content:
              | string
              | {
                    type: 'image_url';
                    image_url: {
                        url: string;
                        detail?: 'auto' | 'low' | 'high';
                    };
                }[];
      };

/**
 * 提示选项接口
 */
export interface PromptOptions {
    /**
     * 提示标题
     */
    title: string;

    /**
     * 提示ID
     */
    id: string;

    /**
     * 提示内容
     */
    prompt: string;

    /**
     * 提示类型
     */
    type?: string;

    /**
     * 是否流式输出
     */
    stream?: boolean;

    /**
     * 执行函数
     */
    action: (obj: { input?: string; getResult(data: string): Promise<string | any> }) => Promise<void>;

    /**
     * 错误处理函数
     */
    catchHandler(error: Error): void;
}
export interface Options {
    /**
     * 是否翻译
     */
    eng: boolean;

    /**
     * 是否流式输出
     */
    stream: boolean;
}
