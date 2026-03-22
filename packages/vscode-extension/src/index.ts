// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
// import { httpManager } from './infra/http';
import './api';

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 *
 * @param {vscode.ExtensionContext} context - The context of the extension
 */
export function activate(context: vscode.ExtensionContext) {
    // httpManager.init(context);

    /**
     * 注册 mycli.copyFilePathAndLine 命令
     * 该命令会获取当前激活的文本编辑器中的文件路径和选中的行号，
     * 并将其格式化后复制到系统剪贴板。
     */
    const copyCommand = vscode.commands.registerCommand('mycli.copyFilePathAndLine', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;

            // 使用 VS Code API 获取文件相对于当前工作区的相对路径
            const filePath = vscode.workspace.asRelativePath(document.uri, false);

            // VS Code 的行号索引从 0 开始，显示给用户的行号需要加 1
            const startLine = selection.start.line + 1;
            const endLine = selection.end.line + 1;

            let lineText = `${startLine}`;
            if (startLine !== endLine) {
                lineText = `${startLine}-${endLine}`;
            }

            const result = `${filePath}:${lineText}`;

            // 写入剪贴板
            await vscode.env.clipboard.writeText(result);
            vscode.window.showInformationMessage('文件地址和行号已复制到剪贴板！');
        }
    });

    context.subscriptions.push(copyCommand);

    /**
     * 注册 mycli.startVueBuildedProject 命令
     * 当在资源管理器中右键点击 dist 目录时触发，向本地服务器发送 POST 请求启动打包后的项目。
     *
     * @param {vscode.Uri} uri - 触发命令时的目录 URI
     */
    const startDistCommand = vscode.commands.registerCommand(
        'mycli.startVueBuildedProject',
        async (uri: vscode.Uri) => {
            if (!uri || !uri.fsPath) {
                vscode.window.showErrorMessage('无法获取目录路径！');
                return;
            }

            const path = uri.fsPath;

            try {
                const response = await fetch('http://localhost:9527/vue/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ path }),
                });

                if (response.ok) {
                    vscode.window.showInformationMessage('成功启动已打包的项目！');
                } else {
                    vscode.window.showErrorMessage(`启动失败：服务器返回状态 ${response.status}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`请求失败：${error instanceof Error ? error.message : String(error)}`);
            }
        },
    );

    context.subscriptions.push(startDistCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
    // httpManager.close();
}
