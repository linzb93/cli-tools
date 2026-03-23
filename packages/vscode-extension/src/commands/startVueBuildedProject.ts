import * as vscode from 'vscode';

/**
 * 注册 mycli.startVueBuildedProject 命令
 * 当在资源管理器中右键点击 dist 目录时触发，向本地服务器发送 POST 请求启动打包后的项目。
 *
 * @param {vscode.ExtensionContext} context - 扩展上下文，用于注册命令的生命周期管理
 */
export function registerStartVueBuildedProjectCommand(context: vscode.ExtensionContext) {
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
