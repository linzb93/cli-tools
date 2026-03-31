import * as vscode from 'vscode';

/**
 * 注册 mycli.copyFilePathAndLine 命令
 * 该命令会获取当前激活的文本编辑器中的文件路径和选中的行号，
 * 并将其格式化后复制到系统剪贴板。
 *
 * @param {vscode.ExtensionContext} context - 扩展上下文，用于注册命令的生命周期管理
 */
export function registerCopyFilePathAndLineCommand(context: vscode.ExtensionContext) {
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
            const closeMessageHandler = vscode.window.showInformationMessage('文件地址和行号已复制到剪贴板！');

            // 3秒后自动关闭提示
            setTimeout(() => {
                if (closeMessageHandler) {
                    closeMessageHandler.then(() => {
                        // 提示已关闭
                    });
                }
            }, 3000);
        }
    });

    context.subscriptions.push(copyCommand);
}
