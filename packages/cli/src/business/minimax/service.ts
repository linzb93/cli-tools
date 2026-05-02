import { createCommandReadline } from '@/utils/readline';
import type { Options } from './types';
import { createTcpServer, setWatchMode, createRefreshCommand, refresh } from './helpers';

/**
 * 启动交互式监控
 */
export async function minimaxService(options?: Options): Promise<void> {
    setWatchMode(!!options && options.watch);

    // run 模式：直接获取并显示一次，然后退出
    if (!options?.watch) {
        await refresh();
        return;
    }

    // 交互模式
    const interval = 1000 * 60 * 30; // 默认 30 分钟

    let timerId: NodeJS.Timeout | null = null;
    let tcpServer: ReturnType<typeof createTcpServer> | null = null;

    // 立即执行一次
    await refresh();

    // 设置定时刷新
    timerId = setInterval(refresh, interval);

    // 创建 TCP server 接收 /refresh 命令
    tcpServer = createTcpServer();

    // 启动 readline 交互
    const readlinePromise = createCommandReadline([createRefreshCommand()], {
        prompt: '\n输入指令> ',
    });

    const onEnd = () => {
        if (timerId) {
            clearInterval(timerId);
        }
        if (tcpServer) {
            tcpServer.close();
        }
        process.exit(0);
    };

    // 监听 readline 关闭
    readlinePromise.then(() => {
        onEnd();
    });

    // 处理 Ctrl+C 退出
    process.on('SIGINT', () => {
        onEnd();
    });
}
