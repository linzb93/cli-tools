// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { WebSocketServer } from 'ws';
import router from './lib/socket-router';
import './routers/nvm';

let wss: WebSocketServer;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "cli-vscode-extension" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('cli-vscode-extension.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from cli-vscode-extension!');
    });

    context.subscriptions.push(disposable);

    // 创建 WebSocket Server 监听 9528 端口
    try {
        wss = new WebSocketServer({ port: 9528 });

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
            console.log('WebSocket server listening on port 9528');
        });

        wss.on('error', (e: any) => {
            if (e.code === 'EADDRINUSE') {
                console.log('Port 9528 is already in use. Likely another VS Code window is running the server.');
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
}

// This method is called when your extension is deactivated
export function deactivate() {
    if (wss) {
        wss.close();
    }
}
