// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
// import { httpManager } from './infra/http';
import './api';
import { registerAllCommands } from './commands';

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 *
 * @param {vscode.ExtensionContext} context - The context of the extension
 */
export function activate(context: vscode.ExtensionContext) {
    // httpManager.init(context);

    // 统一注册所有命令
    registerAllCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
    // httpManager.close();
}
