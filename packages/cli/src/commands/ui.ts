import { uiService } from '@/business/ui';

/**
 * ui 命令 - 启动一个 readline 交互界面
 */
export const uiCommand = () => {
    return uiService();
};
