import { Socket } from 'node:net';
import { parseTcpAddress } from './utils';

/**
 * 发送 TCP 请求
 * @param address TCP 地址（host:port）
 * @param data 请求数据
 * @returns 响应数据
 */
export function tcpRequest(address: string, data?: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const socket = new Socket();
        let buffer = '';
        const { host, port } = parseTcpAddress(address);

        socket.connect(port, host);
        socket.setTimeout(3000);

        socket.on('connect', () => {
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    socket.write(JSON.stringify(parsed));
                } catch {
                    socket.write(data);
                }
            }
            socket.end();
        });

        socket.on('data', (chunk) => {
            buffer += chunk.toString();
        });

        socket.on('end', () => {
            try {
                const result = JSON.parse(buffer);
                resolve(result);
            } catch {
                resolve(buffer);
            }
        });

        socket.on('error', (error: any) => {
            if (error.code.includes('ECONNREFUSED')) {
                reject(new Error(`TCP端口 ${port} 未开启`));
                socket.destroy();
            } else {
                reject(new Error(`TCP 请求失败: ${error.message}`));
            }
        });
    });
}
