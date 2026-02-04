import { BaseService } from '@cli-tools/shared/src/base/BaseService';
import chalk from 'chalk';
import { isWin } from '@cli-tools/shared/src/utils/constant';
import { groupBy } from 'lodash-es';

interface IShortcutItem {
    title: string;
    windows: string;
    mac: string;
    type: 'all' | 'vscode' | 'chrome';
}

export class ShortcutService extends BaseService {
    private name: string;
    main(name: string) {
        this.name = name;
        const shortcutMap: IShortcutItem[] = [
            {
                title: '切换至下一个页面',
                windows: 'ctrl + page down',
                mac: 'shift + cmd + ]',
                type: 'all',
            },
            {
                title: '切换至上一个页面',
                windows: 'ctrl + page up',
                mac: 'shift + cmd + [',
                type: 'all',
            },
            {
                title: '窗口最大化',
                windows: 'windows + up',
                mac: '无',
                type: 'all',
            },
            {
                title: '关闭窗口',
                windows: 'shift + ctrl + w',
                mac: 'shift + cmd + w',
                type: 'all',
            },
            {
                title: '主副屏切换',
                windows: 'shift + window + right',
                mac: '无',
                type: 'all',
            },
            {
                title: '截图',
                windows: 'ctrl + a',
                mac: 'shift + command + 2',
                type: 'all',
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
        const grouped = groupBy(shortcutMap, 'type') as {
            all: IShortcutItem[];
            chrome: IShortcutItem[];
            vscode: IShortcutItem[];
        };
        if (!this.name) {
            const data = Object.keys(grouped) as (keyof typeof grouped)[];
            console.log(
                data
                    .map((key) => {
                        return `${chalk.bold.red(key)}
${chalk.red(`-------------------`)}
${grouped[key].map((item) => this.renderItem(item)).join('\n')}`;
                    })
                    .join('\n\n'),
            );
        } else if (['chrome', 'vscode'].includes(this.name)) {
            let arr = [];
            if (this.name === 'vscode') {
                arr = [...grouped.all, ...grouped.vscode];
            } else if (this.name === 'chrome') {
                arr = [...grouped.all, ...grouped.chrome];
            }
            console.log(arr.map((item) => this.renderItem(item)).join('\n'));
        } else {
            const filters = shortcutMap.filter((item) => item.title.includes(this.name));
            if (!filters.length) {
                this.logger.info('没找到快捷键');
                return;
            }
            console.log(filters.map((item) => this.renderItem(item)).join('\n'));
        }
    }
    private renderItem(item: IShortcutItem) {
        return `${chalk.cyan(item.title)} ${isWin ? item.windows : item.mac}`;
    }
}
