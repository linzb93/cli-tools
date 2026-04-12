import { Socket } from 'node:net';
import { parseData, parseTcpAddress } from './utils';

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

        socket.on('connect', () => {
            if (data) {
                const parsed = parseData(data);
                socket.write(JSON.stringify(parsed));
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
            } catch (error) {
                reject(new Error(`TCP 响应 JSON.parse 失败: ${(error as Error).message}`));
            }
        });

        socket.on('error', (error) => {
            reject(new Error(`TCP 请求失败: ${error.message}`));
        });
    });
}
