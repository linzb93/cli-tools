import inquirer, { CheckboxQuestion } from 'inquirer';
import pMap from 'p-map';
import BaseCommand from '../../../util/BaseCommand.js';
import { reactive } from '@vue/reactivity';
import { watch } from '@vue/runtime-core';

export default class extends BaseCommand {
  async run() {
    const tags = await this.git.tag();
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
      this.spinner.text = '开始删除';
      const successTags = reactive([]) as string[];
      const errorTags = reactive([]) as { tag: string; errorMessage: string }[];
      watch(successTags, (value) => {
        this.spinner.text = `删除成功${value.length}个，失败${errorTags.length}个`;
      });
      watch(errorTags, (value) => {
        this.spinner.text = `删除成功${successTags.length}个，失败${value.length}个`;
      });
      await pMap(
        selected,
        async (tag: string) => {
          try {
            await Promise.all([
              this.git.deleteTag(tag),
              this.git.deleteTag(tag, { includeRemote: true })
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
      this.spinner.succeed();
      if (errorTags.length) {
        this.logger.error(errorTags.join(','));
      }
      return;
    }
    this.logger.info('未选中需要删除的tag');
  }
}
