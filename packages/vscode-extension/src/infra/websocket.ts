import { ExtensionContext } from 'vscode';
import { WebSocketServer } from 'ws';
import router from './router';

const port = 7001;
let wss: WebSocketServer;

const init = (context: ExtensionContext) => {
    try {
        wss = new WebSocketServer({ port });

        wss.on('connection', (ws) => {
            console.log('Client connected');

            ws.on('message', async (message) => {
                const msgStr = message.toString();
                console.log('Received:', msgStr);
                try {
                    const payload = JSON.parse(msgStr);
                    await router.register(ws, payload);
                } catch (error) {
                    console.error('Socket error:', error);
                }
            });
        });

        wss.on('listening', () => {
            console.log(`WebSocket server listening on port ${port}`);
        });

        wss.on('error', (e: any) => {
            if (e.code === 'EADDRINUSE') {
                console.log(`Port ${port} is already in use. Likely another VS Code window is running the server.`);
            } else {
                console.error('WebSocket server error:', e);
            }
        });

        context.subscriptions.push({
            dispose: () => {
                // 关闭 WebSocket 服务
                // 如果服务器未打开（例如因端口冲突），close 可能会报错或无操作，这里简单处理
                try {
                    wss.close();
                } catch (e) {
                    console.error('Error closing wss:', e);
                }
            },
        });
    } catch (error) {
        console.error('Failed to create WebSocket server:', error);
    }
};

const close = () => {
    if (wss) {
        wss.close();
    }
};

export const webSocketManager = {
    init,
    close,
};
