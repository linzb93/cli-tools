import BaseCommand from '@/common/BaseCommand';
import chalk from 'chalk';
import { isWin } from '@/common/constant';

interface IShortcutItem {
    title: string;
    windows: string;
    mac: string;
    type?: 'vscode' | 'chrome';
}

export default class Shortcut extends BaseCommand {
    constructor(private name: string) {
        super();
    }
    main() {
        const shortcutMap: IShortcutItem[] = [
            {
                title: '切换至下一个页面',
                windows: 'ctrl + page down',
                mac: 'shift + cmd + ]',
            },
            {
                title: '切换至上一个页面',
                windows: 'ctrl + page up',
                mac: 'shift + cmd + [',
            },
            {
                title: '窗口最大化',
                windows: 'windows + up',
                mac: '无',
            },
            {
                title: '关闭窗口',
                windows: 'shift + ctrl + w',
                mac: 'shift + cmd + w',
            },
            {
                title: '主副屏切换',
                windows: 'shift + alt + right',
                mac: '无',
            },
            {
                title: '截图',
                windows: 'ctrl + a',
                mac: 'shift + command + 2',
            },

            {
                title: '新窗口打开项目',
                windows: 'ctrl + r',
                mac: 'ctrl + r',
                type: 'vscode',
            },
            {
                title: '聚焦编辑器',
                windows: 'ctrl + page down',
                mac: 'shift + cmd + ]',
                type: 'vscode',
            },
            {
                title: '聚焦文件资源管理器（自定义）',
                windows: 'alt + `',
                mac: 'option + `',
                type: 'vscode',
            },
            {
                title: '从文件资源管理器打开文件',
                windows: 'space',
                mac: 'space',
                type: 'vscode',
            },
            {
                title: '从文件资源管理器新建文件',
                windows: 'ctrl + alt + n',
                mac: 'ctrl + option + n(自定义)',
                type: 'vscode',
            },
            {
                title: '从文件资源管理器新建文件夹',
                windows: 'ctrl + shift + alt + n',
                mac: 'ctrl + option + cmd + n(自定义)',
                type: 'vscode',
            },
            {
                title: '将编辑器移动到下一个编辑器组',
                windows: 'ctrl + alt + right',
                mac: '',
                type: 'vscode',
            },
            {
                title: '拆分编辑器',
                windows: 'ctrl + \\',
                mac: 'cmd + \\',
                type: 'vscode',
            },
            {
                title: '聚焦终端',
                windows: 'ctrl + j',
                mac: 'control + `',
                type: 'vscode',
            },
            {
                title: '新建终端',
                windows: 'ctrl + shift + `',
                mac: 'shift + ctrl + `',
                type: 'vscode',
            },
            {
                title: '清除终端内容',
                windows: 'ctrl + k',
                mac: 'cmd + k',
                type: 'vscode',
            },
            {
                title: '新建标签',
                windows: 'ctrl + t',
                mac: 'command + t',
                type: 'chrome',
            },
        ];
        if (!this.name) {
            console.log();
            console.log(
                shortcutMap.map((item) => `${chalk.blue(item.title)} ${isWin ? item.windows : item.mac}`).join('\n  ')
            );
        } else {
            if (!['chrome', 'vscode'].includes(this.name)) {
                this.logger.error('不存在的平台，只支持vscode和chrome');
            } else {
                // const list = [map[0], map.find((panel) => panel.type === this.name)];
                // const flatList = list.reduce((acc, panel) => acc.concat(panel.children), []);
                // console.log(
                //     flatList.map((item) => `${chalk.blue(item.title)} ${isWin ? item.windows : item.mac}`).join('\n')
                // );
            }
        }
    }
}
