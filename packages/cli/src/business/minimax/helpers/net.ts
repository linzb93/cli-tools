import net from 'node:net';
import { logger } from '@/utils/logger';
import { refresh } from './render';
const TCP_PORT = 19876;

/**
 * 创建 TCP Server，接收 "/refresh" 命令刷新界面
 */
export function createTcpServer(): net.Server {
    const server = net.createServer((socket) => {
        socket.on('data', (data) => {
            const message = data.toString().trim();
            if (message === '/refresh') {
                refresh();
                socket.write('OK: refreshed\n');
            } else {
                socket.write('UNKNOWN command\n');
            }
        });

        socket.on('error', (err) => {
            logger.error(`TCP socket error: ${err.message}`);
        });
    });

    server.listen(TCP_PORT, () => {
        // logger.info(`TCP server listening on port ${TCP_PORT}`);
    });

    return server;
}
