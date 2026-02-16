import { createCmdCurlParser } from '../implementations/CmdCurlParser';
import { createBashCurlParser } from '../implementations/BashCurlParser';
import { createPowerShellCurlParser } from '../implementations/PowerShellCurlParser';
import { Options, CurlParser } from '../types';

/**
 * 检测curl命令是cmd模式、bash模式还是powershell模式
 * @param curlText curl命令文本
 * @returns 'cmd' | 'bash' | 'powershell'
 */
export const detectCurlMode = (curlText: string): 'cmd' | 'bash' | 'powershell' => {
    // 检查是否包含PowerShell特有的命令
    if (curlText.includes('Invoke-WebRequest') || curlText.includes('New-Object Microsoft.PowerShell')) {
        return 'powershell';
    }

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
export const createParser = (mode: 'cmd' | 'bash' | 'powershell', options: Options): CurlParser => {
    switch (mode) {
        case 'cmd':
            return createCmdCurlParser(options);
        case 'bash':
            return createBashCurlParser(options);
        case 'powershell':
            return createPowerShellCurlParser(options);
        default:
            throw new Error(`不支持的curl模式: ${mode}`);
    }
};
