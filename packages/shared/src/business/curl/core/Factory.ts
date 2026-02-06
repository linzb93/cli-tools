import { createCmdCurlParser } from '../implementations/CmdCurlParser';
import { createBashCurlParser } from '../implementations/BashCurlParser';
import { Options, CurlParser } from '../types';

/**
 * 检测curl命令是cmd模式还是bash模式
 * @param curlText curl命令文本
 * @returns 'cmd' 或 'bash'
 */
export const detectCurlMode = (curlText: string): 'cmd' | 'bash' => {
    // 检查是否包含cmd模式特有的^符号
    if (curlText.includes('^"') || curlText.includes('^"')) {
        return 'cmd';
    }
    // 检查是否包含bash模式特有的\换行符
    if (curlText.includes('\\\n') || curlText.includes("$'")) {
        return 'bash';
    }
    // 默认返回bash模式
    return 'bash';
};

/**
 * 创建对应的curl解析器
 * @param mode curl模式
 * @param options 配置选项
 * @returns curl解析器实例
 */
export const createParser = (mode: 'cmd' | 'bash', options: Options): CurlParser => {
    switch (mode) {
        case 'cmd':
            return createCmdCurlParser(options);
        case 'bash':
            return createBashCurlParser(options);
        default:
            throw new Error(`不支持的curl模式: ${mode}`);
    }
};
