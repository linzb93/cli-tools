// The module 'vscode' contains the VS Code extensibility API
import { ExtensionContext, window } from 'vscode';
import { httpManager } from './infra/http';
import './api';

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
export function activate(context: ExtensionContext) {
    let terminal = window.activeTerminal;
    if (!terminal) {
        terminal = window.createTerminal();
    }
    terminal.sendText(`mycli server`);
    httpManager.init(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
    httpManager.close();
}
