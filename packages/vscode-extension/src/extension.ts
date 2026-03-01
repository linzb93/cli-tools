// The module 'vscode' contains the VS Code extensibility API
import { ExtensionContext } from 'vscode';
import { webSocketManager } from './infra/websocket';
import './api';

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
export function activate(context: ExtensionContext) {
    webSocketManager.init(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
    webSocketManager.close();
}
