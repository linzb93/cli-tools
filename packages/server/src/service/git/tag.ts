import clipboard from 'clipboardy';
import chalk from 'chalk';
import { last } from 'lodash-es';
import pMap from 'p-map';
import BaseCommand from '@/common/BaseCommand';
import { getTags, deleteTag, syncTags } from './shared';
import { sequenceExec } from '@/common/promiseFn';
import gitAtom from './atom';
import { getProjectName } from '@/common/jenkins';

export interface Options {
    /**
     * @default false
     * 是否进入批量删除标签模式。一般用不上，公司会定期清理。
     */
    delete?: boolean;
    /**
     * 获取最后几个标签
     */
    last?: number;
    /**
     * 输出最后一个标签。
     */
    get?: boolean;
    help?: boolean;
    /**
     * 同步当前标签
     */
    sync?: boolean;
    /**
     * 获取前面几个标签，在批量删除标签模式使用
     */
    head?: number;
    /**
     * 一个项目可以打多种tag，默认是v开头的
     */
    type?: string;
}

export default class extends BaseCommand {
    async main(data: string, options: Options) {
        if (options.delete) {
            await this.batchDelete(options);
            return;
        }
        if (options.sync) {
            await this.syncCurrentTags();
            return;
        }
        const gitTags = await getTags();
        // 输出最近几个
        if (options.last) {
            this.logger.success(`找到最近${options.last}个：\n${gitTags.slice(-Number(options.last)).join('\n')}`);
            return;
        }
        if (options.get) {
            if (!gitTags.length) {
                this.logger.success('该项目没有tag');
            } else {
                const last = gitTags.slice(-1)?.[0];
                this.logger.success(last);
                clipboard.writeSync(last);
            }
            return;
        }
        let tag = '';
        const input = data;
        if (!input) {
            tag = await this.generateNewestTag(options);
        } else {
            tag = input.startsWith('v') ? input : `v${input}`;
        }
        await sequenceExec([`git tag ${tag}`, `git push origin ${tag}`]);
        const { onlineId } = await getProjectName();
        const copyText = `${onlineId}，${tag}`;
        this.logger.success(`部署成功，复制填入更新文档：${chalk.cyan(copyText)}`);
        clipboard.writeSync(copyText);
    }
    /**
     * 生成最新的tag
     */
    async generateNewestTag(options: Options): Promise<string> {
        const gitTags = await getTags();
        if (gitTags.length === 0) {
            return '';
        }
        const prefix = options.type || 'v';
        const lastTag = this.gitCurrentLatestTag(gitTags, prefix);
        const [firstNum, secondNum, thirdNum, lastNum] = lastTag.split('.');
        if (lastTag.split('.').length === 3) {
            return `${lastTag}.1`;
        }
        return `${firstNum}.${secondNum}.${thirdNum}.${Number(lastNum) + 1}`;
    }
    /**
     * 获取最近的一次tag
     * @param tags
     * @returns
     */
    private gitCurrentLatestTag(tags: string[], prefix: string): string {
        const filterTags = tags.filter((tag) => tag.startsWith(prefix)).map((tag) => tag.replace(prefix, ''));
        const sortedTags = filterTags.sort((a, b) => {
            const aArr = a.split('.').map((item) => Number(item));
            const bArr = b.split('.').map((item) => Number(item));
            for (let i = 0; i < aArr.length; i++) {
                if (aArr[i] === bArr[i]) {
                    continue;
                }
                return aArr[i] - bArr[i];
            }
            return 0;
        });
        return sortedTags.at(-1);
    }
    /**
     * 批量删除分支
     */
    private async batchDelete(options: Options) {
        this.spinner.text = '正在获取所有标签';
        await sequenceExec([gitAtom.pull()]);
        const tags = await getTags();
        if (!tags) {
            this.spinner.succeed('没有标签需要删除');
            return;
        }
        let selected: string[] = [];
        if (options.head) {
            this.spinner.stop();
            const list = tags.slice(0, Number(options.head));
            this.logger.info(`您需要删除的标签有：${list.join(',')}`);
            const answer = await this.inquirer.prompt({
                message: '确认删除？',
                type: 'confirm',
                name: 'is',
            });
            if (answer.is) {
                selected = list;
            }
        } else {
            const answer = await this.inquirer.prompt({
                message: '请选择要删除的标签',
                type: 'checkbox',
                choices: tags,
                name: 'selected',
            });
            selected = answer.selected;
        }
        if (!selected.length) {
            this.spinner.fail('您没有选择任何标签，已退出');
            return;
        }
        this.spinner.text = '开始删除';
        await pMap(
            selected,
            async (item: string) => {
                await deleteTag(item);
                try {
                    deleteTag(item, { remote: true });
                } catch (error) {
                    return;
                }
            },
            { concurrency: 3 }
        );
        this.spinner.succeed('删除成功');
    }
    private async syncCurrentTags() {
        await syncTags();
        this.logger.success('同步成功');
    }
}
