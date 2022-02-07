import inquirer, { CheckboxQuestion } from 'inquirer';
import ora from 'ora';
import pMap from 'p-map';
import BaseCommand from '../../../util/BaseCommand.js';
import { reactive } from '@vue/reactivity';
import { watch } from '@vue/runtime-core';
import git from '../../../util/git.js';

export default class extends BaseCommand {
  async run() {
    const tags = await git.tag();
    if (!tags.length) {
      this.logger.info('没有tag可以删除');
      return;
    }
    this.logger.clearConsole();
    const { selected } = await inquirer.prompt({
      message: '请选择需要删除的tag',
      name: 'selected',
      type: 'checkbox',
      choices: tags,
      c1: 2
    } as CheckboxQuestion);
    if (selected.length) {
      const spinner = ora('开始删除').start();
      const successTags = reactive([]) as string[];
      const errorTags = reactive([]) as { tag: string; errorMessage: string }[];
      watch(successTags, (value) => {
        spinner.text = `删除成功${value.length}个，失败${errorTags.length}个`;
      });
      watch(errorTags, (value) => {
        spinner.text = `删除成功${successTags.length}个，失败${value.length}个`;
      });
      await pMap(
        selected,
        async (tag: string) => {
          try {
            await Promise.all([
              git.deleteTag(tag),
              git.deleteTag(tag, { includeRemote: true })
            ]);
          } catch (error) {
            errorTags.push({
              tag,
              errorMessage: (error as Error).message
            });
            return;
          }
          successTags.push(tag);
        },
        { concurrency: 5 }
      );
      spinner.succeed();
      if (errorTags.length) {
        this.logger.error(errorTags.join(','));
      }
      return;
    }
    this.logger.info('未选中需要删除的tag');
  }
}
