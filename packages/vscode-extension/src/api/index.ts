import * as vscode from 'vscode';
import router from '../infra/router';

interface NvmSwitchQuery {
    version: string;
}

router.post('nvm-switch', async (query: NvmSwitchQuery) => {
    const { version } = query;
    if (version) {
        let terminal = vscode.window.activeTerminal;

        // if (vscode.window.activeTerminal) {
        //     // 如果有活跃终端，则拆分
        //     const p = new Promise<vscode.Terminal>((resolve) => {
        //         const disposable = vscode.window.onDidOpenTerminal((t) => {
        //             disposable.dispose();
        //             resolve(t);
        //         });
        //         vscode.commands.executeCommand('workbench.action.terminal.split');
        //     });
        //     terminal = await p;
        // } else {
        //     // 否则创建新终端
        //     terminal = vscode.window.createTerminal();
        // }

        // 等待终端关闭的 Promise
        // const closePromise = new Promise<void>((resolve) => {
        //     const disposable = vscode.window.onDidCloseTerminal((t) => {
        //         if (t === terminal) {
        //             disposable.dispose();
        //             resolve();
        //         }
        //     });
        // });

        // 运行命令并退出
        // 使用 setTimeout 稍作延迟确保终端 shell 准备就绪
        setTimeout(() => {
            terminal && terminal.sendText(`nvm use ${version}`);
        }, 200);

        // await closePromise;

        // 返回响应数据
        return { status: 'success', message: `Finished nvm use ${version}` };
    }
});
