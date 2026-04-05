/**
 * Node.js process.env 环境变量类型声明
 */
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /** 调试模式 */
            DEBUG?: string;
            /** Vitest 测试环境 */
            VITEST?: string;
            /** CLI 构建模式: cli | cliTest | report */
            MODE?: 'cli' | 'cliTest' | 'report';
            /** Cursor IDE trace ID */
            CURSOR_TRACE_ID?: string;
            /** Trae IDE trace ID */
            TRAE_TRACE_ID?: string;
            /** 终端程序: vscode | apple_terminal | etc. */
            TERM_PROGRAM?: string;
        }
    }
}

export {};
