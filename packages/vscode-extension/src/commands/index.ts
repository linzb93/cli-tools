import * as vscode from 'vscode';
import { registerCopyFilePathAndLineCommand } from './copyFilePathAndLine';
import { registerStartVueBuildedProjectCommand } from './startVueBuildedProject';

/**
 * 统一注册所有扩展命令
 *
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
export function registerAllCommands(context: vscode.ExtensionContext) {
    registerCopyFilePathAndLineCommand(context);
    registerStartVueBuildedProjectCommand(context);
}
