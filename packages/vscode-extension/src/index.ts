// The module 'vscode' contains the VS Code extensibility API
import { ExtensionContext } from 'vscode';
import { httpManager } from './infra/http';
import './api';

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
export function activate(context: ExtensionContext) {
    httpManager.init(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
    httpManager.close();
}
